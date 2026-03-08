import React, { useState } from "react";
import axios from "axios";
import config from "../config/config";
import { useNavigate } from "react-router-dom";
import Lottie from "lottie-react";
import loadingAnimation from "../images/lottie/lottie-loading-money.json";

// Better: import images instead of using /src/... path
import loginBg from "../images/ExpenseManagement_BGOnly2.png";
import spendFlowLogo from "../images/spendflow_title_and_logo3.png";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(`${config.apiBaseUrl}/auth/login`, {
        username,
        password,
      });

      if (response.data?.status === "MFA_REQUIRED") {
        const { methods = [], preAuthToken } = response.data;
        sessionStorage.setItem("mfa_methods", JSON.stringify(methods));
        sessionStorage.setItem("mfa_preAuth", preAuthToken);
        sessionStorage.setItem("mfa_mode", "verify");
        setLoading(false);
        return navigate("/mfa", {
          state: { methods, preAuthToken, mode: "verify" },
        });
      }

      if (response.data?.status === "MFA_ENROLL_REQUIRED") {
        const { methods = [], preAuthToken } = response.data;
        sessionStorage.setItem("mfa_methods", JSON.stringify(methods));
        sessionStorage.setItem("mfa_preAuth", preAuthToken);
        sessionStorage.setItem("mfa_mode", "enroll");
        setLoading(false);
        return navigate("/mfa", {
          state: { methods, preAuthToken, mode: "enroll" },
        });
      }

      const {
        id,
        accessToken,
        refreshToken,
        name,
        email,
        roles,
        company,
        profilePicture,
      } = response.data;

      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", refreshToken);
      localStorage.setItem("userId", id);
      localStorage.setItem(
        "user",
        JSON.stringify({ id, name, email, roles, company, profilePicture })
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900/75">
        <Lottie animationData={loadingAnimation} style={{ width: 400, height: 400 }} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center px-4"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      <div className="flex flex-col items-center gap-6 sm:gap-8">

        {/* Logo */}
        <img
          src={spendFlowLogo}
          alt="SpendFlow Logo"
          className="w-72 sm:w-96 md:w-[28rem] lg:w-[34rem] xl:w-[50rem] h-auto object-contain drop-shadow-[0_0_25px_rgba(59,130,246,0.5)]"
        />

        {/* Login Form */}
        <div className="relative bg-white/20 backdrop-blur-xl rounded-xl p-6 sm:p-8 shadow-xl w-full max-w-md border border-white/30 transition duration-500 hover:scale-[1.02]">
          <form onSubmit={handleLogin}>
            {error && (
              <p className="mb-4 text-sm text-red-200 bg-red-500/20 border border-red-300/30 rounded-md px-3 py-2">
                {error}
              </p>
            )}

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
              className="w-full py-2 bg-gradient-to-r from-blue-500 to-green-400 text-white rounded-lg hover:scale-[1.02] transition duration-300 shadow-md"
            >
              Login
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;