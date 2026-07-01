import { useNavigate } from "react-router-dom";
import "./CTA.css";
import bgPic1 from "../assets/bg pic1.jpg";

const CTA = () => {
  const navigate = useNavigate();

  return (
    <section className="cta-section">
      <div
        className="cta-container"
        style={{ backgroundImage: `url('${bgPic1}')` }}
      >
        <div className="cta-content">
          <h2 className="cta-title">
            Ready to Transform Your
            <br />
            Customer Experience?
          </h2>
          <button className="cta-btn" onClick={() => navigate("/signup")}>
            Start For Free now
          </button>
        </div>
      </div>
    </section>
  );
};

export default CTA;
