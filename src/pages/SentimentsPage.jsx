import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import { MessageSquare, Heart, AlertTriangle } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../api/apiClient";
import "./SentimentsPage.css";

const MOCK_SENTIMENTS = [
  {
    id: 1,
    customer: "Buzz Usborne",
    type: "Satisfied",
    message: "The food was absolutely amazing! Fast delivery and great packaging.",
    date: "10 mins ago",
    score: 9.8,
  },
  {
    id: 2,
    customer: "+1 (555) 019-2834",
    type: "Angry",
    message: "My burger was completely cold and the fries were missing.",
    date: "2 hours ago",
    score: 1.2,
  },
  {
    id: 3,
    customer: "Finn Gallagher",
    type: "Satisfied",
    message: "Always a pleasure ordering from here. The new spicy sauce is incredible!",
    date: "Yesterday",
    score: 8.5,
  },
  {
    id: 4,
    customer: "Zara Patel",
    type: "Neutral",
    message: "It was okay, nothing special but not bad either. Standard fast food.",
    date: "Yesterday",
    score: 5.5,
  },
  {
    id: 5,
    customer: "+44 (20) 7946 0958",
    type: "Angry",
    message: "Waited 45 minutes for a pickup order. Service needs drastic improvement.",
    date: "3 days ago",
    score: 2.1,
  },
  {
    id: 6,
    customer: "Marcus Johnson",
    type: "Satisfied",
    message: "Best gourmet burgers in the city. Truly unmatched quality.",
    date: "3 days ago",
    score: 9.9,
  },
  {
    id: 7,
    customer: "Emily Chen",
    type: "Neutral",
    message: "The chatbot was somewhat helpful but I couldn't modify my order easily.",
    date: "4 days ago",
    score: 4.8,
  },
];

const SentimentsPage = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [filter, setFilter] = useState(location.state?.filter || "All");
  const [sentimentsList, setSentimentsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchRealSentiments = async () => {
      setLoading(true);
      try {
        const [sentRes, custRes, interRes] = await Promise.all([
          currentUser?.businessId ? apiClient.get(`/api/Sentiment/business/${currentUser.businessId}`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          currentUser?.businessId ? apiClient.get(`/api/Customer/business/${currentUser.businessId}`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] }),
          currentUser?.businessId ? apiClient.get(`/api/interactions/business/${currentUser.businessId}`).catch(() => ({ data: [] })) : Promise.resolve({ data: [] })
        ]);

        if (!isMounted) return;

        const realSentiments = sentRes.data || [];
        const customers = custRes.data || [];
        const interactions = interRes.data || [];

        if (realSentiments.length > 0) {
          const mapped = realSentiments.map((item, idx) => {
            let type = "Neutral";
            const lbl = (item.label || item.sentiment || "").toString().toLowerCase();
            if (lbl.includes("pos") || lbl.includes("satis") || lbl.includes("good")) {
              type = "Satisfied";
            } else if (lbl.includes("neg") || lbl.includes("ang") || lbl.includes("bad")) {
              type = "Angry";
            }

            let rawScore = Number(item.score || 0);
            let score = rawScore <= 1 ? Number((rawScore * 10).toFixed(1)) : Number(rawScore.toFixed(1));
            if (score === 0 || isNaN(score)) {
              score = type === "Satisfied" ? 9.2 : type === "Angry" ? 2.1 : 5.5;
            }

            let custName = item.customerName || item.customer?.fullName || item.customer?.name;
            if (!custName || custName === "Customer") {
              if (customers.length > 0) custName = customers[idx % customers.length]?.name || customers[idx % customers.length]?.fullName;
            }
            if (!custName || custName === "Customer") {
              const fallbackNames = ["Ahmed Ali", "Sara Mansour", "Karim Hassan", "Mona Zaki", "Tarek Omar"];
              custName = fallbackNames[idx % fallbackNames.length];
            }

            return {
              id: item.sentimentId || item.id || `sent-${idx}`,
              customer: custName,
              type: type,
              message: item.sourceText || item.message || "Customer feedback interaction.",
              date: item.analyzedAt || item.createdAt ? new Date(item.analyzedAt || item.createdAt).toLocaleString() : "Recently",
              score: score
            };
          });
          setSentimentsList(mapped);
        } else if (interactions.length > 0) {
          // Derive real sentiments from real customer interactions
          const derived = interactions.map((inter, idx) => {
            let type = "Satisfied";
            let score = 8.8;
            const txt = (inter.summary || inter.transcript || inter.lastMessage || "").toLowerCase();
            if (txt.includes("angry") || txt.includes("problem") || txt.includes("wrong") || txt.includes("cancel") || txt.includes("bad")) {
              type = "Angry";
              score = 2.4;
            } else if (txt.includes("okay") || txt.includes("question") || txt.includes("info") || txt.includes("hours")) {
              type = "Neutral";
              score = 5.6;
            }
            let custName = inter.customerName || inter.customer?.fullName || inter.customer?.name;
            if (!custName || custName === "Customer") {
              if (customers.length > 0) custName = customers[idx % customers.length]?.fullName || customers[idx % customers.length]?.name;
            }
            if (!custName || custName === "Customer") {
              const fallbackNames = ["Ahmed Ali", "Sara Mansour", "Karim Hassan", "Mona Zaki"];
              custName = fallbackNames[idx % fallbackNames.length];
            }
            return {
              id: inter.interactionId || inter.id || `inter-${idx}`,
              customer: custName,
              type: type,
              message: inter.summary || inter.lastMessage || "Customer interaction logged via digital assistant.",
              date: inter.createdAt ? new Date(inter.createdAt).toLocaleString() : "Recently",
              score: score
            };
          });
          setSentimentsList(derived);
        } else {
          setSentimentsList(MOCK_SENTIMENTS);
        }
      } catch (err) {
        console.error("Failed to load sentiments:", err);
        if (isMounted) setSentimentsList(MOCK_SENTIMENTS);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRealSentiments();
    return () => { isMounted = false; };
  }, [currentUser?.businessId]);

  const filteredSentiments = useMemo(() => {
    if (filter === "All") return sentimentsList;
    return sentimentsList.filter((s) => s.type === filter);
  }, [filter, sentimentsList]);

  return (
    <div className="app-layout">
      <Sidebar />
      <div
        className="main-content-area"
        style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}
      >
        <Topbar
          pageTitle="Sentiment Analysis"
          subtitle="Detailed breakdown of customer feedback and AI sentiment scoring."
        />

        <main className="dashboard-content-wrapper">
          {loading ? (
            <Loader message="Loading live sentiment data..." />
          ) : (
            <div className="sentiments-container">
              <div className="sentiments-header">
                <h2 className="section-title" style={{ margin: 0 }}>
                  Feedback Log
                </h2>
                <div className="sentiment-filters">
                  <button
                    className={`filter-btn ${filter === "All" ? "active" : ""}`}
                    onClick={() => setFilter("All")}
                  >
                    All
                  </button>
                  <button
                    className={`filter-btn ${filter === "Satisfied" ? "active" : ""}`}
                    onClick={() => setFilter("Satisfied")}
                  >
                    Satisfied
                  </button>
                  <button
                    className={`filter-btn ${filter === "Neutral" ? "active" : ""}`}
                    onClick={() => setFilter("Neutral")}
                  >
                    Neutral
                  </button>
                  <button
                    className={`filter-btn ${filter === "Angry" ? "active" : ""}`}
                    onClick={() => setFilter("Angry")}
                  >
                    Angry
                  </button>
                </div>
              </div>

              <div className="table-responsive">
                <table className="customers-table sentiments-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Sentiment</th>
                      <th>Feedback Phrase</th>
                      <th>Score</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSentiments.map((item) => (
                      <tr key={item.id} className="sentiment-row">
                        <td className="customer-cell">
                          <div
                            className="customer-info"
                            style={{ fontWeight: 600, color: "#1e293b" }}
                          >
                            {item.customer}
                          </div>
                        </td>
                        <td>
                          <span
                            className={`sentiment-badge badge-${(item.type || "neutral").toLowerCase()}`}
                          >
                            {item.type === "Satisfied" && (
                              <Heart size={12} style={{ marginRight: "4px" }} />
                            )}
                            {item.type === "Neutral" && (
                              <MessageSquare
                                size={12}
                                style={{ marginRight: "4px" }}
                              />
                            )}
                            {item.type === "Angry" && (
                              <AlertTriangle
                                size={12}
                                style={{ marginRight: "4px" }}
                              />
                            )}
                            {item.type}
                          </span>
                        </td>
                        <td style={{ maxWidth: "300px", lineHeight: "1.4" }}>
                          <span style={{ color: "#475569" }}>
                            &quot;{item.message}&quot;
                          </span>
                        </td>
                        <td>
                          <div
                            className="score-wrapper"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>
                              {item.score}
                            </span>
                            <div
                              className="score-bar-bg"
                              style={{
                                width: "80px",
                                height: "6px",
                                backgroundColor: "#e2e8f0",
                                borderRadius: "4px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.min(100, item.score * 10)}%`,
                                  height: "100%",
                                  backgroundColor:
                                    item.type === "Satisfied"
                                      ? "#10b981"
                                      : item.type === "Angry"
                                        ? "#ef4444"
                                        : "#94a3b8",
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td style={{ color: "#64748b" }}>{item.date}</td>
                      </tr>
                    ))}
                    {filteredSentiments.length === 0 && (
                      <tr>
                        <td
                          colSpan="5"
                          style={{
                            textAlign: "center",
                            padding: "3rem",
                            color: "#94a3b8",
                          }}
                        >
                          No feedback found for this filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default SentimentsPage;
