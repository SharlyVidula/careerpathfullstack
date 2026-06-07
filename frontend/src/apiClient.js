// frontend/src/apiClient.js
import axios from "axios";

// Automatically switches between your live Render backend and your local test environment
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? "https://careerpathfullstack.onrender.com/api" 
  : "http://localhost:5000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
});

export default apiClient;