import Photo from '../models/Photo.js';
import s3Client from '../config/s3.js';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

// Helper function to generate presigned GET URL for private S3 objects
const generatePresignedGetUrl = async (s3Key) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: s3Key,
  });
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour
};

// @desc    Get all photos
// @route   GET /api/photos
// @access  Public
export const getPhotos = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, search, tag } = req.query;
    
    const offset = (page - 1) * limit;
    let whereClause = {};
    
    // Search functionality
    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }
    
    // Filter by tag
    if (tag) {
      whereClause.tags = { [Op.contains]: [tag] };
    }
    
    const { count, rows: photos } = await Photo.findAndCountAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
    
    // Generate presigned URLs for all photos
    const photosWithPresignedUrls = await Promise.all(
      photos.map(async (photo) => {
        const photoData = photo.toJSON();
        photoData.imageUrl = await generatePresignedGetUrl(photo.s3Key);
        return photoData;
      })
    );
    
    res.status(200).json({
      success: true,
      data: photosWithPresignedUrls,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      total: count,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single photo
// @route   GET /api/photos/:id
// @access  Public
export const getPhoto = async (req, res, next) => {
  try {
    const photo = await Photo.findByPk(req.params.id);
    
    if (!photo) {
      res.status(404);
      throw new Error('Photo not found');
    }
    
    // Generate presigned URL for the photo
    const photoData = photo.toJSON();
    photoData.imageUrl = await generatePresignedGetUrl(photo.s3Key);
    
    res.status(200).json({
      success: true,
      data: photoData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new photo
// @route   POST /api/photos
// @access  Public
export const createPhoto = async (req, res, next) => {
  try {
    const { title, description, s3Key, tags, location, camera } = req.body;
    
    // Validate required fields
    if (!s3Key) {
      res.status(400);
      throw new Error('S3 key is required');
    }
    
    // Parse tags if they come as a string
    let parsedTags = tags;
    if (typeof tags === 'string') {
      parsedTags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // Create photo document (only store s3Key, not presigned URL)
    const photo = await Photo.create({
      title,
      description,
      imageUrl: s3Key, // Store s3Key as placeholder, generate presigned URL on read
      s3Key,
      tags: parsedTags || [],
      location,
      camera,
    });
    
    // Return photo with fresh presigned URL
    const photoData = photo.toJSON();
    photoData.imageUrl = await generatePresignedGetUrl(s3Key);
    
    res.status(201).json({
      success: true,
      data: photoData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update photo
// @route   PUT /api/photos/:id
// @access  Public
export const updatePhoto = async (req, res, next) => {
  try {
    let photo = await Photo.findByPk(req.params.id);
    
    if (!photo) {
      res.status(404);
      throw new Error('Photo not found');
    }
    
    // Parse tags if they come as a string
    let tags = req.body.tags;
    if (typeof tags === 'string') {
      tags = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
    }
    
    // Update fields
    const updateData = {
      title: req.body.title || photo.title,
      description: req.body.description || photo.description,
      location: req.body.location || photo.location,
      camera: req.body.camera || photo.camera,
      tags: tags || photo.tags,
    };
    
    // If new s3Key is provided (user uploaded new image via presigned URL)
    if (req.body.s3Key) {
      // Delete old image from S3
      const deleteParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: photo.s3Key,
      };
      await s3Client.send(new DeleteObjectCommand(deleteParams));
      
      updateData.s3Key = req.body.s3Key;
      // imageUrl will be generated on read, so store the s3Key path temporarily
      updateData.imageUrl = `s3://${process.env.S3_BUCKET_NAME}/${req.body.s3Key}`;
    }
    
    await photo.update(updateData);
    
    // Generate presigned URL for response
    const photoData = photo.toJSON();
    photoData.imageUrl = await generatePresignedGetUrl(photo.s3Key);
    
    res.status(200).json({
      success: true,
      data: photoData,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete photo
// @route   DELETE /api/photos/:id
// @access  Public
export const deletePhoto = async (req, res, next) => {
  try {
    const photo = await Photo.findByPk(req.params.id);
    
    if (!photo) {
      res.status(404);
      throw new Error('Photo not found');
    }
    
    // Delete image from S3
    const deleteParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: photo.s3Key,
    };
    await s3Client.send(new DeleteObjectCommand(deleteParams));
    
    // Delete photo from database
    await photo.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Like a photo
// @route   PUT /api/photos/:id/like
// @access  Public
export const likePhoto = async (req, res, next) => {
  try {
    const photo = await Photo.findByPk(req.params.id);
    
    if (!photo) {
      res.status(404);
      throw new Error('Photo not found');
    }
    
    photo.likes += 1;
    await photo.save();
    
    res.status(200).json({
      success: true,
      data: photo,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all unique tags
// @route   GET /api/photos/tags/all
// @access  Public
export const getTags = async (req, res, next) => {
  try {
    const photos = await Photo.findAll({
      attributes: ['tags'],
    });
    
    // Extract unique tags
    const tagsSet = new Set();
    photos.forEach(photo => {
      if (photo.tags && Array.isArray(photo.tags)) {
        photo.tags.forEach(tag => tagsSet.add(tag));
      }
    });
    
    const tags = Array.from(tagsSet).sort();
    
    res.status(200).json({
      success: true,
      data: tags,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate presigned URL for S3 upload
// @route   POST /api/photos/presigned-url
// @access  Public
export const getPresignedUrl = async (req, res, next) => {
  try {
    const { filename, contentType } = req.body;
    
    if (!filename || !contentType) {
      res.status(400);
      throw new Error('Filename and content type are required');
    }
    
    // Generate unique key for S3
    const fileExtension = filename.split('.').pop();
    const s3Key = `photos/${uuidv4()}.${fileExtension}`;
    
    // Create presigned URL for PUT operation (upload)
    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key,
      ContentType: contentType,
    });
    
    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
    
    res.status(200).json({
      success: true,
      data: {
        presignedUrl,
        s3Key,
      },
    });
  } catch (error) {
    next(error);
  }
};

