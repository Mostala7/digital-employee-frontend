import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import "./SignUpPage.css";
import pic3 from "../assets/pic3.png";

const SignUpPage = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login, setTempPassword } = useAuth();
  const navigate = useNavigate();

  // Validation Logic
  const hasMinLength = password.length >= 8;
  const hasCapitalLetter = /[A-Z]/.test(password);
  const hasLowercaseLetter = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  // Strength calculation
  let strength = "Weak";
  let strengthValid = false;
  if (
    hasMinLength &&
    hasCapitalLetter &&
    hasLowercaseLetter &&
    hasNumber &&
    hasSpecialChar
  ) {
    strength = "Strong";
    strengthValid = true;
  } else if (
    hasMinLength &&
    (hasCapitalLetter || hasLowercaseLetter) &&
    (hasNumber || hasSpecialChar)
  ) {
    strength = "Medium";
  }

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isFormValid =
    firstName.trim() !== "" &&
    lastName.trim() !== "" &&
    isEmailValid &&
    strengthValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await apiClient.post("/api/Auth/register-owner", {
        fullName: `${firstName.trim()} ${lastName.trim()}`,
        email,
        password,
      });

      const data = response.data; // axios parses JSON
      console.log(data);
      // Success: Redirect to the login page
      navigate("/login");
    } catch (error) {
      console.error("Sign up error:", error);

      if (error.response) {
        const msg = error.response.data?.message || "";
        const data = error.response.data;
        if (
          error.response.status === 409 ||
          msg.toLowerCase().includes("exists")
        ) {
          setErrorMessage("This email is already registered. Please sign in.");
        } else if (error.response.status === 400) {
          let detailedMsg = "";
          if (data?.errors) {
            if (Array.isArray(data.errors)) {
              detailedMsg = data.errors.map((e) => e.error).join(" ");
            } else if (typeof data.errors === "object") {
              detailedMsg = Object.values(data.errors).flat().join(" ");
            }
          }
          let finalMsg =
            detailedMsg ||
            msg ||
            "Invalid registration details. Please check your inputs.";
          if (
            finalMsg.toLowerCase().includes("sql") ||
            finalMsg.toLowerCase().includes("network-related") ||
            finalMsg.toLowerCase().includes("database")
          ) {
            finalMsg =
              "Our servers are currently experiencing issues. Please try again later.";
          }
          setErrorMessage(finalMsg);
        } else {
          let fallbackMsg = msg || "An error occurred during sign up.";
          if (
            fallbackMsg.toLowerCase().includes("sql") ||
            fallbackMsg.toLowerCase().includes("network-related")
          ) {
            fallbackMsg =
              "Our servers are currently experiencing issues. Please try again later.";
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

  // Helper for rendering the checkmark
  // eslint-disable-next-line react/prop-types
  const CheckIcon = ({ isValid }) => (
    <svg
      viewBox="0 0 24 24"
      width="12"
      height="12"
      style={{
        color: isValid ? "#3949ab" : "#c0cdf0",
        transition: "color 0.2s",
      }}
    >
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20 6L9 17l-5-5"
      />
    </svg>
  );

  return (
    <div className="login-page-wrapper">
      <Navbar />

      <div className="login-content">
        {/* Left Side: Image Only */}
        <div className="login-left">
          <img src={pic3} alt="IRIS AI Dashboard" className="login-image" />
        </div>

        {/* Right Side: Login Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="auth-toggle">
              <Link to="/signup" className="toggle-btn sign-up-btn active">
                Sign up
              </Link>
              <Link to="/login" className="toggle-btn log-in-btn">
                Log in
              </Link>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              {errorMessage && (
                <div className="error-message">{errorMessage}</div>
              )}

              <div
                className="form-group-row"
                style={{ display: "flex", gap: "1rem" }}
              >
                <div className="form-group" style={{ flex: 1 }}>
                  <label>First Name</label>
                  <input
                    type="text"
                    placeholder="First name"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Last Name</label>
                  <input
                    type="text"
                    placeholder="Last name"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

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
                    placeholder="Enter password"
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
                <ul className="password-hints">
                  <li className={strengthValid ? "valid" : ""}>
                    <CheckIcon isValid={strengthValid} /> Password Strength:{" "}
                    {strength}
                  </li>
                  <li
                    className={
                      hasCapitalLetter && hasLowercaseLetter ? "valid" : ""
                    }
                  >
                    <CheckIcon
                      isValid={hasCapitalLetter && hasLowercaseLetter}
                    />{" "}
                    Uppercase & lowercase letters
                  </li>
                  <li className={hasMinLength ? "valid" : ""}>
                    <CheckIcon isValid={hasMinLength} /> At least 8 characters
                  </li>
                  <li className={hasNumber ? "valid" : ""}>
                    <CheckIcon isValid={hasNumber} /> Contains a number
                  </li>
                  <li className={hasSpecialChar ? "valid" : ""}>
                    <CheckIcon isValid={hasSpecialChar} /> Contains a special
                    character (e.g., @, !)
                  </li>
                </ul>
              </div>

              <button
                type="submit"
                className="submit-btn"
                style={{ borderRadius: "8px" }}
                disabled={!isFormValid || isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
