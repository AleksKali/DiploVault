import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Options } from '../components/Options';
import './Home.css';
import fon from "../images/fon.jpg";

function Home() {
  const [showDialog, setShowDialog] = useState(false);

  const handleGetStartedClick = () => {
    setShowDialog(true);
  };

  const handleCloseDialog = () => {
    setShowDialog(false);
  };

  return (
    <>
      <div className="home-content">
        <header>
          <h3>Welcome to DiploVault!</h3>
          <h4>DiploVault is a web app that leverages IPFS and blockchain technologies to securely store and verify academic certificates and diplomas, providing users with a trusted platform for instant validation of educational achievements.</h4>
        </header>
        <main>
          <button onClick={handleGetStartedClick}>Get Started</button>
        </main>
      </div>

      {showDialog && (
        <div className="dialog-overlay">
          <div className="dialog">
            <button className="close-dialog" onClick={handleCloseDialog}>
              &times;
            </button>
            <h2>Choose Your Role</h2>
            {Options.map((option, index) => (
              <Link key={index} to={option.url}>
                <button className="role-button">{option.title}</button>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

export default Home;








/*import { Link } from "react-router-dom";
import { Options } from "../components/Options";
import Faculty from "./Faculty";
import Navbar from "../components/Navbar";
import "./Home.css";

function Home() {
  return (
    <>
      <ul className="home-menu">
        {Options.map((item, index) => {
          return (
            <li className="li-home" key={index}>
              <Link to={item.url}>
                <button className="btn-home">{item.title}</button>
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
export default Home;*/