import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import fs from 'fs';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

const isVercel = !!process.env.VERCEL;
const UPLOADS_DIR = isVercel ? '/tmp/uploads' : path.resolve(__dirname, '../../uploads');
const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');
const LISTINGS_DIR = path.join(UPLOADS_DIR, 'listings');

// Ensure upload directories exist
fs.mkdirSync(AVATARS_DIR, { recursive: true });
fs.mkdirSync(LISTINGS_DIR, { recursive: true });

const BASE_URL = process.env.BACKEND_PUBLIC_URL || `http://localhost:${process.env.PORT || 3001}`;

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
  }
};

const avatarStorage = multer.diskStorage({
  destination: AVATARS_DIR,
  filename: (req, file, cb) => {
    const user = (req as AuthenticatedRequest).user;
    const ext = path.extname(file.originalname);
    cb(null, `${user.uid}-${Date.now()}${ext}`);
  },
});

const listingStorage = multer.diskStorage({
  destination: LISTINGS_DIR,
  filename: (req, file, cb) => {
    const user = (req as AuthenticatedRequest).user;
    const ext = path.extname(file.originalname);
    cb(null, `${user.uid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`);
  },
});

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadListingImages = multer({
  storage: listingStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
});

function handleMulterError(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'file_too_large', message: 'File exceeds size limit' });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'too_many_files', message: 'Too many files uploaded' });
      return;
    }
    res.status(400).json({ error: 'upload_error', message: err.message });
    return;
  }
  if (err instanceof Error) {
    res.status(400).json({ error: 'upload_error', message: err.message });
    return;
  }
  next(err);
}

// POST /upload/avatar — single avatar image
router.post(
  '/avatar',
  requireAuth,
  uploadAvatar.single('file'),
  handleMulterError,
  (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'no_file', message: 'No image file provided' });
      return;
    }
    const url = `${BASE_URL}/uploads/avatars/${req.file.filename}`;
    res.json({ url });
  },
);

// POST /upload/listing-images — up to 5 listing images
router.post(
  '/listing-images',
  requireAuth,
  uploadListingImages.array('images', 5),
  handleMulterError,
  (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'no_files', message: 'No image files provided' });
      return;
    }
    const urls = files.map((f) => `${BASE_URL}/uploads/listings/${f.filename}`);
    res.json({ urls });
  },
);

export default router;
