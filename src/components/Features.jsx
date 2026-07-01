import "./Features.css";
import problemCardsImg from "../assets/problem cards.png";
import dashboardMockupImg from "../assets/dashboard mokup pic.png";

const Features = () => {
  return (
    <section className="features-section" id="features">
      <div className="features-container">
        <div className="feature-row">
          <div className="feature-image">
            <img src={problemCardsImg} alt="Problem Cards" />
          </div>
          <div className="feature-text">
            <h2>A Satisfied Customer Is The Best Business Strategy Of All.</h2>
            <p>
              When messages go unanswered, feedback gets lost, and data isn’t
              analyzed — customers leave without a word. True satisfaction
              happens when every interaction is heard, processed, and
              understood.
            </p>
          </div>
        </div>

        <div className="feature-row">
          <div className="feature-text">
            <h2>From Chaos To Clarity, Turn Every Conversation Into Growth.</h2>
            <p>
              IRIS transforms customer interactions into real-time support and
              actionable insights. No missed messages. No wasted data. No blind
              decisions. Just intelligent, always-on customer engagement.
            </p>
          </div>
          <div className="feature-image">
            <img src={dashboardMockupImg} alt="Dashboard Mockup" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;
