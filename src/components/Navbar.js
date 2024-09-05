import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Navbar.css'; // Adjust the path as necessary

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul>
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <Link to="/monthly-report">Monthly Report</Link>
        </li>
        <li>
          <Link to="/students">Student Management</Link>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
