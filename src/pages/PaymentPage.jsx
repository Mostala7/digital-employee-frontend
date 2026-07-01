import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./PaymentPage.css";
import "./PricingPage.css"; // reuse progress bar styles

const steps = [
  { label: "Sign Up" },
  { label: "Choose Plan" },
  { label: "Payment" },
  { label: "Done" },
];

const currentStep = 3; // Steps 1 & 2 are done, step 3 (Payment) is active

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { plan = "Growth", price = 99 } = location.state || {};

  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [paypalEmail, setPaypalEmail] = useState("");

  const tax = +(price * 0.1).toFixed(2);
  const total = +(price + tax).toFixed(2);

  const isCardValid =
    cardNumber.replace(/\s/g, "").length >= 16 &&
    cardName.trim() !== "" &&
    expiry.length >= 5 &&
    cvc.length >= 3;

  const isPaypalValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(paypalEmail);

  const isFormValid = paymentMethod === "card" ? isCardValid : isPaypalValid;

  const formatCardNumber = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };

  const formatExpiry = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;
    // In a real app this would process payment
    navigate("/thankyou");
  };

  return (
    <div className="payment-page-wrapper">
      <Navbar />

      {/* Progress Bar (reused from PricingPage) */}
      <section className="progress-section">
        <div className="progress-container">
          <div className="progress-heading">
            <h2>Complete Your Payment</h2>
            <p>You&apos;re almost there — just one more step!</p>
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

      {/* Payment Content */}
      <section className="payment-content">
        <div className="payment-layout">
          {/* Left: Payment Form */}
          <div className="payment-form-card">
            <h2>Payment Details</h2>
            <p>Enter your payment information below</p>

            {/* Payment Method Tabs */}
            <div className="payment-methods">
              <button
                className={`method-tab ${paymentMethod === "card" ? "active" : ""}`}
                onClick={() => setPaymentMethod("card")}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                  <line x1="1" y1="10" x2="23" y2="10" />
                </svg>
                Credit Card
              </button>
              <button
                className={`method-tab ${paymentMethod === "paypal" ? "active" : ""}`}
                onClick={() => setPaymentMethod("paypal")}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z" />
                </svg>
                PayPal
              </button>
            </div>

            <form className="payment-form" onSubmit={handleSubmit}>
              {paymentMethod === "card" ? (
                <>
                  {/* Credit Card Fields */}
                  <div className="form-group">
                    <label>Card Number</label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardNumber}
                      onChange={(e) =>
                        setCardNumber(formatCardNumber(e.target.value))
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Cardholder Name</label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Expiry Date</label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) =>
                          setExpiry(formatExpiry(e.target.value))
                        }
                      />
                    </div>
                    <div className="form-group">
                      <label>CVC</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cvc}
                        onChange={(e) =>
                          setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                        }
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* PayPal Fields */}
                  <div className="paypal-info">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <span>
                      You will be redirected to PayPal to complete your payment
                      securely.
                    </span>
                  </div>

                  <div className="form-group">
                    <label>PayPal Email</label>
                    <input
                      type="email"
                      placeholder="your-email@example.com"
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                    />
                  </div>
                </>
              )}

              <button type="submit" className="pay-btn" disabled={!isFormValid}>
                {paymentMethod === "card"
                  ? `Pay $${total.toFixed(2)}`
                  : `Continue to PayPal`}
              </button>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div className="order-summary-card">
            <h3>Order Summary</h3>

            <div className="summary-plan">
              <span className="summary-plan-name">{plan} Plan</span>
              <span className="summary-plan-price">
                ${price} <span>/month</span>
              </span>
            </div>

            <div className="summary-lines">
              <div className="summary-line">
                <span>Subtotal</span>
                <span>${price.toFixed(2)}</span>
              </div>
              <div className="summary-line">
                <span>Tax (10%)</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>${total.toFixed(2)}</span>
            </div>

            <div className="security-badge">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Your payment info is encrypted and secure
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PaymentPage;
