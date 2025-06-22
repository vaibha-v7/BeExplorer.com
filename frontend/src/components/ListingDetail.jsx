import React, { useState, useEffect } from 'react';
import { listingService, authService, reviewService } from '../services/api';
import './ListingDetail.css';
import { deleteListing, updateListing } from '../services/api';

const ListingDetail = ({ listingId, onClose, onListingUpdate, onListingDelete }) => {
  const [listing, setListing] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewForm, setReviewForm] = useState({ rating: 0, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    price: '',
    location: '',
    country: ''
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchListing();
    checkCurrentUser();
  }, [listingId]);

  useEffect(() => {
    if (listing) {
      setEditForm({
        title: listing.title,
        description: listing.description,
        price: listing.price,
        location: listing.location,
        country: listing.country
      });
    }
  }, [listing]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const data = await listingService.getListingById(listingId);
      setListing(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentUser = async () => {
    try {
      const response = await authService.getCurrentUser();
      if (response.loggedIn) {
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (reviewForm.rating === 0) {
      alert('Please select a rating');
      return;
    }

    setSubmittingReview(true);
    try {
      await reviewService.addReview(listingId, reviewForm);
      await fetchListing();
      setReviewForm({ rating: 0, comment: '' });
    } catch (error) {
      console.error('Failed to submit review:', error);
      alert(error.message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (window.confirm('Are you sure you want to delete this review?')) {
      try {
        await reviewService.deleteReview(listingId, reviewId);
        await fetchListing();
      } catch (error) {
        console.error('Failed to delete review:', error);
        alert(error.message);
      }
    }
  };

  const handleDeleteListing = async () => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        await deleteListing(listingId);
        onListingDelete(listingId);
        onClose();
      } catch (error) {
        console.error('Failed to delete listing:', error);
        alert(error.message);
      }
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditForm({
      title: listing.title,
      description: listing.description,
      price: listing.price,
      location: listing.location,
      country: listing.country
    });
    setSelectedImage(null);
    setImagePreview(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitEdit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      formData.append('title', editForm.title);
      formData.append('description', editForm.description);
      formData.append('price', editForm.price);
      formData.append('location', editForm.location);
      formData.append('country', editForm.country);
      
      if (selectedImage) {
        formData.append('image', selectedImage);
      }

      const response = await updateListing(listingId, formData);
      setListing(response.data);
      onListingUpdate(response.data);
      setIsEditing(false);
      setSelectedImage(null);
      setImagePreview(null);
    } catch (error) {
      alert(error.message || 'Failed to update listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = user && listing && user._id === listing.owner._id;

  if (loading) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading listing...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="error-container">
            <h3>Error loading listing</h3>
            <p>{error}</p>
            <button onClick={onClose} className="btn btn-secondary">Close</button>
          </div>
        </div>
      </div>
    );
  }

  if (!listing) return null;

  if (isEditing) {
    return (
      <div className="modal-overlay" onClick={handleCancelEdit}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Edit Listing</h2>
            <button className="close-button" onClick={handleCancelEdit}>×</button>
          </div>
          
          <form onSubmit={handleSubmitEdit} className="edit-form">
            <div className="form-group">
              <label>Title:</label>
              <input
                type="text"
                name="title"
                value={editForm.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Description:</label>
              <textarea
                name="description"
                value={editForm.description}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label>Image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <img src={imagePreview} alt="Preview" className="image-preview" />
              )}
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Price:</label>
                <input
                  type="number"
                  name="price"
                  value={editForm.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label>Location:</label>
                <input
                  type="text"
                  name="location"
                  value={editForm.location}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Country:</label>
              <input
                type="text"
                name="country"
                value={editForm.country}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update Listing'}
              </button>
              <button type="button" onClick={handleCancelEdit}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="listing-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{listing.title}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div className="listing-detail-content">
          <div className="listing-image-container">
            <img src={listing.image.url} alt={listing.title} className="listing-detail-image" />
          </div>

          <div className="listing-info">
            <div className="info-item">
              <strong>Owner:</strong> {listing.owner.username}
            </div>
            <div className="info-item">
              <strong>Description:</strong> {listing.description}
            </div>
            <div className="info-item">
              <strong>Price:</strong> ₹{listing.price.toLocaleString("en-IN")}/Night
            </div>
            <div className="info-item">
              <strong>Location:</strong> {listing.location}
            </div>
            <div className="info-item">
              <strong>Country:</strong> {listing.country}
            </div>
          </div>

          {isOwner && (
            <div className="owner-actions">
              <button className="btn btn-dark" onClick={handleEdit}>Edit</button>
              <button 
                className="btn btn-danger" 
                onClick={handleDeleteListing}
              >
                Delete
              </button>
            </div>
          )}

          {user && (
            <div className="review-form-section">
              <h4>Leave a Review</h4>
              <form onSubmit={handleReviewSubmit} className="review-form">
                <div className="rating-section">
                  <label>Rating:</label>
                  <div className="star-rating">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <label key={star} className="star-label">
                        <input
                          type="radio"
                          name="rating"
                          value={star}
                          checked={reviewForm.rating === star}
                          onChange={(e) => setReviewForm({
                            ...reviewForm,
                            rating: parseInt(e.target.value)
                          })}
                        />
                        <span className="star">★</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor="comment">Comment:</label>
                  <textarea
                    id="comment"
                    name="comment"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({
                      ...reviewForm,
                      comment: e.target.value
                    })}
                    required
                    className="form-control"
                    placeholder="Share your experience..."
                  />
                </div>
                <button 
                  type="submit" 
                  className="btn btn-success"
                  disabled={submittingReview}
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          <div className="reviews-section">
            <h4>Reviews ({listing.review.length})</h4>
            {listing.review.length === 0 ? (
              <p>No reviews yet. Be the first to review!</p>
            ) : (
              <div className="reviews-grid">
                {listing.review.map((review) => (
                  <div key={review._id} className="review-card">
                    <div className="review-header">
                      <div className="star-display">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span 
                            key={star} 
                            className={`star ${star <= review.rating ? 'filled' : ''}`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                      <div className="review-author">by {review.author.username}</div>
                    </div>
                    <p className="review-comment">{review.comment}</p>
                    {user && user._id === review.author._id && (
                      <button
                        onClick={() => handleDeleteReview(review._id)}
                        className="btn btn-sm btn-danger"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetail; 