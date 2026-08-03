import axios from "axios";
import { getCookie, removeCookie } from "./cookie";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://localhost:3000/api",
  timeout: 10000,
});

API.interceptors.request.use(
  async (config) => {
    const token = getCookie("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    
    config.withCredentials = true;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNREFUSED') {
      console.error('Network error - Backend server might not be running');
      console.error('Please ensure the backend server is running on https://localhost:3000');
      return Promise.reject(new Error('Backend server is not accessible. Please check if the server is running.'));
    }
    
    if (error.response && error.response.status === 401) {
      removeCookie("token");
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default API;
