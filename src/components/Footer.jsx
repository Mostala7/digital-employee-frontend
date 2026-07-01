import "./Footer.css";
import logo from "../assets/logo.png";

const Footer = () => {
  return (
    <footer className="footer-section">
      <div className="footer-container">
        <div className="footer-main">
          {/* Brand Column */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img src={logo} alt="IRIS Logo" />
              <span>IRIS</span>
            </div>
            <p className="footer-description">
              Intelligent Response & Insight System - Transforming customer
              experiences with AI-powered digital employees.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Twitter" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                </svg>
              </a>
              <a href="#" aria-label="Instagram" className="social-icon">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
              <a href="#" aria-label="LinkedIn" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"></path>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
              <a href="#" aria-label="YouTube" className="social-icon">
                <svg viewBox="0 0 24 24" fill="currentColor" stroke="none">
                  <path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 11.75a29 29 0 00.46 5.33 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2 29 29 0 00.46-5.33 29 29 0 00-.46-5.33z"></path>
                  <polygon
                    points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"
                    fill="white"
                  ></polygon>
                </svg>
              </a>
            </div>
          </div>

          {/* Navigation Columns */}
          <div className="footer-links-group">
            <div className="footer-column">
              <h4>Product</h4>
              <ul>
                <li>
                  <a href="#features">Features</a>
                </li>
                <li>
                  <a href="#solution">Solution</a>
                </li>
                <li>
                  <a href="#pricing">Pricing</a>
                </li>
                <li>
                  <a href="#">Reviews</a>
                </li>
                <li>
                  <a href="#">Updates</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Company</h4>
              <ul>
                <li>
                  <a href="#">About</a>
                </li>
                <li>
                  <a href="#">Contact us</a>
                </li>
                <li>
                  <a href="#">Careers</a>
                </li>
                <li>
                  <a href="#">Culture</a>
                </li>
                <li>
                  <a href="#">Blog</a>
                </li>
              </ul>
            </div>

            <div className="footer-column">
              <h4>Support</h4>
              <ul>
                <li>
                  <a href="#">Getting started</a>
                </li>
                <li>
                  <a href="#">Help center</a>
                </li>
                <li>
                  <a href="#">Server status</a>
                </li>
                <li>
                  <a href="#">Report a bug</a>
                </li>
                <li>
                  <a href="#">Chat support</a>
                </li>
              </ul>
            </div>
            {/* Downloads column omitted as per user request */}
          </div>
        </div>

        <div className="footer-bottom">
          <p>
            Copyright © 2026 IRIS | All Rights Reserved | Built with love by
            IRIS team
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
