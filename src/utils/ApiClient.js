import axios from "axios";
import config from "../config/config";

const getSubdomain = () => {
  const host = window.location.hostname;

  if (host === "localhost" || host.includes("postman")) {
    return "defaultcompany"; // ✅ Handle local development
  }

  const parts = host.split(".");
  if (parts.length > 2) {
    return parts[0]; // ✅ Extract actual subdomain (e.g., "cmhatv" from "cmhatv.baydsolutions.com")
  }
  
  return "defaultcompany"; // Fallback if subdomain is missing
};

// ✅ Dynamically build baseURL using config.apiBaseUrl
const ApiClient = axios.create({
  baseURL: `${config.apiBaseUrl}`,
  headers: { "Content-Type": "application/json" },
});

// ✅ Function to handle logout
const logoutUser = () => {
  console.log("Session expired. Redirecting to login...");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/"; // Redirect to login page
};

// ✅ Add interceptor to refresh token on expiration
ApiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      (error.response.status === 401 || error.response.status === 403) &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      console.log("Access token expired, attempting refresh...");

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          console.error("No refresh token found. Logging out.");
          logoutUser();
          return Promise.reject(error);
        }

        const refreshResponse = await axios.post(`${config.apiBaseUrl}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = refreshResponse.data;

        // ✅ Store both new tokens
        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", newRefreshToken);

        originalRequest.headers["Authorization"] = `Bearer ${accessToken}`;
        return ApiClient(originalRequest);
      } catch (refreshError) {
        console.error("Refresh token invalid or expired. Logging out.");
        logoutUser();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ✅ Attach token to every request
ApiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    console.warn("No access token found in localStorage");
  }
  return config;
});

export default ApiClient;
