import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import { uploadMem, looksLikeImage } from '../middleware/upload.js';
import { aiLimiter } from '../middleware/security.js';
import { asyncHandler, httpError } from '../utils/http.js';
import { groqJSON } from '../utils/groq.js';

const router = Router();
const CATEGORIES = ['wet', 'dry', 'hazardous', 'e-waste', 'mixed'];

router.post('/classify', protect, aiLimiter, uploadMem.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) throw httpError(400, 'Image required');
  if (!looksLikeImage(req.file.buffer)) throw httpError(400, 'This file is not a valid image');

  const dataUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const prompt = `You are a waste management expert. Look at this photo and reply ONLY with JSON:
{"category":"wet|dry|hazardous|e-waste|mixed","confidence":0-100,"tip":"one short disposal tip in simple English"}`;

  const out = await groqJSON({
    kind: 'vision',
    temperature: 0.2,
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: dataUrl } },
      ],
    }],
  });

  // Never trust AI output blindly: clean it before sending to the app.
  const category = CATEGORIES.includes(String(out.category).toLowerCase()) ? String(out.category).toLowerCase() : 'mixed';
  const confidence = Math.min(100, Math.max(0, Math.round(Number(out.confidence) || 0)));
  const tip = String(out.tip || 'Segregate your waste before disposal.').slice(0, 300);
  res.json({ category, confidence, tip });
}));

export default router;
