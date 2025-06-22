import axios from 'axios';

const api = axios.create({
  baseURL: 'https://beexplorer-com-piws.onrender.com',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// API service functions
export const listingService = {
  // Get all listings
  getAllListings: async () => {
    try {
      const response = await api.get('/api/listings');
      return response.data.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch listings');
    }
  },

  getListingById: async (id) => {
    try {
      const response = await api.get(`/api/listings/${id}`);
      return response.data.data; // Return the data object from the response
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to fetch listing');
    }
  },

  createListing: async (listingData) => {
    try {
      const formData = new FormData();
      formData.append('title', listingData.title);
      formData.append('description', listingData.description);
      formData.append('price', listingData.price);
      formData.append('location', listingData.location);
      formData.append('country', listingData.country);
      formData.append('image', listingData.image);
      const response = await api.post('/api/listings/new', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to create listing');
    }
  },


  updateListing: async (id, listingData) => {
    try {
      const response = await api.patch(`/listings/${id}/edit`, listingData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to update listing');
    }
  },


  deleteListing: async (id) => {
    try {
      const response = await api.delete(`/listings/${id}/delete`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete listing');
    }
  },
};


export const reviewService = {
  // Add a review to a listing
  addReview: async (listingId, reviewData) => {
    try {
      const response = await api.post(`/api/listings/${listingId}/review`, reviewData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to add review');
    }
  },


  deleteReview: async (listingId, reviewId) => {
    try {
      const response = await api.delete(`/api/listings/${listingId}/review/${reviewId}`);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to delete review');
    }
  },
};


export const authService = {
  signup: async (userData) => {
    const response = await api.post('/api/signup', userData);
    return response.data;
  },
  login: async (userData) => {
    const response = await api.post('/api/login', userData);
    return response.data;
  },
  logout: async () => {
    const response = await api.post('/api/logout');
    return response.data;
  },
  getCurrentUser: async () => {
    const response = await api.get('/api/current_user');
    return response.data;
  },
};

export const updateListing = async (id, formData) => {
  try {
    const response = await api.patch(`/api/listings/${id}/edit`, formData, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to update listing' };
  }
};

export const deleteListing = async (id) => {
  try {
    const response = await api.delete(`/api/listings/${id}/delete`, {
      withCredentials: true
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Failed to delete listing' };
  }
};

export default api; 