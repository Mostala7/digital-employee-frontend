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
import { useAuth } from "../contexts/AuthContext";


const STATUSES = ["Resolved", "Active", "Escalated"];
const CHANNELS = ["Calls", "WhatsApp", "Social Media", "Other"];
const SENTIMENTS = ["Satisfied", "Neutral", "Angry", "Unrated"];

const formatDateTime = (isoString) => {
  if (!isoString) return { date: "—", time: "" };
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return { date: "—", time: "" };
  return {
    date: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

const LogsPage = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterStatus, setFilterStatus] = useState([]);
  const [filterChannel, setFilterChannel] = useState([]);
  const [filterSentiment, setFilterSentiment] = useState([]);
  const [dateFilter, setDateFilter] = useState("All Time");
  const [sortConfig, setSortConfig] = useState({ key: "updatedAt", direction: "desc" });

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
      if (!currentUser?.businessId) return;
      setIsLoading(true);
      try {
        const intUrl = `/api/Interaction/business/${currentUser.businessId}`;
        const fbUrl = `/api/Feedback/business/${currentUser.businessId}`;

        // Fetch both Interactions and Feedbacks concurrently
        const [interactionsRes, feedbacksRes] = await Promise.all([
          apiClient.get(intUrl),
          apiClient.get(fbUrl).catch(() => ({ data: [] })) // Safe fallback
        ]);

        const interactionsData = interactionsRes.data || [];
        const feedbacksData = feedbacksRes.data || [];

        // Map feedbacks by interactionId, customerId, or customerName for bulletproof O(1) lookup
        const feedbackMap = {};
        const feedbackByCustomerMap = {};
        const feedbackByNameMap = {};

        feedbacksData.forEach(fb => {
          const intId = fb.interactionId || fb.InteractionId;
          const custId = fb.customerId || fb.CustomerId;
          const custName = (fb.customerName || fb.CustomerName || "").toLowerCase().trim();

          if (intId) feedbackMap[intId] = fb;
          if (custId) {
            if (!feedbackByCustomerMap[custId] || new Date(fb.createdAt || fb.CreatedAt) > new Date(feedbackByCustomerMap[custId].createdAt || feedbackByCustomerMap[custId].CreatedAt)) {
              feedbackByCustomerMap[custId] = fb;
            }
          }
          if (custName) {
            if (!feedbackByNameMap[custName] || new Date(fb.createdAt || fb.CreatedAt) > new Date(feedbackByNameMap[custName].createdAt || feedbackByNameMap[custName].CreatedAt)) {
              feedbackByNameMap[custName] = fb;
            }
          }
        });

        const mappedInteractions = interactionsData.map(t => {
          const id = t.interactionId || t.id || t.InteractionId || t.Id;
          const custId = t.customerId || t.CustomerId || t.customer?.id || t.customer?.Id;
          const custName = (t.customer?.name || t.customerName || t.CustomerName || "").toLowerCase().trim();

          const fb = feedbackMap[id] || feedbackByCustomerMap[custId] || feedbackByNameMap[custName] || {};
          const rating = fb.rating !== undefined && fb.rating !== null && Number(fb.rating) > 0 ? Number(fb.rating) : null;
          const comment = fb.comment || null;

          let tag = "Unrated";
          if (rating !== null) {
            if (rating >= 4) tag = "Satisfied";
            else if (rating <= 2) tag = "Angry";
            else tag = "Neutral";
          }

          return {
            id,
            customerName: t.customer?.name || t.customerName || "Unknown",
            customerId: t.customerId || "Unknown",
            channel: t.channel || "Other",
            assignedUser: t.handledByUser?.fullName || null,
            status: t.status || "Active",
            notes: t.interactionType || "Standard",
            feedbackRating: rating,
            feedbackComment: comment,
            sentimentTag: tag,
            createdAt: t.startedAt || new Date().toISOString(),
            updatedAt: t.updatedAt || t.endedAt || t.lastUpdatedAt || t.startedAt || new Date().toISOString()
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

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return (
      <span className="sort-icon">
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </span>
    );
  };

  const sortedLogs = [...filteredLogs].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let valA, valB;
    if (sortConfig.key === "updatedAt") {
      valA = new Date(a.updatedAt || a.createdAt).getTime();
      valB = new Date(b.updatedAt || b.createdAt).getTime();
    } else if (sortConfig.key === "customerName") {
      valA = (a.customerName || "").toLowerCase();
      valB = (b.customerName || "").toLowerCase();
    } else if (sortConfig.key === "status") {
      valA = (a.status || "").toLowerCase();
      valB = (b.status || "").toLowerCase();
    }

    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  return (
    <div className="app-layout">
      <Sidebar />
      <div
        className="main-content-area"
        style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}
      >
        <Topbar
          pageTitle="Interaction Logs"
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
                  maxWidth: "140px",
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
                  ? `Filtered: ${sortedLogs.length} of ${interactions.length}`
                  : `Showing ${sortedLogs.length} of ${interactions.length}`}
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
                      <th
                        className={sortConfig.key === "customerName" ? "sort-active" : "sort-clickable"}
                        onClick={() => requestSort("customerName")}
                      >
                        Customer {getSortIndicator("customerName") || <span style={{ color: "transparent" }}>↓</span>}
                      </th>
                      <th
                        className={sortConfig.key === "updatedAt" ? "sort-active" : "sort-clickable"}
                        onClick={() => requestSort("updatedAt")}
                      >
                        Last Updated {getSortIndicator("updatedAt") || <span style={{ color: "transparent" }}>↓</span>}
                      </th>
                      <th>Channel</th>
                      <th>Routing</th>
                      <th
                        className={sortConfig.key === "status" ? "sort-active" : "sort-clickable"}
                        onClick={() => requestSort("status")}
                      >
                        State {getSortIndicator("status") || <span style={{ color: "transparent" }}>↓</span>}
                      </th>

                      <th>Feedback</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLogs.length > 0 ? (
                      sortedLogs.map((log) => (
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

                          {/* Date & Time */}
                          <td>
                            {(() => {
                              const dt = formatDateTime(log.updatedAt || log.createdAt);
                              return (
                                <div
                                  style={{
                                    display: "flex",
                                    flexDirection: "column",
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: "0.85rem",
                                      color: "#1e293b",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {dt.date}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: "0.75rem",
                                      color: "#94a3b8",
                                    }}
                                  >
                                    {dt.time}
                                  </span>
                                </div>
                              );
                            })()}
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



                          {/* Feedback */}
                          <td>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "4px",
                                alignItems: "flex-start",
                              }}
                            >
                              <span
                                className={`log-tag tag-sentiment-${log.sentimentTag.toLowerCase()}`}
                              >
                                {log.sentimentTag}
                              </span>
                              {log.feedbackRating ? (
                                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b" }}>
                                    ★ {log.feedbackRating}/5
                                  </span>
                                  {log.feedbackComment && (
                                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontStyle: "italic", maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={log.feedbackComment}>
                                      "{log.feedbackComment}"
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span style={{ fontSize: "0.75rem", color: "#cbd5e1" }}>
                                  No feedback
                                </span>
                              )}
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
