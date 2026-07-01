import { useState, useRef, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import {
  Search,
  Filter,
  Users,
  UserCheck,
  UserPlus,
  Star,
  CalendarDays,
} from "lucide-react";
import { format, startOfDay } from "date-fns";
import "./LogsPage.css";
import "./TicketsPage.css";
import "./CustomersPage.css";

import apiClient from "../api/apiClient";


const LOYALTY_TIERS = ["New", "Regular", "VIP"];

const formatDate = (isoString) => {
  const d = new Date(isoString);
  return {
    date: d.toLocaleDateString("en-GB", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    time: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }),
  };
};

/* ─── Component ─────────────────────────────────────────────────── */
const CustomersPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filterLoyalty, setFilterLoyalty] = useState([]);
  const [sortConfig, setSortConfig] = useState({
    key: "createdAt",
    direction: "desc",
  });

  const [dateFilter, setDateFilter] = useState("All Time");
  
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const filterRef = useRef(null);
  const activeCount = filterLoyalty.length;

  useEffect(() => {
    const onOutside = (e) => {
      if (filterRef.current && !filterRef.current.contains(e.target))
        setShowFilter(false);
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, []);

  useEffect(() => {
    const fetchCustomers = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/api/Customer');
        const data = response.data || [];
        
        const mappedCustomers = data.map(c => {
          const totalOrders = c.orders?.length || 0;
          let loyaltyTier = "New";
          if (totalOrders > 10) loyaltyTier = "VIP";
          else if (totalOrders > 3) loyaltyTier = "Regular";
          
          return {
            ...c,
            customerId: c.id || c.customerId || "UNKNOWN",
            fullName: c.fullName || "Unknown Customer",
            email: c.email || null,
            phone: c.phone || null,
            totalOrders: totalOrders,
            loyalty: loyaltyTier,
            createdAt: c.createdAt || new Date().toISOString()
          };
        });
        setCustomers(mappedCustomers);
      } catch (error) {
        console.error("Failed to fetch customers:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  const toggle = (list, setList, value) =>
    setList((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );

  const clearFilters = () => setFilterLoyalty([]);

  /* Stat filtered by applied date range */
  const statFiltered = customers.filter((c) => {
    if (dateFilter === "All Time") return true;
    const d = new Date(c.createdAt);
    if (dateFilter === "Today") return d >= startOfDay(new Date());
    if (dateFilter === "Last 7 Days")
      return d >= startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
    if (dateFilter === "Last 30 Days")
      return d >= startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    return true;
  });

  const stats = {
    total: statFiltered.length,
    newC: statFiltered.filter((c) => c.loyalty === "New").length,
    regular: statFiltered.filter((c) => c.loyalty === "Regular").length,
    vip: statFiltered.filter((c) => c.loyalty === "VIP").length,
  };

  /* Table filtered - includes date range filtering */
  const filtered = customers.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      q === "" ||
      c.customerId.toLowerCase().includes(q) ||
      c.fullName.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.phone && c.phone.includes(q));

    const matchesDate = (() => {
      if (dateFilter === "All Time") return true;
      const d = new Date(c.createdAt);
      if (dateFilter === "Today") return d >= startOfDay(new Date());
      if (dateFilter === "Last 7 Days")
        return d >= startOfDay(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
      if (dateFilter === "Last 30 Days")
        return d >= startOfDay(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
      return true;
    })();

    return (
      matchesSearch &&
      matchesDate &&
      (filterLoyalty.length === 0 || filterLoyalty.includes(c.loyalty))
    );
  });

  const requestSort = (key) =>
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));

  const getSortIndicator = (key) =>
    sortConfig.key !== key ? null : (
      <span className="sort-icon">
        {sortConfig.direction === "asc" ? "↑" : "↓"}
      </span>
    );

  const LOYALTY_WT = { VIP: 3, Regular: 2, New: 1 };
  const sorted = [...filtered].sort((a, b) => {
    let valA, valB;
    if (sortConfig.key === "loyalty") {
      valA = LOYALTY_WT[a.loyalty] || 0;
      valB = LOYALTY_WT[b.loyalty] || 0;
    } else if (sortConfig.key === "totalOrders") {
      valA = a.totalOrders;
      valB = b.totalOrders;
    } else if (sortConfig.key === "createdAt") {
      valA = new Date(a.createdAt).getTime();
      valB = new Date(b.createdAt).getTime();
    } else {
      valA = (a[sortConfig.key] || "").toString().toLowerCase();
      valB = (b[sortConfig.key] || "").toString().toLowerCase();
    }
    if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
    if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const STAT_CARDS = [
    { label: "Total Customers", value: stats.total, Icon: Users },
    { label: "New Customers", value: stats.newC, Icon: UserPlus },
    { label: "Regular", value: stats.regular, Icon: UserCheck },
    { label: "VIP Customers", value: stats.vip, Icon: Star },
  ];

  return (
    <div className="app-layout">
      <Sidebar />
      <div
        className="main-content-area"
        style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}
      >
        <Topbar
          pageTitle="Customers"
          subtitle={`${dateFilter !== "All Time" ? stats.total : customers.length} customers registered across your business.`}
        >
          <div className="logs-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by ID, name, email or phone..."
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
                  Joined Today
                </option>
                <option
                  value="Last 7 Days"
                  style={{ color: "#1e293b", background: "white" }}
                >
                  Joined Last 7 Days
                </option>
                <option
                  value="Last 30 Days"
                  style={{ color: "#1e293b", background: "white" }}
                >
                  Joined Last 30 Days
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
              <Filter size={16} /> <span>Filters</span>
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
                <div className="filter-section">
                  <h5>Customer Tier</h5>
                  <div className="filter-options">
                    {LOYALTY_TIERS.map((opt) => (
                      <label key={opt} className="filter-checkbox-label">
                        <input
                          type="checkbox"
                          checked={filterLoyalty.includes(opt)}
                          onChange={() =>
                            toggle(filterLoyalty, setFilterLoyalty, opt)
                          }
                        />
                        <span className="checkbox-custom"></span>
                        {opt}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </Topbar>

        <main className="dashboard-content-wrapper">
          {/* ── Stat Section ─────────────────────────── */}
          <div className="cust-stat-section">
            {/* Dark Stat Cards */}
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

          {/* ── Table ────────────────────────────────── */}
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
              <Users size={18} color="#475569" />
              <h3
                className="chart-title"
                style={{ color: "#1e1b4b", fontSize: "1.1rem", margin: 0 }}
              >
                Customer Directory
              </h3>
              <span
                style={{
                  marginLeft: "auto",
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                }}
              >
                {dateFilter !== "All Time"
                  ? `Filtered: ${sorted.length} of ${customers.length}`
                  : `Showing ${sorted.length} of ${customers.length}`}
              </span>
            </div>

            <div className="table-responsive">
              {isLoading ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
                  <Loader text="Loading customers..." />
                </div>
              ) : (
                <table className="customers-table logs-table">
                  <thead>
                    <tr>
                    <th>Customer ID</th>
                    <th
                      className={
                        sortConfig.key === "fullName"
                          ? "sort-active"
                          : "sort-clickable"
                      }
                      onClick={() => requestSort("fullName")}
                    >
                      Name{" "}
                      {getSortIndicator("fullName") || (
                        <span style={{ color: "transparent" }}>↓</span>
                      )}
                    </th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th
                      className={
                        sortConfig.key === "totalOrders"
                          ? "sort-active"
                          : "sort-clickable"
                      }
                      onClick={() => requestSort("totalOrders")}
                    >
                      Orders{" "}
                      {getSortIndicator("totalOrders") || (
                        <span style={{ color: "transparent" }}>↓</span>
                      )}
                    </th>
                    <th
                      className={
                        sortConfig.key === "loyalty"
                          ? "sort-active"
                          : "sort-clickable"
                      }
                      onClick={() => requestSort("loyalty")}
                    >
                      Tier{" "}
                      {getSortIndicator("loyalty") || (
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
                      Joined{" "}
                      {getSortIndicator("createdAt") || (
                        <span style={{ color: "transparent" }}>↓</span>
                      )}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.length > 0 ? (
                    sorted.map((c) => {
                      const dt = formatDate(c.createdAt);
                      return (
                        <tr key={c.customerId}>
                          <td>
                            <span className="customer-id-chip">
                              {c.customerId}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "#1e293b",
                                fontSize: "0.875rem",
                              }}
                            >
                              {c.fullName}
                            </span>
                          </td>
                          <td>
                            {c.email ? (
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#475569",
                                }}
                              >
                                {c.email}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#cbd5e1",
                                  fontStyle: "italic",
                                }}
                              >
                                —
                              </span>
                            )}
                          </td>
                          <td>
                            {c.phone ? (
                              <span
                                style={{
                                  fontSize: "0.85rem",
                                  color: "#475569",
                                  fontFamily: "monospace",
                                }}
                              >
                                {c.phone}
                              </span>
                            ) : (
                              <span
                                style={{
                                  fontSize: "0.8rem",
                                  color: "#cbd5e1",
                                  fontStyle: "italic",
                                }}
                              >
                                —
                              </span>
                            )}
                          </td>
                          <td>
                            <span
                              style={{
                                fontWeight: 700,
                                color: "#1e293b",
                                fontSize: "0.9rem",
                              }}
                            >
                              {c.totalOrders}
                            </span>
                          </td>
                          <td>
                            <span
                              className={`log-tag tag-tier-${c.loyalty.toLowerCase()}`}
                            >
                              {c.loyalty}
                            </span>
                          </td>
                          <td>
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
                                style={{ fontSize: "0.7rem", color: "#94a3b8" }}
                              >
                                {dt.time}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="7"
                        className="center-text"
                        style={{ padding: "3rem", color: "#94a3b8" }}
                      >
                        No customers match your search criteria.
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

export default CustomersPage;
