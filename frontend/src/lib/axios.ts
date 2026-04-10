import axios from 'axios';
import Cookies from 'js-cookie';

// axios instance
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// attach token
api.interceptors.request.use((config) => {
  const token = Cookies.get('token'); // from cookie
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;