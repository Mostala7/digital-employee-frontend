import { useState, useEffect } from "react";
import {
  Download,
  FileText,
  Calendar,
  Clock,
  DownloadCloud,
  Settings2,
} from "lucide-react";
import apiClient from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";
import AiReportView from "./AiReportView";
import "../pages/ReportsPage.css";
import "../pages/CustomersPage.css"; // For table styles

const ReportsTabContent = () => {
  const { currentUser } = useAuth();
  const businessId = currentUser?.businessId;
  const [activeTab, setActiveTab] = useState("generate");
  const [selectedType, setSelectedType] = useState("Daily");
  const [customTitle, setCustomTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reports, setReports] = useState([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [generatedReport, setGeneratedReport] = useState(null);

  const calculateDateRange = () => {
    const to = new Date();
    const from = new Date();
    if (selectedType === "Daily") {
      from.setDate(from.getDate() - 1);
    } else if (selectedType === "Weekly") {
      from.setDate(from.getDate() - 7);
    } else if (selectedType === "Monthly") {
      from.setMonth(from.getMonth() - 1);
    } else if (selectedType === "Custom") {
      return {
        from: new Date(startDate).toISOString(),
        to: new Date(endDate).toISOString(),
      };
    }
    return {
      from: from.toISOString(),
      to: to.toISOString(),
    };
  };

  useEffect(() => {
    const fetchReports = async () => {
      if (!businessId) return;
      try {
        const response = await apiClient.get(`/api/Report/business/${businessId}`);
        if (response.data && Array.isArray(response.data)) {
          setReports(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch reports:", error);
      }
    };

    fetchReports();
    const intervalId = setInterval(fetchReports, 30000);
    return () => clearInterval(intervalId);
  }, [businessId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const { from, to } = calculateDateRange();
      const payload = {
        from: from,
        to: to,
        language: "ar",
      };

      const response = await apiClient.post(`/api/businesses/${businessId}/reports/generate`, payload);

      if (response.data && response.data.message === "No analysis data available for this period.") {
        setErrorMsg("لا توجد بيانات تحليل لهذه الفترة.");
      } else if (response.data) {
        setGeneratedReport(response.data);
        const notifPayload = {
          notificationId: "rep_" + Date.now(),
          title: "AI Report Ready",
          message: `Analytics report generated successfully for ${selectedType} period.`,
          severity: "Success",
          category: "Ready",
          isRead: false,
          createdAt: new Date()
        };
        window.dispatchEvent(new CustomEvent("newReportReady", { detail: notifPayload }));
        try {
          await apiClient.post("/api/Notification", {
            title: "AI Report Ready",
            message: `Analytics report generated successfully for ${selectedType} period.`,
            userId: currentUser?.id || null,
            businessId: businessId
          });
        } catch (e) {
          console.error("Could not persist notification:", e);
        }
      }
    } catch (error) {
      console.error("Failed to generate AI report:", error);
      if (error.response?.data?.message) {
        setErrorMsg(error.response.data.message);
      } else {
        setErrorMsg("Failed to start report generation. Please try again.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return {
      date: d.toLocaleDateString("en-GB", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      time: d.toLocaleTimeString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  if (generatedReport) {
    return <AiReportView report={generatedReport} onBack={() => setGeneratedReport(null)} />;
  }

  return (
    <div className="reports-embedded-container">
      <div className="report-gen-form">
        <h3 style={{ margin: "0 0 1.5rem 0", color: "#1e1b4b" }}>
          Select Report Type
        </h3>

          <div className="report-type-grid">
            <div
              className={`report-type-card ${selectedType === "Daily" ? "selected" : ""}`}
              onClick={() => setSelectedType("Daily")}
            >
              <div className="report-type-icon">
                <Clock size={24} />
              </div>
              <div className="report-type-title">Daily</div>
              <div className="report-type-desc">
                Yesterday&apos;s performance
              </div>
            </div>

            <div
              className={`report-type-card ${selectedType === "Weekly" ? "selected" : ""}`}
              onClick={() => setSelectedType("Weekly")}
            >
              <div className="report-type-icon">
                <Calendar size={24} />
              </div>
              <div className="report-type-title">Weekly</div>
              <div className="report-type-desc">Last 7 days summary</div>
            </div>

            <div
              className={`report-type-card ${selectedType === "Monthly" ? "selected" : ""}`}
              onClick={() => setSelectedType("Monthly")}
            >
              <div className="report-type-icon">
                <FileText size={24} />
              </div>
              <div className="report-type-title">Monthly</div>
              <div className="report-type-desc">Full month analytics</div>
            </div>

            <div
              className={`report-type-card ${selectedType === "Custom" ? "selected" : ""}`}
              onClick={() => setSelectedType("Custom")}
            >
              <div className="report-type-icon">
                <Settings2 size={24} />
              </div>
              <div className="report-type-title">Custom</div>
              <div className="report-type-desc">
                Select specific dates
              </div>
            </div>
          </div>

          {successMsg && (
            <div
              style={{
                backgroundColor: "#dcfce7",
                color: "#166534",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                border: "1px solid #bbf7d0",
              }}
            >
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                color: "#991b1b",
                padding: "1rem",
                borderRadius: "8px",
                marginBottom: "1.5rem",
                fontSize: "0.9rem",
                fontWeight: 500,
                border: "1px solid #fecaca",
              }}
            >
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleGenerate}>
            {selectedType === "Custom" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <div className="report-form-group" style={{ marginBottom: 0 }}>
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required={selectedType === "Custom"}
                  />
                </div>
                <div className="report-form-group" style={{ marginBottom: 0 }}>
                  <label>End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required={selectedType === "Custom"}
                  />
                </div>
              </div>
            )}
            <div className="report-form-group">
              <label>Custom Title (Optional)</label>
              <input
                type="text"
                placeholder={`E.g., ${selectedType} Summary - ${new Date().toLocaleDateString()}`}
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="report-generate-btn"
              disabled={isGenerating}
            >
              {isGenerating ? (
                "Generating..."
              ) : (
                <>
                  <DownloadCloud size={18} /> Generate & Download
                </>
              )}
            </button>
          </form>
        </div>
    </div>
  );
};

export default ReportsTabContent;
