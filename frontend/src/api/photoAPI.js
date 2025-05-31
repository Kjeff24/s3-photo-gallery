import axios from 'axios';
import { toast } from 'react-toastify';

// Use environment variable if provided, otherwise use relative URL (same origin)
const BASE_URL = import.meta.env.VITE_API_URL || '';
const API_URL = `${BASE_URL}/api/photos`;

// Add response interceptor to handle unauthorized errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && error.response?.data?.login) {
      // Show info toast before redirecting to login
      toast.info('Please log in to continue', {
        autoClose: 2000,
        onClose: () => {
          window.location.href = error.response.data.login;
        }
      });
      return Promise.reject(error);
    }
    return Promise.reject(error);
  }
);

// Get all photos
export const getPhotos = async (page = 1, limit = 12, search = '', tag = '') => {
  const params = new URLSearchParams();
  params.append('page', page);
  params.append('limit', limit);
  if (search) params.append('search', search);
  if (tag) params.append('tag', tag);
  
  const response = await axios.get(`${API_URL}?${params}`);
  return response.data;
};

// Get single photo
export const getPhoto = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);
  return response.data;
};

// Create photo with presigned URL flow
export const createPhoto = async (photoData) => {
  // Step 1: Get presigned URL from backend
  const { file, title, description, tags, location, camera } = photoData;
  
  const presignedResponse = await axios.post(`${API_URL}/presigned-url`, {
    filename: file.name,
    contentType: file.type,
  });
  
  const { presignedUrl, s3Key } = presignedResponse.data.data;
  
  // Step 2: Upload file directly to S3 using presigned URL
  await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type,
    },
  });
  
  // Step 3: Save photo metadata to backend (backend will generate presigned GET URL)
  const response = await axios.post(API_URL, {
    title,
    description,
    s3Key,
    tags,
    location,
    camera,
  });
  
  return response.data;
};

// Update photo with presigned URL flow
export const updatePhoto = async (id, photoData) => {
  const updatePayload = {
    title: photoData.title,
    description: photoData.description,
    tags: photoData.tags,
    location: photoData.location,
    camera: photoData.camera,
  };
  
  // If a new file is provided, upload it first
  if (photoData.file) {
    // Step 1: Get presigned URL from backend
    const presignedResponse = await axios.post(`${API_URL}/presigned-url`, {
      filename: photoData.file.name,
      contentType: photoData.file.type,
    });
    
    const { presignedUrl, s3Key } = presignedResponse.data.data;
    
    // Step 2: Upload file directly to S3 using presigned URL
    await axios.put(presignedUrl, photoData.file, {
      headers: {
        'Content-Type': photoData.file.type,
      },
    });
    
    // Step 3: Include new s3Key in update (backend will generate presigned GET URL)
    updatePayload.s3Key = s3Key;
  }
  
  // Step 4: Update photo metadata
  const response = await axios.put(`${API_URL}/${id}`, updatePayload);
  return response.data;
};

// Delete photo
export const deletePhoto = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};

// Like photo
export const likePhoto = async (id) => {
  const response = await axios.put(`${API_URL}/${id}/like`);
  return response.data;
};

// Get all tags
export const getTags = async () => {
  const response = await axios.get(`${API_URL}/tags/all`);
  return response.data;
};
