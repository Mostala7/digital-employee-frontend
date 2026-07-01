import { Link } from "react-router-dom";
import "./Navbar.css";
import logoImg from "../assets/logo.png";

const Navbar = () => {
  return (
    <nav className="navbar-wrapper">
      <div className="navbar-container">
        <a href="/" className="navbar-logo">
          <img src={logoImg} alt="IRIS Logo" className="navbar-logo-img" />
          <span className="logo-text">IRIS</span>
        </a>
        <div className="navbar-links">
          <a href="/#solution" className="nav-link">
            Solution
          </a>
          <a href="/#features" className="nav-link">
            Features
          </a>
          <a href="/#pricing" className="nav-link">
            Pricing
          </a>
        </div>
        <div className="navbar-actions">
          <Link to="/login" className="nav-link login-link">
            Log in
          </Link>
          <Link to="/signup" className="btn btn-primary">
            Sign Up Now
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
