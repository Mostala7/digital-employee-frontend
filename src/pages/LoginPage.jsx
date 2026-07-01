import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import "./LoginPage.css";
import pic3 from "../assets/pic3.png";

const LoginPage = () => {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, setTempPassword } = useAuth();
  const navigate = useNavigate();

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid = isEmailValid && password.trim() !== "";

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await apiClient.post("/api/Auth/login", { email, password });

      const data = response.data; // axios automatically parses JSON

      // Success: Save user state globally via context
      // Extract token and user data based on real backend response
      const userData = {
        id: data.userId,
        email: data.email,
        fullName: data.fullName,
        role: data.role,
        businessId: data.businessId
      };
      setTempPassword(password);
      login(userData, data.token);
      navigate("/dashboard");

    } catch (error) {
      console.error("Log in error:", error);

      if (error.response) {
        const status = error.response.status;
        const msg = error.response.data?.message || "";
        const data = error.response.data;

        if (status === 404 || msg.toLowerCase().includes("not found")) {
          setErrorMessage("This email doesn't exist. Please sign up.");
        } else if (status === 401 || status === 400) {
          let detailedMsg = "Please check if the email or password is correct.";
          if (data?.errors) {
            if (Array.isArray(data.errors)) {
              detailedMsg = data.errors.map(e => e.error).join(" ");
            } else if (typeof data.errors === 'object') {
              detailedMsg = Object.values(data.errors).flat().join(" ");
            }
          }
          let finalMsg = detailedMsg || msg || "Please check if the email or password is correct.";
          if (finalMsg.toLowerCase().includes("sql") || finalMsg.toLowerCase().includes("network-related") || finalMsg.toLowerCase().includes("database")) {
            finalMsg = "Our servers are currently experiencing issues. Please try again later.";
          }
          setErrorMessage(finalMsg);
        } else {
          let fallbackMsg = msg || "An error occurred during log in.";
          if (fallbackMsg.toLowerCase().includes("sql") || fallbackMsg.toLowerCase().includes("network-related")) {
            fallbackMsg = "Our servers are currently experiencing issues. Please try again later.";
          }
          setErrorMessage(fallbackMsg);
        }
      } else {
        setErrorMessage("Network error. Cannot connect to the server.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      <Navbar />

      <div className="login-content">
        {/* Left Side: Image Only */}
        <div className="login-left">
          <img src={pic3} alt="IRIS AI" className="login-image" />
        </div>

        {/* Right Side: Login Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="auth-toggle">
              <Link to="/signup" className="toggle-btn sign-up-btn">
                Sign up
              </Link>
              <Link to="/login" className="toggle-btn log-in-btn active">
                Log in
              </Link>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="error-message">{errorMessage}</div>
              )}

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Password</label>
                <div className="password-input-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24M1 1l22 22" />
                      </svg>
                    ) : (
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                <a href="#" className="forgot-password">
                  Forgot Password?
                </a>
              </div>

              <button
                type="submit"
                className="submit-btn"
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? "Logging in..." : "Log in"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
