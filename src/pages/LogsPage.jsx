import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import {
  Search,
  Filter,
  ExternalLink,
  CalendarDays,
  MessageSquare,
  Activity,
  Bot,
  Users,
  Phone,
} from "lucide-react";
import { startOfDay } from "date-fns";
import "./LogsPage.css";
import "./CustomersPage.css"; // Important: ensure we can pull "cust-dark-card" definitions

import apiClient from "../api/apiClient";


const STATUSES = ["Resolved", "Active", "Escalated"];
const CHANNELS = ["Calls", "WhatsApp", "Social Media", "Other"];
const SENTIMENTS = ["Satisfied", "Neutral", "Angry"];

const LogsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterChannel, setFilterChannel] = useState([]);
  const [filterSentiment, setFilterSentiment] = useState([]);
  const [dateFilter, setDateFilter] = useState("All Time");

  const [interactions, setInteractions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [logsTab, setLogsTab] = useState('chat'); // 'chat' | 'call'

  const activeCount =
    filterStatus.length + filterChannel.length + filterSentiment.length;
  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setShowFilter(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchInteractions = async () => {
      setIsLoading(true);
      try {
        // Fetch both Interactions and Feedbacks concurrently
        const [interactionsRes, feedbacksRes] = await Promise.all([
          apiClient.get('/api/Interaction'),
          apiClient.get('/api/Feedback').catch(() => ({ data: [] })) // Safe fallback
        ]);
        
        const interactionsData = interactionsRes.data || [];
        const feedbacksData = feedbacksRes.data || [];
        
        // Map feedbacks by interactionId for O(1) lookup
        const feedbackMap = {};
        feedbacksData.forEach(fb => {
          if (fb.interactionId) {
            feedbackMap[fb.interactionId] = fb;
          }
        });
        
        const mappedInteractions = interactionsData.map(t => {
          const id = t.interactionId || t.id;
          const fb = feedbackMap[id] || {};
          const score = fb.sentimentScore !== undefined && fb.sentimentScore !== null ? fb.sentimentScore : null;
          
          // Determine sentiment tag dynamically based on stitched score
          let tag = "Neutral";
          if (score !== null) {
            if (score >= 7) tag = "Satisfied";
            else if (score <= 4) tag = "Angry";
          }

          return {
            id,
            customerName: t.customer?.name || t.customerName || "Unknown",
            customerId: t.customerId || "Unknown",
            channel: t.channel || "Other",
            assignedUser: t.handledByUser?.fullName || null,
            status: t.status || "Active",
            notes: t.interactionType || "Standard",
            feedbackRating: fb.rating || null,
            sentimentScore: score,
            sentimentTag: tag,
            createdAt: t.startedAt || new Date().toISOString()
          };
        });
        
        setInteractions(mappedInteractions);
      } catch (error) {
        console.error("Failed to fetch interactions:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInteractions();
  }, []);

  const toggle = (list, setList, value) =>
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const clearFilters = () => {
    setFilterStatus([]);
    setFilterChannel([]);
    setFilterSentiment([]);
  };

  const filteredLogs = interactions.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      log.customerName.toLowerCase().includes(q) ||
      log.customerId.toLowerCase().includes(q) ||
      (log.notes && log.notes.toLowerCase().includes(q));

    const matchesStatus =
      filterStatus.length === 0 || filterStatus.includes(log.status);
    const matchesChannel =
      filterChannel.length === 0 || filterChannel.includes(log.channel);
    const matchesSentiment =
      filterSentiment.length === 0 ||
      filterSentiment.includes(log.sentimentTag);

    const matchesDate = (() => {
      if (dateFilter === "All Time") return true;
      const d = new Date(log.createdAt);
      if (dateFilter === "Today") return d >= startOfDay(new Date());
      if (dateFilter === "Last 7 Days")
        return d >= startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      if (dateFilter === "Last 30 Days")
        return d >= startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      return true;
    })();
    
    const isCall = log.channel === 'Voice' || log.channel === 'Calls' || log.channel?.toLowerCase()?.includes('call');
    const matchesTab = logsTab === 'call' ? isCall : !isCall;

    return (
      matchesSearch &&
      matchesStatus &&
      matchesChannel &&
      matchesSentiment &&
      matchesDate &&
      matchesTab
    );
  });

  const statFilteredLogs = interactions.filter((log) => {
    const isCall = log.channel === 'Voice' || log.channel === 'Calls' || log.channel?.toLowerCase()?.includes('call');
    const matchesTab = logsTab === 'call' ? isCall : !isCall;
    if (!matchesTab) return false;
    
    if (dateFilter === "All Time") return true;
    const d = new Date(log.createdAt);
    if (dateFilter === "Today") return d >= startOfDay(new Date());
    if (dateFilter === "Last 7 Days")
      return d >= startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    if (dateFilter === "Last 30 Days")
      return d >= startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    return true;
  });

  const stats = {
    total: statFilteredLogs.length,
    active: statFilteredLogs.filter((l) => l.status === "Active").length,
    aiHandled: statFilteredLogs.filter((l) => !l.assignedUser).length,
    escalated: statFilteredLogs.filter((l) => l.status === "Escalated").length,
  };

  const STAT_CARDS = [
    { label: "Total Threads", value: stats.total, Icon: MessageSquare },
    { label: "Active Threads", value: stats.active, Icon: Activity },
    { label: "AI Handled", value: stats.aiHandled, Icon: Bot },
    { label: "Escalated", value: stats.escalated, Icon: Users },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div
        className="main-content-area"
        style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}
      >
        <Topbar
          pageTitle="Interaction Logs"
          subtitle="Complete historical archive of customer conversations and AI chat transcripts."
        >
          <div className="logs-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by customer or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div style={{ position: "relative" }}>
              <CalendarDays
                size={14}
                style={{
                  position: "absolute",
                  left: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#64748b",
                  pointerEvents: "none",
                }}
              />
              <select
                className={`cust-period-btn ${dateFilter !== "All Time" ? "active" : ""}`}
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                style={{
                  paddingLeft: "1.8rem",
                  appearance: "none",
                  cursor: "pointer",
                  paddingRight: "1.5rem",
                }}
              >
                <option
                  value="All Time"
                  style={{ color: "#1e293b", background: "white" }}
                >
                  All Time
                </option>
                <option
                  value="Today"
                  style={{ color: "#1e293b", background: "white" }}
                >
                  Opened Today
                </option>
                <option
                  value="Last 7 Days"
                  style={{ color: "#1e293b", background: "white" }}
                >
                  Opened Last 7 Days
                </option>
                <option
                  value="Last 30 Days"
                  style={{ color: "#1e293b", background: "white" }}
                >
                  Opened Last 30 Days
                </option>
              </select>
              <div
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  pointerEvents: "none",
                  color: "#64748b",
                  fontSize: "0.6rem",
                }}
              >
                ▼
              </div>
            </div>
          </div>

          <div className="filter-container" ref={filterRef}>
            <button
              className={`filter-btn ${activeCount > 0 ? "active" : ""}`}
              onClick={() => setShowFilter((s) => !s)}
            >
              <Filter size={16} />
              <span>Filters</span>
              {activeCount > 0 && (
                <span className="filter-badge">{activeCount}</span>
              )}
            </button>

            {showFilter && (
              <div className="filter-popover">
                <div className="filter-popover-header">
                  <h4>Advanced Filters</h4>
                  {activeCount > 0 && (
                    <button
                      className="clear-filters-btn"
                      onClick={clearFilters}
                    >
                      Clear All
                    </button>
                  )}
                </div>

                {[
                  {
                    label: "Status",
                    list: filterStatus,
                    setList: setFilterStatus,
                    options: STATUSES,
                  },
                  {
                    label: "Channel",
                    list: filterChannel,
                    setList: setFilterChannel,
                    options: CHANNELS,
                  },
                  {
                    label: "Sentiment",
                    list: filterSentiment,
                    setList: setFilterSentiment,
                    options: SENTIMENTS,
                  },
                ].map(({ label, list, setList, options }) => (
                  <div className="filter-section" key={label}>
                    <h5>{label}</h5>
                    <div className="filter-options">
                      {options.map((opt) => (
                        <label key={opt} className="filter-checkbox-label">
                          <input
                            type="checkbox"
                            checked={list.includes(opt)}
                            onChange={() => toggle(list, setList, opt)}
                          />
                          <span className="checkbox-custom"></span>
                          {opt}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Topbar>

        <main className="dashboard-content-wrapper">
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

          <div
            className="chart-card"
            style={{ padding: "1.25rem 1.5rem", marginTop: "0" }}
          >
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
              <button 
                style={{
                  background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
                  fontWeight: 600, color: logsTab === 'chat' ? '#5b21b6' : '#64748b',
                  borderBottom: logsTab === 'chat' ? '2px solid #5b21b6' : 'none',
                  marginBottom: '-2px'
                }}
                onClick={() => setLogsTab('chat')}
              >
                Chat Logs
              </button>
              <button 
                style={{
                  background: 'none', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer',
                  fontWeight: 600, color: logsTab === 'call' ? '#5b21b6' : '#64748b',
                  borderBottom: logsTab === 'call' ? '2px solid #5b21b6' : 'none',
                  marginBottom: '-2px'
                }}
                onClick={() => setLogsTab('call')}
              >
                Call Logs
              </button>
            </div>
            
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                marginBottom: "1.5rem",
              }}
            >
              <h3
                className="chart-title"
                style={{ color: "#1e1b4b", fontSize: "1.1rem", margin: 0 }}
              >
                {logsTab === 'call' ? 'Voice Calls' : 'Text Chats'}
              </h3>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                }}
              >
                {dateFilter !== "All Time"
                  ? `Filtered: ${filteredLogs.length} of ${interactions.length}`
                  : `Showing ${filteredLogs.length} of ${interactions.length}`}
              </span>
            </div>
            {/* Logs Table */}
            <div className="table-responsive logs-table-container">
              {isLoading ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
                  <Loader text="Loading interactions..." />
                </div>
              ) : (
                <table className="customers-table logs-table">
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Channel</th>
                      <th>Routing</th>
                      <th>State</th>
                      <th>Context Summary</th>
                      <th>CSAT &amp; Sentiment</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <tr key={log.id}>
                          {/* Customer */}
                          <td>
                            <div
                              style={{ display: "flex", flexDirection: "column" }}
                            >
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: "#1e293b",
                                  fontSize: "0.875rem",
                                }}
                              >
                                {log.customerName}
                              </span>
                              <span
                                style={{ fontSize: "0.75rem", color: "#94a3b8" }}
                              >
                                {log.customerId}
                              </span>
                            </div>
                          </td>

                          {/* Channel */}
                          <td>
                            <span className="log-tag tag-channel">
                              {log.channel}
                            </span>
                          </td>

                          {/* Routing */}
                          <td>
                            {log.assignedUser ? (
                              <span className="log-tag tag-human">
                                {log.assignedUser}
                              </span>
                            ) : (
                              <span className="log-tag tag-ai">AI Assistant</span>
                            )}
                          </td>

                          {/* State */}
                          <td>
                            <span
                              className={`log-tag tag-status-${log.status.toLowerCase()}`}
                            >
                              {log.status}
                            </span>
                          </td>

                          {/* Notes */}
                          <td style={{ maxWidth: "240px" }}>
                            <span
                              style={{
                                color: "#475569",
                                fontSize: "0.83rem",
                                lineHeight: "1.4",
                                display: "inline-block",
                              }}
                            >
                              {log.notes || "—"}
                            </span>
                          </td>

                          {/* CSAT & Sentiment */}
                          <td>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "5px",
                                alignItems: "flex-start",
                              }}
                            >
                              <span
                                className={`log-tag tag-sentiment-${log.sentimentTag.toLowerCase()}`}
                              >
                                {log.sentimentTag}
                              </span>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "baseline",
                                  gap: "4px",
                                }}
                              >
                                <span
                                  style={{
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                    color: "#1e293b",
                                  }}
                                >
                                  {log.sentimentScore}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "#94a3b8",
                                  }}
                                >
                                  /10
                                </span>
                                {log.feedbackRating ? (
                                  <span
                                    style={{
                                      fontSize: "0.72rem",
                                      color: "#64748b",
                                      marginLeft: "6px",
                                    }}
                                  >
                                    · CSAT {log.feedbackRating}/10
                                  </span>
                                ) : (
                                  <span
                                    style={{
                                      fontSize: "0.72rem",
                                      color: "#cbd5e1",
                                      marginLeft: "6px",
                                    }}
                                  >
                                    · No rating
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Action */}
                          <td>
                            {logsTab === 'call' ? (
                              <button
                                className="log-view-btn"
                                onClick={() => navigate(`/calls/${log.id}`)}
                              >
                                <Phone size={13} />
                                View Call
                              </button>
                            ) : (
                              <button
                                className="log-view-btn"
                                onClick={() => navigate(`/conversations/${log.id}`)}
                              >
                                <ExternalLink size={13} />
                                View Chat
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="7"
                          className="center-text"
                          style={{ padding: "3rem", color: "#94a3b8" }}
                        >
                          No interactions match your search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LogsPage;
