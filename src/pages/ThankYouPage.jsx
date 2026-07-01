import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./ThankYouPage.css";
import "./PricingPage.css"; // reuse progress bar styles

const steps = [
  { label: "Sign Up" },
  { label: "Choose Plan" },
  { label: "Payment" },
  { label: "Done" },
];

const currentStep = 5; // All steps completed (> total steps)

const ThankYouPage = () => {
  return (
    <div className="thankyou-page-wrapper">
      <Navbar />

      {/* Progress Bar — all steps completed */}
      <section className="progress-section">
        <div className="progress-container">
          <div className="progress-heading">
            <h2>All Set!</h2>
            <p>Your account is ready to go</p>
          </div>

          <div className="step-tracker">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isActive = stepNumber === currentStep;

              return (
                <div key={step.label} style={{ display: "contents" }}>
                  <div
                    className={`step ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                  >
                    <div className="step-circle" />
                    <span className="step-label">{step.label}</span>
                  </div>

                  {index < steps.length - 1 && (
                    <div
                      className={`step-connector ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Thank You Card */}
      <div className="thankyou-content">
        <div className="thankyou-card">
          {/* Badge SVG matching the provided design */}
          <div className="thankyou-badge">
            <svg
              className="badge-outer"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Scalloped / rosette outer ring */}
              <path
                d="M 104.0 60.0 Q 113.0 70.5 100.7 76.8 Q 104.9 90.0 91.1 91.1 Q 90.0 104.9 76.8 100.7 Q 70.5 113.0 60.0 104.0 Q 49.5 113.0 43.2 100.7 Q 30.0 104.9 28.9 91.1 Q 15.1 90.0 19.3 76.8 Q 7.0 70.5 16.0 60.0 Q 7.0 49.5 19.3 43.2 Q 15.1 30.0 28.9 28.9 Q 30.0 15.1 43.2 19.3 Q 49.5 7.0 60.0 16.0 Q 70.5 7.0 76.8 19.3 Q 90.0 15.1 91.1 28.9 Q 104.9 30.0 100.7 43.2 Q 113.0 49.5 104.0 60.0 Z"
                fill="#4A1D8E"
              />
              {/* Inner circle */}
              <circle cx="60" cy="60" r="36" fill="#DDD6F3" />
              {/* Checkmark */}
              <polyline
                points="45,60 55,70 76,49"
                fill="none"
                stroke="#4A1D8E"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <h2>Payment Confirmed</h2>

          <Link to="/dashboard" className="continue-btn">
            continue
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ThankYouPage;
