import React, { useState } from "react";
import axios from "axios";
import config from "../config/config"; // Importing the API base URL
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import loadingAnimation from "../images/lottie/lottie-loading-money.json"; // Import Lottie animation

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false); // Loading state
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true); // Show loading animation
  
    try {
      const response = await axios.post(`${config.apiBaseUrl}/auth/login`, {
        username,
        password,
      });
  
      const { id, accessToken, refreshToken, name, email, roles, company, profilePicture } = response.data;

      // Store tokens and user data
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", id); // ✅ Store userId in localStorage
      localStorage.setItem(
        "user",
        JSON.stringify({ id, name, email, roles, company, profilePicture }) // ✅ Ensure id is saved in user object
      );
  
      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("An unexpected error occurred. Please try again later.");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 bg-opacity-75">
        <Lottie animationData={loadingAnimation} style={{ width: 400, height: 400 }} />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: "url('/src/images/ExpenseManagement_BGOnly.png')",
      }}
    >
      <div className="absolute top-10 flex justify-center w-full">
        <img
          src="/src/images/ExpenseManagementLogo.png"
          alt="Expense Management Logo"
          className="h-20 sm:h-24 md:h-32 lg:h-80 xl:h-90 2xl:h-100"
        />
      </div>

      <div className="bg-white bg-opacity-20 backdrop-blur-lg rounded-lg p-6 sm:p-8 shadow-lg w-11/12 max-w-sm border border-gray-300 mt-40 sm:mt-48 lg:mt-56">
        <form onSubmit={handleLogin}>
          {error && <p className="mb-4 text-red-500">{error}</p>}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-2 text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="mb-6">
            <input
              type="password"
              placeholder="Password"
              className="w-full px-4 py-2 text-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
