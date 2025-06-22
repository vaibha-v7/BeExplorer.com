import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <section className="social-media-section">
          <a 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-btn" 
            href="https://x.com/V7Vaibhav"
            aria-label="Twitter"
          >
            <i className="fab fa-twitter"></i>
          </a>

          <a 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-btn" 
            href="https://www.instagram.com/vaibha_v7/"
            aria-label="Instagram"
          >
            <i className="fab fa-instagram"></i>
          </a>

          <a 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-btn" 
            href="https://www.linkedin.com/in/vaibhav-patel-8417a6276/"
            aria-label="LinkedIn"
          >
            <i className="fab fa-linkedin-in"></i>
          </a>

          <a 
            target="_blank" 
            rel="noopener noreferrer" 
            className="social-btn" 
            href="https://github.com/vaibha-v7"
            aria-label="GitHub"
          >
            <i className="fab fa-github"></i>
          </a>
        </section>
      </div>

      <div className="copyright-section">
        <p>
          © 2025 Copyright: <span className="company-name">BeExplorer Private Limited</span>
        </p>
      </div>
    </footer>
  );
};

export default Footer; 