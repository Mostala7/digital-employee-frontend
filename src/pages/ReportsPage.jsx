import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import ReportsTabContent from "../components/ReportsTabContent";
import "./ReportsPage.css";
import "./SettingsPage.css";

const ReportsPage = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div
        className="main-content-area"
        style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}
      >
        <Topbar
          pageTitle="Reports"
          subtitle="Generate and manage analytics reports."
        />

        <main className="dashboard-content-wrapper settings-container">
          <div className="settings-card">
            <ReportsTabContent />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportsPage;
