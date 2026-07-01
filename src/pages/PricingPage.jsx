import Navbar from "../components/Navbar";
import Pricing from "../components/Pricing";
import "./PricingPage.css";

const steps = [
  { label: "Sign Up" },
  { label: "Choose Plan" },
  { label: "Payment" },
  { label: "Done" },
];

const currentStep = 2; // 1-indexed: step 1 (Sign Up) is done, step 2 (Choose Plan) is active

const PricingPage = () => {
  return (
    <div className="pricing-page-wrapper">
      <Navbar />

      {/* Progress Bar */}
      <section className="progress-section">
        <div className="progress-container">
          <div className="progress-heading">
            <h2>Complete Your Setup</h2>
            <p>Choose a plan that fits your business needs</p>
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

                  {/* Connector line (not after the last step) */}
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

      {/* Pricing Cards */}
      <Pricing navigateTo="/payment" />
    </div>
  );
};

export default PricingPage;
