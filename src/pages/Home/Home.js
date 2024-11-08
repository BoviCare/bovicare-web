import React from 'react';
import Navbar from '../../components/Navbar/Navbar';
import './Home.css';

const Home = () => {
  return (
    <div className="home-container">
      <Navbar />
      <div className="content">
        <h1>Bem-vindo à Home</h1>
      </div>
    </div>
  );
};

export default Home;
