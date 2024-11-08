import React from 'react';
import { FaHome, FaUser, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="navbar-logo">
        <img src="/logo.svg" alt="Logo" />
      </div>
      <ul className="navbar-menu">
        <li>
          <Link to="/home" className="nav-item">
            <FaHome /> Início
          </Link>
        </li>
        <li>
          <Link to="/profile" className="nav-item">
            <FaUser /> Perfil
          </Link>
        </li>
        <li>
          <Link to="/settings" className="nav-item">
            <FaCog /> Configurações
          </Link>
        </li>
        <li>
          <Link to="/login" className="nav-item">
            <FaSignOutAlt /> Sair
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default Navbar;
