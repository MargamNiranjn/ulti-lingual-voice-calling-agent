import axios from "axios";

let API_URL = "http://localhost:8000";

if (typeof window !== "undefined") {
  if (window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
    API_URL = window.location.origin;
  } else {
    API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  }
} else {
  API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
