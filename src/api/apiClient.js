import axios from "axios";

// Create a configured axios instance
const apiClient = axios.create({
  // Use the environment variable; fallback to standard local dev ports if missing
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5157",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Attach the JWT Token
apiClient.interceptors.request.use(
  (config) => {
    // Read token from secure storage (localStorage for now)
    const token = localStorage.getItem("authToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Global Error Handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // You can handle global 401 unauth re-directs here later
    if (error.response && error.response.status === 401) {
      console.warn("Unauthorized API call. Attempting to wipe local data...");
      // localStorage.removeItem('jwt_token');
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
