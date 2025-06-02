import React, { useState, useEffect } from 'react';
import { FaSearch } from 'react-icons/fa';
import { getTags } from '../api/photoAPI';

const SearchFilter = ({ onSearch, onTagFilter, selectedTag }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tags, setTags] = useState([]);

  useEffect(() => {
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const response = await getTags();
      setTags(response.data);
    } catch (error) {
      console.error('Error loading tags:', error);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  const handleSearchClick = () => {
    onSearch(searchTerm);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      onSearch(searchTerm);
    }
  };

  const handleTagClick = (tag) => {
    onTagFilter(selectedTag === tag ? '' : tag);
  };

  return (
    <div className="search-filter-section">
      <div className="search-filter-container">
        <div style={{ flex: 1, position: 'relative', display: 'flex', gap: '0.5rem' }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <FaSearch 
              style={{ 
                position: 'absolute', 
                left: '1rem', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-light)'
              }} 
            />
            <input
              type="text"
              placeholder="Search photos..."
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={handleKeyPress}
              className="search-input"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
          <button
            onClick={handleSearchClick}
            className="btn btn-primary"
            style={{ 
              padding: '0 1.5rem',
              whiteSpace: 'nowrap'
            }}
          >
            Search
          </button>
        </div>
      </div>
      
      {tags.length > 0 && (
        <div className="tag-filter">
          {tags.map((tag, index) => (
            <button
              key={index}
              className={`tag-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => handleTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchFilter;
