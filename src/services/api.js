import axios from "axios";
import alertService from "./alert.service";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
});
// Request Interceptor: Auto-attaches JWT Token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token"); // Extracted from context container tracking storage
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Binds Bearer structure cleanly
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// 🚀 FIXED: Global Response Interceptor for Instant Real-Time Lockout
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Intercept 403 Forbidden exceptions coming from a suspended school workspace boundary
    if (error.response && error.response.status === 403) {
      const serverMessage = error.response.data?.message;

      if (serverMessage === "INSTITUTE_SUSPENDED") {
        // 1. Wipe all active token and profile memory parameters from the browser instantly
        localStorage.clear();

        // 2. Present a clean, animated SweetAlert notification pop-up modal
        await alertService.error(
          "Workspace Suspended",
          "Your educational institute workspace has been terminated by the Super Admin. Logging out...",
        );

        // 3. Force hard page redirection right back to the login entrance form view
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  },
);

export default API;
