import { httpError } from './http.js';

const CHAT_URL = 'https://api.groq.com/openai/v1/chat/completions';
const MODELS_URL = 'https://api.groq.com/openai/v1/models';

// Groq retires models regularly (llama-3.3-70b-versatile: 16 Aug 2026, llama-4-scout: 17 Jul 2026).
// Old ids that may still sit in someone's .env are skipped automatically instead of causing 404 errors.
const RETIRED = new Set([
  'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama-3.1-70b-versatile', 'llama-3.3-70b-specdec',
  'meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct',
  'qwen/qwen3-32b', 'gemma2-9b-it', 'mixtral-8x7b-32768',
]);

// First working model in each list is used. Override with GROQ_TEXT_MODEL / GROQ_MODEL (comma separated).
const DEFAULTS = {
  text: ['openai/gpt-oss-120b', 'qwen/qwen3.6-27b', 'openai/gpt-oss-20b', 'qwen/qwen3.8-27b'],
  vision: ['qwen/qwen3.6-27b', 'qwen/qwen3.8-27b'],
};
const ENV_KEY = { text: 'GROQ_TEXT_MODEL', vision: 'GROQ_MODEL' };
const NOT_CHAT = /whisper|guard|safeguard|tts|orpheus|playai|embed|moderation/i;

export const aiConfigured = () => {
  const k = process.env.GROQ_API_KEY;
  return Boolean(k) && k !== 'your_groq_key';
};

const working = {};            // kind -> model id that worked last time
const dead = new Map();        // model id -> time until which we skip it
const warned = new Set();

const isDead = (m) => (dead.get(m) || 0) > Date.now();
const markDead = (m) => dead.set(m, Date.now() + 60 * 60 * 1000);

function candidates(kind) {
  const fromEnv = String(process.env[ENV_KEY[kind]] || '').split(',').map((s) => s.trim()).filter(Boolean);
  const clean = fromEnv.filter((m) => {
    if (!RETIRED.has(m)) return true;
    if (!warned.has(m)) { warned.add(m); console.warn(`[ai] ${ENV_KEY[kind]} contains "${m}" which Groq has retired. Ignoring it.`); }
    return false;
  });
  const list = [working[kind], ...clean, ...DEFAULTS[kind]].filter(Boolean);
  return [...new Set(list)].filter((m) => !isDead(m));
}

// Last resort: ask Groq which models this key can really use.
let modelCache = { at: 0, ids: [] };
async function liveModels() {
  if (Date.now() - modelCache.at < 10 * 60 * 1000) return modelCache.ids;
  try {
    const r = await fetch(MODELS_URL, {
      signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    });
    const d = await r.json();
    modelCache = { at: Date.now(), ids: (d.data || []).map((m) => m.id) };
  } catch { modelCache = { at: Date.now(), ids: [] }; }
  return modelCache.ids;
}

const modelMissing = (status, err) =>
  status === 404 || /model_not_found|model_decommissioned|does not exist|decommission/i.test(`${err?.code} ${err?.message}`);

function extractJSON(text) {
  const t = String(text)
    .replace(/<think>[\s\S]*?<\/think>/gi, '')   // some reasoning models print their thoughts
    .replace(/```json|```/gi, '')
    .trim();
  try { return JSON.parse(t); } catch { /* try to cut out the object below */ }
  const a = t.indexOf('{'); const b = t.lastIndexOf('}');
  if (a !== -1 && b > a) return JSON.parse(t.slice(a, b + 1));
  throw new Error('no json');
}

async function callOnce(model, { messages, max_tokens, temperature }) {
  const body = {
    model, temperature, messages,
    max_completion_tokens: max_tokens,
    response_format: { type: 'json_object' },
    // Keeps reasoning models fast and stops their thinking from eating the token budget.
    reasoning_effort: model.startsWith('openai/') ? 'low' : 'none',
  };
  const send = () => fetch(CHAT_URL, {
    method: 'POST',
    signal: AbortSignal.timeout(30000),
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
    body: JSON.stringify(body),
  });
  let r = await send();
  let data = await r.json().catch(() => ({}));
  // Some models reject reasoning_effort: retry once without it.
  if (r.status === 400 && /reasoning/i.test(data.error?.message || '')) {
    delete body.reasoning_effort;
    r = await send();
    data = await r.json().catch(() => ({}));
  }
  return { r, data };
}

/**
 * Calls Groq and always returns parsed JSON (or throws a clean http error).
 * kind: 'text' | 'vision'. Tries several models, so a retired model never breaks the feature.
 */
export async function groqJSON({ kind = 'text', messages, max_tokens = 1200, temperature = 0.3 }) {
  if (!aiConfigured()) throw httpError(503, 'AI is not configured. Add GROQ_API_KEY in server/.env');

  const tried = new Set();
  let list = candidates(kind);
  let discovered = false;

  for (let i = 0; i < list.length; i += 1) {
    const model = list[i];
    if (tried.has(model)) continue;
    tried.add(model);

    let res;
    try {
      res = await callOnce(model, { messages, max_tokens, temperature });
    } catch {
      throw httpError(504, 'AI service did not respond in time. Please try again.');
    }
    const { r, data } = res;

    if (r.ok) {
      const text = data.choices?.[0]?.message?.content;
      if (!text) throw httpError(502, 'AI returned an empty answer, please try again');
      try {
        const out = extractJSON(text);
        working[kind] = model;
        return out;
      } catch {
        throw httpError(502, 'AI returned an invalid answer, please try again');
      }
    }

    console.warn(`[ai] ${model} failed (${r.status}): ${data.error?.message || 'unknown'}`);
    if (modelMissing(r.status, data.error)) {
      markDead(model);
      // Every known model failed: ask Groq what is actually available and try that too.
      if (i === list.length - 1 && !discovered) {
        discovered = true;
        const live = await liveModels();
        const extra = live.filter((m) => !NOT_CHAT.test(m) && !RETIRED.has(m) && !tried.has(m));
        const pick = kind === 'vision' ? extra.filter((m) => /qwen|vision|llama-4/i.test(m)) : extra;
        list = [...list, ...pick];
      }
      continue;
    }
    if (r.status === 401) throw httpError(503, 'AI key is invalid. Check GROQ_API_KEY in server/.env');
    if (r.status === 429) throw httpError(429, 'AI is busy right now (rate limit). Please try again in a minute.');
    throw httpError(502, 'AI service error. Please try again.');
  }

  throw httpError(503, 'No AI model is available for this Groq key. Check your models at console.groq.com or set GROQ_TEXT_MODEL / GROQ_MODEL in server/.env');
}
