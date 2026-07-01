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
  Ticket,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { startOfDay } from "date-fns";
import "./LogsPage.css"; // Reuse general logs page layout styles
import "./TicketsPage.css"; // Add specific ticket colors
import "./CustomersPage.css"; // Important: ensure we can pull "cust-dark-card" definitions

import apiClient from "../api/apiClient";

const formatDateTime = (isoString) => {
  const d = new Date(isoString);
  return {
    date: d.toLocaleDateString("en-GB", { month: "short", day: "numeric" }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

const PRIORITIES = ["Critical", "High", "Medium", "Low"];
const TYPES = ["Complaint", "Order Issue", "Billing", "Technical", "Inquiry"];
const STATUSES = ["In Progress", "Resolved", "Failed"];

const TicketsPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterPriority, setFilterPriority] = useState([]);
  const [filterStatus, setFilterStatus] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });
  const [dateFilter, setDateFilter] = useState("All Time");
  
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const activeCount = filterPriority.length + filterStatus.length;
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
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        // Attempt to fetch all tickets
        const response = await apiClient.get('/api/Ticket');
        const data = response.data || [];
        
        // Map backend properties to the UI's expected structure if they differ
        const mappedTickets = data.map(t => {
          let st = t.status || "In Progress";
          if (st === "InProgress" || st === "Open") st = "In Progress";
          else if (st === "Closed") st = "Resolved";
          else if (st === "Escalated") st = "Failed";

          return {
            ...t,
            ticketId: t.ticketId || t.id || "UNKNOWN",
            customerName: t.customer?.name || t.customerName || "Unknown Customer",
            priority: t.priorityLevel || t.priority || "Medium",
            status: st,
            createdAt: t.createdAt || new Date().toISOString()
          };
        });
        
        setTickets(mappedTickets);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTickets();
  }, []);

  const toggle = (list, setList, value) =>
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const clearFilters = () => {
    setFilterPriority([]);
    setFilterStatus([]);
  };

  const filteredTickets = tickets.filter((ticket) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      ticket.ticketId.toLowerCase().includes(q) ||
      ticket.customerName.toLowerCase().includes(q) ||
      ticket.subject.toLowerCase().includes(q);

    const matchesPriority =
      filterPriority.length === 0 || filterPriority.includes(ticket.priority);
    const matchesStatus =
      filterStatus.length === 0 || filterStatus.includes(ticket.status);

    const matchesDate = (() => {
      if (dateFilter === "All Time") return true;
      const d = new Date(ticket.createdAt);
      if (dateFilter === "Today") return d >= startOfDay(new Date());
      if (dateFilter === "Last 7 Days")
        return d >= startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      if (dateFilter === "Last 30 Days")
        return d >= startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      return true;
    })();

    return matchesSearch && matchesPriority && matchesStatus && matchesDate;
  });

  const statFilteredTickets = tickets.filter((ticket) => {
    if (dateFilter === "All Time") return true;
    const d = new Date(ticket.createdAt);
    if (dateFilter === "Today") return d >= startOfDay(new Date());
    if (dateFilter === "Last 7 Days")
      return d >= startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    if (dateFilter === "Last 30 Days")
      return d >= startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    return true;
  });

  const stats = {
    total: statFilteredTickets.length,
    inProgress: statFilteredTickets.filter((t) => t.status === "In Progress")
      .length,
    resolved: statFilteredTickets.filter((t) => t.status === "Resolved").length,
    failed: statFilteredTickets.filter((t) => t.status === "Failed").length,
  };

  const STAT_CARDS = [
    { label: "Total Tickets", value: stats.total, Icon: Ticket },
    { label: "In Progress", value: stats.inProgress, Icon: Clock },
    { label: "Resolved", value: stats.resolved, Icon: CheckCircle },
    { label: "Failed", value: stats.failed, Icon: XCircle },
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

  const PRIORITY_WT = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const STATUS_WT = { Failed: 3, "In Progress": 2, Resolved: 1 };

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (!sortConfig.key) return 0;

    let valA, valB;
    if (sortConfig.key === "priority") {
      valA = PRIORITY_WT[a.priority] || 0;
      valB = PRIORITY_WT[b.priority] || 0;
    } else if (sortConfig.key === "status") {
      valA = STATUS_WT[a.status] || 0;
      valB = STATUS_WT[b.status] || 0;
    } else if (sortConfig.key === "createdAt") {
      valA = new Date(a.createdAt).getTime();
      valB = new Date(b.createdAt).getTime();
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
          pageTitle="Support Tickets"
          subtitle="Manage escalations and customer support requests."
        >
          <div className="logs-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, customer or subject..."
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
                    label: "Priority",
                    list: filterPriority,
                    setList: setFilterPriority,
                    options: PRIORITIES,
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
                Active Tickets
              </h3>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                }}
              >
                {dateFilter !== "All Time"
                  ? `Filtered: ${sortedTickets.length} of ${tickets.length}`
                  : `Showing ${sortedTickets.length} of ${tickets.length}`}
              </span>
            </div>
            {/* Table */}
            <div className="table-responsive logs-table-container tickets-table-container">
              {isLoading ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
                  <Loader text="Loading tickets..." />
                </div>
              ) : (
                <table className="customers-table logs-table">
                  <thead>
                    <tr>
                    <th>Ticket ID</th>
                    <th>Subject</th>
                    <th>Customer</th>
                    <th>Type</th>
                    <th
                      className={
                        sortConfig.key === "status"
                          ? "sort-active"
                          : "sort-clickable"
                      }
                      onClick={() => requestSort("status")}
                    >
                      Status{" "}
                      {getSortIndicator("status") || (
                        <span style={{ color: "transparent" }}>↓</span>
                      )}
                    </th>
                    <th
                      className={
                        sortConfig.key === "priority"
                          ? "sort-active"
                          : "sort-clickable"
                      }
                      onClick={() => requestSort("priority")}
                    >
                      Priority{" "}
                      {getSortIndicator("priority") || (
                        <span style={{ color: "transparent" }}>↓</span>
                      )}
                    </th>
                    <th
                      className={
                        sortConfig.key === "createdAt"
                          ? "sort-active"
                          : "sort-clickable"
                      }
                      onClick={() => requestSort("createdAt")}
                    >
                      Opened{" "}
                      {getSortIndicator("createdAt") || (
                        <span style={{ color: "transparent" }}>↓</span>
                      )}
                    </th>
                    <th>Last Updated</th>
                    <th>Assigned To</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTickets.length > 0 ? (
                    sortedTickets.map((ticket) => (
                      <tr key={ticket.ticketId}>
                        <td>
                          <span
                            style={{
                              fontWeight: 600,
                              color: "#1e293b",
                              fontSize: "0.875rem",
                            }}
                          >
                            {ticket.ticketId}
                          </span>
                        </td>
                        <td style={{ maxWidth: "240px" }}>
                          <span
                            style={{
                              color: "#475569",
                              fontSize: "0.875rem",
                              fontWeight: 500,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              display: "inline-block",
                              width: "100%",
                            }}
                          >
                            {ticket.subject}
                          </span>
                        </td>
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
                              {ticket.customerName}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className="log-tag tag-channel">
                            {ticket.type}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`log-tag tag-status-${ticket.status.replace(" ", "-").toLowerCase()}`}
                          >
                            {ticket.status}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`log-tag tag-priority-${ticket.priority.toLowerCase()}`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td>
                          {(() => {
                            const dt = formatDateTime(ticket.createdAt);
                            return (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#1e293b",
                                    fontWeight: 500,
                                  }}
                                >
                                  {dt.date}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#94a3b8",
                                  }}
                                >
                                  {dt.time}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          {(() => {
                            const dt = formatDateTime(ticket.updatedAt);
                            return (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: "0.8rem",
                                    color: "#1e293b",
                                    fontWeight: 500,
                                  }}
                                >
                                  {dt.date}
                                </span>
                                <span
                                  style={{
                                    fontSize: "0.7rem",
                                    color: "#94a3b8",
                                  }}
                                >
                                  {dt.time}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                        <td>
                          {ticket.assignedTo === "Unassigned" ? (
                            <span className="log-tag tag-unassigned">
                              Unassigned
                            </span>
                          ) : (
                            <span className="log-tag tag-human">
                              {ticket.assignedTo}
                            </span>
                          )}
                        </td>
                        <td>
                          <button
                            className="log-view-btn"
                            onClick={() =>
                              navigate(
                                `/tickets/${encodeURIComponent(ticket.id)}`,
                              )
                            }
                          >
                            <ExternalLink size={13} />
                            View Ticket
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="9"
                        className="center-text"
                        style={{ padding: "3rem", color: "#94a3b8" }}
                      >
                        No tickets match your search criteria.
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

export default TicketsPage;
