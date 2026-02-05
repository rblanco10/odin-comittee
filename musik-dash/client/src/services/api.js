import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json'
  }
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Let individual callers handle errors; don't force a hard redirect
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: () => {
    window.location.href = `${API_BASE_URL}/api/auth/login`;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/api/auth/logout');
    return response.data;
  }
};

// Stats endpoints
export const statsAPI = {
  getStats: async (timeRange = 'medium_term') => {
    const response = await api.get('/api/stats', {
      params: { timeRange }
    });
    return response.data;
  },
  
  getArtists: async (timeRange = 'medium_term', limit = 20) => {
    const response = await api.get('/api/stats/artists', {
      params: { timeRange, limit }
    });
    return response.data;
  },
  
  getTracks: async (timeRange = 'medium_term', limit = 20) => {
    const response = await api.get('/api/stats/tracks', {
      params: { timeRange, limit }
    });
    return response.data;
  },
  
  getRecent: async (limit = 50) => {
    const response = await api.get('/api/stats/recent', {
      params: { limit }
    });
    return response.data;
  }
};

// Time Machine endpoints
export const timeMachineAPI = {
  searchByYear: async (year, limit = 50) => {
    const response = await api.get(`/api/timemachine/year/${year}`, {
      params: { limit }
    });
    return response.data;
  },
  
  createPlaylist: async (year, trackIds, name, description) => {
    const response = await api.post(`/api/timemachine/year/${year}/playlist`, {
      trackIds,
      name,
      description
    });
    return response.data;
  },
  
  getDecadeOverview: async (decade) => {
    const response = await api.get(`/api/timemachine/decade/${decade}`);
    return response.data;
  }
};

export default api;
