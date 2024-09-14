import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import 'tailwindcss/tailwind.css'; // Ensure Tailwind CSS is imported

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-gray-800 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-gray-300 text-2xl font-bold">Logo</div>
        <div className="md:hidden" onClick={toggleMenu}>
          <i className={isOpen ? 'fas fa-times text-white' : 'fas fa-bars text-white'}></i>
        </div>
        <ul className={`md:flex md:items-center md:justify-between w-full ${isOpen ? 'flex flex-col items-center gap-2 mt-4' : 'hidden md:flex'}`}>
          <li className="nav-item flex-grow md:flex md:justify-center">
            <Link to="/" className="text-white font-bold p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition duration-300 w-full text-center md:w-auto" onClick={toggleMenu}>
              Home
            </Link>
          </li>
          <li className="nav-item flex-grow md:flex md:justify-center">
            <Link to="/monthly-report" className="text-white font-bold p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition duration-300 w-full text-center md:w-auto" onClick={toggleMenu}>
              Monthly Report
            </Link>
          </li>
          <li className="nav-item flex-grow md:flex md:justify-center">
            <Link to="/students" className="text-white font-bold p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition duration-300 w-full text-center md:w-auto" onClick={toggleMenu}>
              Student Management
            </Link>
          </li>
          <li className="nav-item flex-grow md:flex md:justify-center">
            <Link to="/student-events" className="text-white font-bold p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition duration-300 w-full text-center md:w-auto" onClick={toggleMenu}>
              Student Events
            </Link>
          </li>
          <li className="nav-item flex-grow md:flex md:justify-center">
            <Link to="/invoice-generator" className="text-white font-bold p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition duration-300 w-full text-center md:w-auto" onClick={toggleMenu}>
              Invoice
            </Link>
          </li>
          <li className="nav-item flex-grow md:flex md:justify-center">
            <Link to="/student-dashboard/:id" className="text-white font-bold p-2 bg-gray-700 border border-gray-600 rounded hover:bg-gray-600 transition duration-300 w-full text-center md:w-auto" onClick={toggleMenu}>
              Student Dashboard
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;