import "./Stats.css";

const Stats = () => {
  return (
    <section className="stats-section">
      <div className="stats-container">
        <h2 className="stats-heading">Our results in numbers</h2>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="icon-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
              </svg>
            </div>
            <h3 className="stat-value">99%</h3>
            <p className="stat-label">Satisfaction Rate</p>
          </div>

          <div className="stat-card">
            <div className="icon-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 className="stat-value">32K</h3>
            <p className="stat-label">Active Users</p>
          </div>

          <div className="stat-card">
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
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3 className="stat-value">24/7</h3>
            <p className="stat-label">Availability</p>
          </div>

          <div className="stat-card">
            <div className="icon-circle">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                <polyline points="17 6 23 6 23 12"></polyline>
              </svg>
            </div>
            <h3 className="stat-value">80%</h3>
            <p className="stat-label">Cost Reduction</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Stats;
