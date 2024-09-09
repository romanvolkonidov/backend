import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css'; // Adjust the path as necessary

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="menu-icon" onClick={toggleMenu}>
          <i className={isOpen ? 'fas fa-times' : 'fas fa-bars'}></i>
        </div>
        <ul className={isOpen ? 'nav-menu active' : 'nav-menu'}>
          <li className="nav-item">
            <Link to="/" className="nav-links" onClick={toggleMenu}>
              Home
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/monthly-report" className="nav-links" onClick={toggleMenu}>
              Monthly Report
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/students" className="nav-links" onClick={toggleMenu}>
              Student Management
            </Link>
          </li>
          <li className="nav-item">
            <Link to="/student-events" className="nav-links" onClick={toggleMenu}>
              Student Events
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
