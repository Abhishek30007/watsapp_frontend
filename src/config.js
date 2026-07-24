const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
export const API_BASE = isLocal 
  ? 'http://localhost:5000/api' 
  : (import.meta.env.VITE_API_BASE || 'https://social-backend-umgh.onrender.com/api');
