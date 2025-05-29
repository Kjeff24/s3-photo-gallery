import express from 'express';
import {
  getPhotos,
  getPhoto,
  createPhoto,
  updatePhoto,
  deletePhoto,
  likePhoto,
  getTags,
  getPresignedUrl,
} from '../controllers/photoController.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Get all tags (specific route before dynamic routes)
router.get('/tags/all', getTags);

// Get presigned URL for upload (specific route before dynamic routes)
router.post('/presigned-url', getPresignedUrl);

// CRUD routes
router.route('/')
  .get(getPhotos)
  .post(createPhoto);

router.route('/:id')
  .get(getPhoto)
  .put(updatePhoto)
  .delete(deletePhoto);

// Like route
router.put('/:id/like', likePhoto);

export default router;
