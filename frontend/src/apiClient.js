// frontend/src/apiClient.js
import axios from "axios";

// Automatically switches between your live Render backend and your local test environment
export const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? "https://careerpathfullstack.onrender.com" 
  : "http://localhost:5000";

const API_BASE_URL = `${BACKEND_URL}/api`;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;