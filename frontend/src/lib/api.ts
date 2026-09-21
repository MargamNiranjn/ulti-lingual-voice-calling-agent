import axios from "axios";

// Prefer configured cloud backend URL, fallback to localhost for development
let API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

if (API_URL.endsWith("/")) {
  API_URL = API_URL.slice(0, -1);
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT access token to every request if it exists
api.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("leadsense_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
export { API_URL };
