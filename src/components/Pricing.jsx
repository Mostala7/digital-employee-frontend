import { useNavigate } from "react-router-dom";
import "./Pricing.css";

// eslint-disable-next-line react/prop-types
const Pricing = ({ navigateTo = "/signup" }) => {
  const navigate = useNavigate();

  return (
    <section className="pricing-section" id="pricing">
      <div className="pricing-container">
        <div className="pricing-header">
          <span className="pricing-subtitle">Built to Scale With You</span>
          <h2 className="pricing-title">Flexible Pricing for Every Business</h2>
          <p className="pricing-description">
            Whether you&apos;re a startup, a growing company, or a large
            enterprise, IRIS offers scalable plans tailored to your needs.
          </p>
        </div>

        <div className="pricing-cards">
          {/* Start Up Plan */}
          <div className="pricing-card">
            <div className="card-header">
              <h3>Start Up Plan</h3>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">29</span>
                <span className="period">/month</span>
              </div>
              <p className="plan-desc">
                Start small. Grow confidently. Scale without limits.
              </p>
            </div>

            <div className="divider"></div>

            <ul className="features-list">
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>1-2 Connected Channels</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Up to 1,000 conversations/month</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Basic AI auto-replies and Sentiment Detection</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Standard Ticket Management</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Basic Analytics Dashboard</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>15-Day Free Trial</strong>
                </span>
              </li>
            </ul>

            <button
              className="pricing-btn light-btn"
              onClick={() =>
                navigate(navigateTo, { state: { plan: "Start Up", price: 29 } })
              }
            >
              Start Now With Free Trail
            </button>
          </div>

          {/* Growth Plan (Highlighted) */}
          <div className="pricing-card highlighted">
            <div className="card-header">
              <div className="title-row">
                <h3>Growth Plan</h3>
                <span className="badge">Popular</span>
              </div>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">99</span>
                <span className="period">/month</span>
              </div>
              <p className="plan-desc">
                Designed for growing teams and expanding operations.
              </p>
            </div>

            <div className="divider"></div>

            <ul className="features-list">
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Up to 5 Connected Channels</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Up to 10,000 conversations/month</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Up to 10,000 conversations/month</strong>
                </span>
                {/* Note: In the image this is repeated twice, faithfully reproducing it */}
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Advanced AI Intent Detection</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Real-Time Sentiment Analysis</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Smart Ticket Management</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Advanced Analytics & Reports</strong>
                </span>
              </li>
            </ul>

            <button
              className="pricing-btn white-btn"
              onClick={() =>
                navigate(navigateTo, { state: { plan: "Growth", price: 99 } })
              }
            >
              Get started
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="pricing-card">
            <div className="card-header">
              <h3>Enterprise Plan</h3>
              <div className="price">
                <span className="currency">$</span>
                <span className="amount">129</span>
                <span className="period">/month</span>
              </div>
              <p className="plan-desc">
                Full-scale AI-powered customer intelligence.
              </p>
            </div>

            <div className="divider"></div>

            <ul className="features-list">
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Unlimited Channels</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Unlimited Conversations</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Custom AI Model Training</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Advanced Predictive Analytics</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>SLA & Dedicated Account Manager</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>API Access & Custom Integrations</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>Multi-Branch Management</strong>
                </span>
              </li>
              <li>
                <div className="check-icon">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                  </svg>
                </div>
                <span>
                  <strong>White-Label Customization</strong>
                </span>
              </li>
            </ul>

            <button
              className="pricing-btn light-btn"
              onClick={() =>
                navigate(navigateTo, {
                  state: { plan: "Enterprise", price: 129 },
                })
              }
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;
