import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPhoto, updatePhoto } from '../api/photoAPI';
import { FaSave } from 'react-icons/fa';
import { toast } from 'react-toastify';

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    location: '',
    camera: '',
  });
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    loadPhoto();
  }, [id]);

  const loadPhoto = async () => {
    try {
      setLoadingData(true);
      const response = await getPhoto(id);
      const photo = response.data;
      setFormData({
        title: photo.title,
        description: photo.description,
        tags: photo.tags ? photo.tags.join(', ') : '',
        location: photo.location || '',
        camera: photo.camera || '',
      });
      setPreview(photo.imageUrl);
    } catch (error) {
      console.error('Error loading photo:', error);
      toast.error('Failed to load photo');
    } finally {
      setLoadingData(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const photoData = {
      title: formData.title,
      description: formData.description,
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      location: formData.location,
      camera: formData.camera,
    };
    
    // Only include file if a new image was selected
    if (image) {
      photoData.file = image;
    }

    try {
      setLoading(true);
      await updatePhoto(id, photoData);
      toast.success('Photo updated successfully!');
      navigate(`/photo/${id}`);
    } catch (error) {
      console.error('Error updating photo:', error);
      toast.error(error.response?.data?.message || 'Failed to update photo');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="container">
        <div className="loading">Loading photo...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="form-container">
        <h2 className="form-title">Edit Photo</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Image (leave empty to keep current)</label>
            <div className="file-input-wrapper">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="file-input"
              />
            </div>
            {preview && (
              <img src={preview} alt="Preview" className="preview-image" />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter photo title"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="form-textarea"
              placeholder="Describe your photo"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="form-input"
              placeholder="e.g., nature, landscape, sunset"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="form-input"
              placeholder="Where was this taken?"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Camera</label>
            <input
              type="text"
              name="camera"
              value={formData.camera}
              onChange={handleChange}
              className="form-input"
              placeholder="Camera model used"
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate(`/photo/${id}`)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <FaSave />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Edit;
