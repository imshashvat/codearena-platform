// FRONTEND: src/lib/axios.ts

import axios from "axios";

const API_URL = "http://localhost:5000/api";

// ✅ Same key as AuthContext
const AUTH_TOKEN_KEY = "auth_token";

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

    // ✅ Read correct token
    const token = localStorage.getItem(AUTH_TOKEN_KEY);

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

    // if (err.response?.status === 401) {

    //   // ✅ Remove correct token
    //   localStorage.removeItem(AUTH_TOKEN_KEY);

    //   window.location.href = "/login";
    // }
    if (err.response?.status === 401) {
  console.error("401 Unauthorized:", err.response?.data);
  }


    return Promise.reject(err);
  }
);

export default api;
