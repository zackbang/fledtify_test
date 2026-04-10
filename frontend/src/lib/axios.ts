import axios from 'axios';
import Cookies from 'js-cookie';

// Buat instance axios khusus
const api = axios.create({
  baseURL: 'http://localhost:8080/api',
});

// Interceptor: Otomatis menyisipkan Token sebelum request dikirim
api.interceptors.request.use((config) => {
  const token = Cookies.get('token'); // Ambil token hasil login dari js-cookie
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;