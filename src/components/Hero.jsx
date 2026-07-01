import { useNavigate } from "react-router-dom";
import "./Hero.css";
import logoImg from "../assets/logo.png";

const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-icon-wrapper">
            <img src={logoImg} alt="IRIS Logo" className="hero-logo-img" />
            <span className="hero-logo-text">IRIS</span>
          </div>
          <h1 className="hero-title">
            Meet IRIS Your New{" "}
            <span className="hero-title-dark">Digital Employee</span>
          </h1>
          <p className="hero-description">
            Bring your team&apos;s capability to exactly the new level with
            AI-powered communication that never sleeps.
          </p>
          <button
            className="btn btn-primary btn-large"
            onClick={() => navigate("/signup")}
          >
            Try for free now
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;
