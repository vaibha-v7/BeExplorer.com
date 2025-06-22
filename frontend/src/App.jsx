import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import ListingGrid from './components/ListingGrid';
import ListingDetail from './components/ListingDetail';
import { listingService, authService } from './services/api';
import './App.css';

function App() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [selectedListingId, setSelectedListingId] = useState(null);

  useEffect(() => {
    checkAuthStatus();
    fetchListings();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.loggedIn) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setAuthLoading(false);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listingService.getAllListings();
      setListings(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching listings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUserChange = (userData) => {
    setUser(userData);
  };

  const handleListingClick = (listingId) => {
    setSelectedListingId(listingId);
  };

  const handleCloseDetail = () => {
    setSelectedListingId(null);
  };

  const handleListingUpdate = (updatedListing) => {
    setListings(prevListings => 
      prevListings.map(listing => 
        listing._id === updatedListing._id ? updatedListing : listing
      )
    );
  };

  const handleListingDelete = (deletedListingId) => {
    setListings(prevListings => 
      prevListings.filter(listing => listing._id !== deletedListingId)
    );
  };

  const handleListingCreated = (newListing) => {
    setListings(prevListings => [newListing, ...prevListings]);
  };

  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="App">
      <Header 
        user={user} 
        onUserChange={handleUserChange}
        onListingCreated={handleListingCreated}
      />
      <main className="main-content">
        <div className="hero-section">
          <div className="hero-content">
            <h1>Discover Your Dream Property</h1>
            <p>Explore amazing properties in prime locations with the best prices</p>
          </div>
        </div>
        <section className="listings-section">
          <div className="container">
            <h2>Featured Properties</h2>
            <ListingGrid 
              listings={listings} 
              loading={loading} 
              error={error}
              onListingClick={handleListingClick}
            />
          </div>
        </section>
      </main>

      <Footer />

      {selectedListingId && (
        <ListingDetail
          listingId={selectedListingId}
          onClose={handleCloseDetail}
          onListingUpdate={handleListingUpdate}
          onListingDelete={handleListingDelete}
        />
      )}
    </div>
  );
}

export default App;
