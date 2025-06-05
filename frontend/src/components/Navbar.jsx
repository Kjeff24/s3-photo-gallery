import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaCamera, FaHome, FaPlus } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <FaCamera />
          Photo Blog
        </Link>
        <div className="navbar-nav">
          <Link 
            to="/" 
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <FaHome />
            Home
          </Link>
          <Link 
            to="/upload" 
            className={`nav-link ${location.pathname === '/upload' ? 'active' : ''}`}
          >
            <FaPlus />
            Upload
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
