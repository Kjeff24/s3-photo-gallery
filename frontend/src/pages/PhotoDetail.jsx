import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getPhoto, deletePhoto, likePhoto } from '../api/photoAPI';
import { FaHeart, FaEdit, FaTrash, FaMapMarkerAlt, FaCamera, FaCalendar } from 'react-icons/fa';
import { toast } from 'react-toastify';

const PhotoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhoto();
  }, [id]);

  const loadPhoto = async () => {
    try {
      setLoading(true);
      const response = await getPhoto(id);
      setPhoto(response.data);
    } catch (error) {
      console.error('Error loading photo:', error);
      toast.error('Failed to load photo');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      const response = await likePhoto(id);
      setPhoto(response.data);
      toast.success('Photo liked!');
    } catch (error) {
      console.error('Error liking photo:', error);
      toast.error('Failed to like photo');
    }
  };

  const handleEdit = () => {
    navigate(`/edit/${id}`);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await deletePhoto(id);
        toast.success('Photo deleted successfully');
        navigate('/');
      } catch (error) {
        console.error('Error deleting photo:', error);
        toast.error('Failed to delete photo');
      }
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading photo...</div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="container">
        <div className="empty-state">
          <p className="empty-state-text">Photo not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="photo-detail">
        <img 
          src={photo.imageUrl} 
          alt={photo.title} 
          className="photo-detail-image"
        />
        
        <div className="photo-detail-content">
          <div className="photo-detail-header">
            <h1 className="photo-detail-title">{photo.title}</h1>
            <div className="photo-actions">
              <button className="btn btn-primary" onClick={handleLike}>
                <FaHeart /> Like ({photo.likes})
              </button>
              <button className="btn btn-secondary" onClick={handleEdit}>
                <FaEdit /> Edit
              </button>
              <button className="btn btn-danger" onClick={handleDelete}>
                <FaTrash /> Delete
              </button>
            </div>
          </div>

          <p style={{ marginBottom: '1.5rem', color: 'var(--text-dark)', lineHeight: '1.8' }}>
            {photo.description}
          </p>

          <div className="photo-detail-meta">
            {photo.location && (
              <div className="meta-item">
                <span className="meta-label">
                  <FaMapMarkerAlt style={{ marginRight: '0.25rem' }} />
                  Location
                </span>
                <span className="meta-value">{photo.location}</span>
              </div>
            )}
            
            {photo.camera && (
              <div className="meta-item">
                <span className="meta-label">
                  <FaCamera style={{ marginRight: '0.25rem' }} />
                  Camera
                </span>
                <span className="meta-value">{photo.camera}</span>
              </div>
            )}
            
            <div className="meta-item">
              <span className="meta-label">
                <FaCalendar style={{ marginRight: '0.25rem' }} />
                Uploaded
              </span>
              <span className="meta-value">
                {new Date(photo.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          </div>

          {photo.tags && photo.tags.length > 0 && (
            <div>
              <h3 style={{ marginBottom: '1rem', fontSize: '1.125rem' }}>Tags</h3>
              <div className="photo-card-tags">
                {photo.tags.map((tag, index) => (
                  <span key={index} className="photo-tag" style={{ fontSize: '0.875rem', padding: '0.5rem 1rem' }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PhotoDetail;
