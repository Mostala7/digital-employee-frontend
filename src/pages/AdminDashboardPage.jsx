import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import { Building2, Users, MessageSquare, Phone, Heart, CheckCircle } from "lucide-react";
import "./CustomersPage.css";
import "./DashboardPage.css";
import apiClient from "../api/apiClient";

const AdminDashboardPage = () => {
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get("/api/AdminDashboard/summary");
        setSummary(response.data);
      } catch (error) {
        console.error("Failed to fetch admin summary:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSummary();
  }, []);

  const STAT_CARDS = [
    { label: "Total Businesses", value: summary?.totalBusinesses ?? 0, Icon: Building2 },
    { label: "Active Businesses", value: summary?.activeBusinesses ?? 0, Icon: CheckCircle },
    { label: "Total Users", value: summary?.totalUsers ?? 0, Icon: Users },
    { label: "Total Conversations", value: summary?.totalInteractions ?? 0, Icon: MessageSquare },
    { label: "Total Calls", value: summary?.totalCalls ?? 0, Icon: Phone },
    { label: "Customer Satisfaction", value: `${summary?.customerSatisfactionRate ?? 0}%`, Icon: Heart },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-area" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
        <Topbar
          pageTitle="Platform Analytics"
          subtitle="Overview of every business, user and conversation on IRIS."
        />

        <main className="dashboard-content-wrapper">
          {isLoading ? (
            <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
              <Loader text="Loading platform analytics..." />
            </div>
          ) : (
            <>
              <div className="cust-stat-section">
                <div className="cust-stat-grid">
                  {STAT_CARDS.map(({ label, value, Icon }) => (
                    <div className="cust-dark-card" key={label}>
                      <div className="cust-dark-icon">
                        <Icon size={40} strokeWidth={1.4} />
                      </div>
                      <p className="cust-dark-value">{value}</p>
                      <p className="cust-dark-label">{label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
                <div className="chart-card" style={{ padding: "1.25rem 1.5rem" }}>
                  <h3 className="chart-title" style={{ color: "#1e1b4b", fontSize: "1.1rem", margin: "0 0 1rem" }}>
                    Most-Used Business Types
                  </h3>
                  <table className="customers-table logs-table">
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Businesses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary?.topBusinessTypes?.length > 0 ? (
                        summary.topBusinessTypes.map((row) => (
                          <tr key={row.category}>
                            <td>{row.category}</td>
                            <td>{row.count}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                            No data yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="chart-card" style={{ padding: "1.25rem 1.5rem" }}>
                  <h3 className="chart-title" style={{ color: "#1e1b4b", fontSize: "1.1rem", margin: "0 0 1rem" }}>
                    Most-Used Cuisine Types
                  </h3>
                  <table className="customers-table logs-table">
                    <thead>
                      <tr>
                        <th>Cuisine</th>
                        <th>Businesses</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary?.topCuisineTypes?.length > 0 ? (
                        summary.topCuisineTypes.map((row) => (
                          <tr key={row.category}>
                            <td>{row.category}</td>
                            <td>{row.count}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                            No data yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
