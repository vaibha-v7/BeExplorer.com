import React, { useState } from 'react';
import LoginModal from './LoginModal';
import SignupModal from './SignupModal';
import AddListingModal from './AddListingModal';
import { authService } from '../services/api';
import './Header.css';

const Header = ({ user, onUserChange, onListingCreated }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showAddListingModal, setShowAddListingModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLoginSuccess = (userData) => {
    onUserChange(userData);
  };

  const handleSignupSuccess = (userData) => {
    onUserChange(userData);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      onUserChange(null);
      setIsMobileMenuOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleAddListingClick = () => {
    if (user) {
      setShowAddListingModal(true);
      setIsMobileMenuOpen(false);
    } else {
      setShowLoginModal(true);
      setIsMobileMenuOpen(false);
    }
  };

  const handleListingCreated = (newListing) => {
    onListingCreated(newListing);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="logo">
            <h1>🏠 BeExplorer</h1>
          </div>
          
          <button 
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <nav className={`nav ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
            {user ? (
              <>
                <button onClick={handleAddListingClick} className="nav-link nav-btn">Add New Listing</button>
                <span className="user-info">Welcome, {user.username}!</span>
                <button onClick={handleLogout} className="nav-link nav-btn btn-danger">Logout</button>
              </>
            ) : (
              <>
                <button onClick={() => { setShowSignupModal(true); closeMobileMenu(); }} className="nav-link nav-btn">Signup</button>
                <button onClick={() => { setShowLoginModal(true); closeMobileMenu(); }} className="nav-link nav-btn">Login</button>
              </>
            )}
          </nav>
        </div>
      </header>

      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <SignupModal 
        isOpen={showSignupModal}
        onClose={() => setShowSignupModal(false)}
        onSignupSuccess={handleSignupSuccess}
      />

      <AddListingModal
        isOpen={showAddListingModal}
        onClose={() => setShowAddListingModal(false)}
        onListingCreated={handleListingCreated}
      />
    </>
  );
};

export default Header; 