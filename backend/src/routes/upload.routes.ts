import { Router, Request, Response, NextFunction } from 'express';
import multer, { MulterError } from 'multer';
import path from 'path';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { storage } from '../config/firebase';

const router = Router();

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const imageFilter: multer.Options['fileFilter'] = (_req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
  }
};

// Use memory storage — files are buffered in memory then uploaded to Firebase Storage
const memoryStorage = multer.memoryStorage();

const uploadAvatar = multer({
  storage: memoryStorage,
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: imageFilter,
});

const uploadListingImages = multer({
  storage: memoryStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: imageFilter,
});

async function uploadToFirebase(file: Express.Multer.File, destination: string): Promise<string> {
  const bucket = storage.bucket();
  const blob = bucket.file(destination);

  await blob.save(file.buffer, {
    metadata: {
      contentType: file.mimetype,
    },
  });

  // Make the file publicly readable
  await blob.makePublic();

  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}

function handleMulterError(err: unknown, _req: Request, res: Response, next: NextFunction) {
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'file_too_large', message: 'File is too large. Maximum size is 4 MB.' });
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
  async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ error: 'no_file', message: 'No image file provided' });
      return;
    }
    try {
      const user = (req as AuthenticatedRequest).user;
      const ext = path.extname(req.file.originalname);
      const destination = `avatars/${user.uid}-${Date.now()}${ext}`;
      const url = await uploadToFirebase(req.file, destination);
      res.json({ url });
    } catch (error) {
      console.error('Avatar upload error:', error);
      res.status(500).json({ error: 'upload_failed', message: 'Failed to upload avatar' });
    }
  },
);

// POST /upload/listing-images — up to 5 listing images
router.post(
  '/listing-images',
  requireAuth,
  uploadListingImages.array('images', 5),
  handleMulterError,
  async (req: Request, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'no_files', message: 'No image files provided' });
      return;
    }
    try {
      const user = (req as AuthenticatedRequest).user;
      const urls = await Promise.all(
        files.map((file) => {
          const ext = path.extname(file.originalname);
          const destination = `listings/${user.uid}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}${ext}`;
          return uploadToFirebase(file, destination);
        }),
      );
      res.json({ urls });
    } catch (error) {
      console.error('Listing images upload error:', error);
      res.status(500).json({ error: 'upload_failed', message: 'Failed to upload images' });
    }
  },
);

export default router;
