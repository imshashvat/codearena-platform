// FRONTEND: src/lib/axios.ts
// Single unified API client used everywhere

import axios from "axios";

// Use VITE_API_URL in production (set this on Vercel/Netlify)
// Falls back to localhost for local development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

// Consistent key — matches AuthContext
const TOKEN_KEY = "token";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ============================
// Attach JWT Automatically
// ============================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================
// Auto Logout on 401
// ============================
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export default api;
