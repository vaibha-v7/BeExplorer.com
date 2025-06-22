import React from 'react';
import './ListingCard.css';

const ListingCard = ({ listing, onClick }) => {
  return (
    <div className="listing-card" onClick={() => onClick(listing._id)}>
      <div className="listing-image">
        <img src={listing.image.url} alt={listing.title} />
      </div>
      <div className="listing-content">
        <h3 className="listing-title">{listing.title}</h3>
        <p className="listing-description">{listing.description}</p>
        <div className="listing-details">
          <span className="listing-price">₹{listing.price.toLocaleString("en-IN")}</span>
          <span className="listing-location">{listing.location}, {listing.country}</span>
        </div>
      </div>
    </div>
  );
};

export default ListingCard; 