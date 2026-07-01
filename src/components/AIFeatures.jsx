import "./AIFeatures.css";
import featuresBgImg from "../assets/feauturesbg.png"; // Note: filename from user's assets list is feauturesbg.png

const AIFeatures = () => {
  return (
    <section
      className="ai-features-section"
      style={{ backgroundImage: `url(${featuresBgImg})` }}
    >
      <div className="ai-features-container">
        <h2 className="ai-features-title">
          Smarter Customer Services Starts
          <br />
          With Powerful AI Features
        </h2>

        <div className="ai-features-grid">
          {/* Card 1: Voice & Chat Agents */}
          <div className="ai-feature-card">
            <div className="icon-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                <path d="M8 10h.01"></path>
                <path d="M12 10h.01"></path>
                <path d="M16 10h.01"></path>
              </svg>
            </div>
            <h3>Voice & Chat Agents</h3>
            <p>
              Engage customers naturally across calls, WhatsApp, or web chat.
              Synchronized agents remember previous interactions seamlessly.
            </p>
            <a href="#learn-more" className="learn-more-link">
              Learn more{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>

          {/* Card 2: Natural Language Understanding */}
          <div className="ai-feature-card">
            <div className="icon-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
            </div>
            <h3>Natural Language Understanding</h3>
            <p>
              Understands local dialects, slang, and emotional tone. Supports
              multiple languages and dialects.
            </p>
            <a href="#learn-more" className="learn-more-link">
              Learn more{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>

          {/* Card 3: Sentiment Analysis */}
          <div className="ai-feature-card">
            <div className="icon-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <h3>Sentiment Analysis</h3>
            <p>
              Detects emotions in real-time, triggering appropriate responses
              and alerts. Automatic escalation for frustrated customers.
            </p>
            <a href="#learn-more" className="learn-more-link">
              Learn more{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>

          {/* Card 4: Predictive Intelligence */}
          <div className="ai-feature-card">
            <div className="icon-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="20" x2="18" y2="10"></line>
                <line x1="12" y1="20" x2="12" y2="4"></line>
                <line x1="6" y1="20" x2="6" y2="14"></line>
              </svg>
            </div>
            <h3>Predictive Intelligence</h3>
            <p>
              Identifies patterns and trends to predict emerging issues. Churn
              risk analysis and trend alert system.
            </p>
            <a href="#learn-more" className="learn-more-link">
              Learn more{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>

          {/* Card 5: Agent Co-Pilot */}
          <div className="ai-feature-card">
            <div className="icon-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
                <path d="M16 11l2 2 4-4"></path>
              </svg>
            </div>
            <h3>Agent Co-Pilot</h3>
            <p>
              Real-time assistant for human employees—suggesting answers,
              providing data, and speeding up resolution times.
            </p>
            <a href="#learn-more" className="learn-more-link">
              Learn more{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>

          {/* Card 6: Continuous Learning */}
          <div className="ai-feature-card">
            <div className="icon-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.28l5.67-4.29"></path>
              </svg>
            </div>
            <h3>Continuous Learning</h3>
            <p>
              AI continuously improves by learning from every conversation,
              becoming smarter, faster, and more accurate over time.
            </p>
            <a href="#learn-more" className="learn-more-link">
              Learn more{" "}
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14"></path>
                <path d="M12 5l7 7-7 7"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIFeatures;
