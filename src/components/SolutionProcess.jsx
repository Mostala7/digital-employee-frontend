import "./SolutionProcess.css";
import processCard1 from "../assets/process-card-1.jfif";
import processCard2 from "../assets/process-card-2.jfif";
import processCard3 from "../assets/process-card-3.png";

const SolutionProcess = () => {
  return (
    <section className="solution-process-section" id="solution">
      <div className="solution-process-container">
        {/* Solution Top Half */}
        <div className="solution-area">
          <h2 className="section-title">IRIS Complete Solution</h2>
          <div className="solution-cards">
            <div className="solution-card">
              <div className="icon-circle">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path>
                  <path d="M12 18V6"></path>
                </svg>
              </div>
              <h3 className="card-title">Financial Solution</h3>
              <ul className="card-list">
                <li>
                  <span>Reduced Operational Costs -</span> 24/7 digital employee
                  at a fraction of human cost
                </li>
                <li>
                  <span>Elimination of Lost Revenue -</span> Every call receives
                  instant response
                </li>
                <li>
                  <span>Reduced Customer Churn -</span> Proactive engagement and
                  Churn Risk Analysis
                </li>
              </ul>
            </div>

            <div className="solution-card">
              <div className="icon-circle">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                </svg>
              </div>
              <h3 className="card-title">Operational Solution</h3>
              <ul className="card-list">
                <li>
                  <span>Consistent Service Quality -</span> Uniform tone and
                  professionalism
                </li>
                <li>
                  <span>24/7 Availability -</span> Customers served anytime,
                  anywhere
                </li>
                <li>
                  <span>Efficiency and Automation -</span> Automate up to 80% of
                  routine inquiries
                </li>
              </ul>
            </div>

            <div className="solution-card">
              <div className="icon-circle">
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <path d="M16 13H8"></path>
                  <path d="M16 17H8"></path>
                  <path d="M10 9H8"></path>
                </svg>
              </div>
              <h3 className="card-title">Strategic Solution</h3>
              <ul className="card-list">
                <li>
                  <span>Data-Driven Insights and reports -</span> Automatic
                  analysis of all interactions.
                </li>
                <li>
                  <span>Proactive Problem Detection -</span> Identify issues
                  before they escalate.
                </li>
                <li>
                  <span>Promise Tracking System -</span> Every commitment logged
                  and followed up
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Process Bottom Half */}
        <div className="process-area">
          <div className="process-header">
            <span className="process-subtitle">Our process</span>
            <h2 className="section-title">
              Get Started Now With Easy Three Steps
            </h2>
          </div>

          <div className="process-cards">
            <div className="process-card">
              <div className="process-img-placeholder">
                <img
                  src={processCard1}
                  alt="Customize your agent"
                  className="process-img"
                />
              </div>
              <div className="process-text">
                <h3>Customize your agent</h3>
                <h4>Let your business Identity stand up</h4>
                <p>
                  Upload your knowledge base, define your brand tone, customize
                  colors and voice. And deploy an AI agent that truly reflects
                  your business identity.
                </p>
              </div>
            </div>

            <div className="process-card">
              <div className="process-img-placeholder">
                <img
                  src={processCard2}
                  alt="Connect Your Channels"
                  className="process-img"
                />
              </div>
              <div className="process-text">
                <h3>Connect Your Channels</h3>
                <h4>be where your customers are</h4>
                <p>
                  Link your WhatsApp, website chat, or call system to IRIS. All
                  customer interactions flow into one smart platform.
                </p>
              </div>
            </div>

            <div className="process-card">
              <div className="process-img-placeholder">
                <img
                  src={processCard3}
                  alt="Monitor Insights"
                  className="process-img"
                />
              </div>
              <div className="process-text">
                <h3>Monitor Insights & Improve</h3>
                <h4>be where your customers are</h4>
                <p>
                  Track performance, monitor customer satisfaction, and discover
                  trends through a powerful dashboard. Turn conversations into
                  data-driven decisions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SolutionProcess;
