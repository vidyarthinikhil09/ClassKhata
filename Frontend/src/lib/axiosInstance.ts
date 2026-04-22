import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api', // Pointing to your Express backend
  withCredentials: true, // CRITICAL: This tells the browser to send the secure cookie!
});