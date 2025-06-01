import React, { useState, useEffect } from 'react';
import PhotoCard from '../components/PhotoCard';
import SearchFilter from '../components/SearchFilter';
import { getPhotos } from '../api/photoAPI';
import { FaImage } from 'react-icons/fa';

const Home = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState('');

  useEffect(() => {
    loadPhotos();
  }, [currentPage, searchTerm, selectedTag]);

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const response = await getPhotos(currentPage, 12, searchTerm, selectedTag);
      setPhotos(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleTagFilter = (tag) => {
    setSelectedTag(tag);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading photos...</div>
      </div>
    );
  }

  return (
    <div className="container">
      <SearchFilter 
        onSearch={handleSearch}
        onTagFilter={handleTagFilter}
        selectedTag={selectedTag}
      />

      {photos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <FaImage />
          </div>
          <p className="empty-state-text">No photos found</p>
          <p style={{ color: 'var(--text-light)' }}>
            {searchTerm || selectedTag 
              ? 'Try adjusting your search or filters' 
              : 'Upload your first photo to get started!'}
          </p>
        </div>
      ) : (
        <>
          <div className="photo-grid">
            {photos.map((photo) => (
              <PhotoCard key={photo._id} photo={photo} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index}
                  className={`pagination-btn ${currentPage === index + 1 ? 'active' : ''}`}
                  onClick={() => handlePageChange(index + 1)}
                >
                  {index + 1}
                </button>
              ))}
              
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Home;
