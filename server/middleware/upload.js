import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { httpError } from '../utils/http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Absolute path: works no matter from which folder you start the server.
export const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const imageOnly = (req, file, cb) =>
  file.mimetype.startsWith('image/') ? cb(null, true) : cb(httpError(400, 'Only image files are allowed'));

const disk = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) ext = '.jpg';
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

const limits = { fileSize: 5 * 1024 * 1024, files: 1 };
export const uploadDisk = multer({ storage: disk, limits, fileFilter: imageOnly });
export const uploadMem = multer({ storage: multer.memoryStorage(), limits, fileFilter: imageOnly });

// The browser-sent mimetype can be faked. Check the real file signature (magic bytes).
export function looksLikeImage(buf) {
  if (!buf || buf.length < 12) return false;
  const jpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const png = buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const gif = buf.subarray(0, 4).toString('latin1') === 'GIF8';
  const webp = buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP';
  return jpg || png || gif || webp;
}

export function verifyDiskImage(file) {
  if (!file) return;
  const fd = fs.openSync(file.path, 'r');
  const head = Buffer.alloc(16);
  fs.readSync(fd, head, 0, 16, 0);
  fs.closeSync(fd);
  if (!looksLikeImage(head)) throw httpError(400, 'This file is not a valid image');
}
