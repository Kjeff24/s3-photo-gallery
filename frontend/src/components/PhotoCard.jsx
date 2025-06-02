import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaMapMarkerAlt, FaCamera } from 'react-icons/fa';

const PhotoCard = ({ photo }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/photo/${photo._id}`);
  };

  return (
    <div className="photo-card" onClick={handleClick}>
      <img 
        src={photo.imageUrl} 
        alt={photo.title} 
        className="photo-card-image"
      />
      <div className="photo-card-content">
        <h3 className="photo-card-title">{photo.title}</h3>
        <p className="photo-card-description">{photo.description}</p>
        
        {photo.tags && photo.tags.length > 0 && (
          <div className="photo-card-tags">
            {photo.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="photo-tag">
                {tag}
              </span>
            ))}
          </div>
        )}
        
        <div className="photo-card-footer">
          <div style={{ display: 'flex', gap: '1rem', fontSize: '0.875rem', color: 'var(--text-light)' }}>
            {photo.location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FaMapMarkerAlt />
                {photo.location}
              </span>
            )}
            {photo.camera && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <FaCamera />
                {photo.camera}
              </span>
            )}
          </div>
          <div className="photo-likes">
            <FaHeart color="#ef4444" />
            {photo.likes}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoCard;
