import React from 'react';
import ListingCard from './ListingCard';
import './ListingGrid.css';

const ListingGrid = ({ listings, loading, error, onListingClick }) => {
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading properties...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading properties</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!listings || listings.length === 0) {
    return (
      <div className="no-listings">
        <h3>No properties found</h3>
        <p>There are no properties available at the moment.</p>
      </div>
    );
  }

  return (
    <div className="listing-grid">
      {listings.map((listing) => (
        <ListingCard 
          key={listing._id} 
          listing={listing} 
          onClick={onListingClick}
        />
      ))}
    </div>
  );
};

export default ListingGrid; 