import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Make sure this matches your backend
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,  // Important for CORS
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Making API request to:', config.baseURL + config.url);
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.status);
    return response;
  },
  (error) => {
    console.error('API Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export default api;
