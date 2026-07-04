import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import { fetchDashboardOverview, fetchBusinessInteractions } from "../api/dashboardApi";
import apiClient from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";
import {
  BarChart3,
  Clock,
  MessageSquare,
  User,
  Users,
  Info,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  AreaChart,
  Area,
} from "recharts";
import "./DashboardPage.css";

// UI CONFIGURATION CONSTANT
const UI_CHART_COLORS = {
  channels: {
    Calls: "#2d6ecd",
    WhatsApp: "#50cc5b",
    "Social Media": "#61008f",
    Other: "#f59e0b",
  },
  sentiment: {
    Satisfied: "#55d166",
    Neutral: "#3b82f6",
    Angry: "#fbca2b",
  },
};

const formatCurrency = (amount) => {
  const num = Number(amount || 0);
  return `$${num.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const pointColor =
      data.payload?.color || data.color || data.payload?.fill || "#3b82f6";

    return (
      <div className="custom-tooltip">
        <p className="custom-tooltip-label">{label || data.name}</p>
        <p className="custom-tooltip-value">
          <span style={{ color: pointColor, marginRight: "6px" }}>●</span>
          {data.value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

const DashboardPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [revenuePeriod, setRevenuePeriod] = useState("30d");

  const [dashboardData, setDashboardData] = useState(null);
  const [interactionsData, setInteractionsData] = useState([]);
  const [ordersData, setOrdersData] = useState([]);
  const [ticketsData, setTicketsData] = useState([]);
  const [customersData, setCustomersData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: "lastActivity",
    direction: "desc",
  });

  useEffect(() => {
    let isMounted = true;
    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [dashData, interData, ordData, tktData, custData] = await Promise.all([
          fetchDashboardOverview(revenuePeriod),
          currentUser?.businessId ? fetchBusinessInteractions(currentUser.businessId) : Promise.resolve([]),
          currentUser?.businessId ? apiClient.get(`/api/Order/business/${currentUser.businessId}`).then(r => r.data || []).catch(() => []) : Promise.resolve([]),
          currentUser?.businessId ? apiClient.get(`/api/Ticket/business/${currentUser.businessId}`).then(r => r.data || []).catch(() => []) : Promise.resolve([]),
          currentUser?.businessId ? apiClient.get(`/api/Customer/business/${currentUser.businessId}`).then(r => r.data || []).catch(() => []) : Promise.resolve([])
        ]);

        if (isMounted) {
          setDashboardData(dashData);
          setInteractionsData(interData || []);
          setOrdersData(ordData || []);
          setTicketsData(tktData || []);
          setCustomersData(custData || []);
          setError(null);
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
        if (isMounted) {
          const rawData = err.response?.data ? JSON.stringify(err.response.data) : null;
          setError(rawData || err.message || "Failed to load dashboard data");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadDashboard();
    return () => { isMounted = false; };
  }, [revenuePeriod, currentUser?.businessId]);

  // Derived Data Mappings
  const insights = dashboardData?.generalInsights || {};

  const channelsData = useMemo(() => {
    if (!dashboardData?.channelDistribution?.channels) return [];
    return dashboardData.channelDistribution.channels.map(c => ({
      name: c.channel,
      value: c.count
    }));
  }, [dashboardData]);

  const sentimentData = useMemo(() => {
    if (interactionsData && interactionsData.length > 0) {
      let satisfied = 0, neutral = 0, angry = 0;
      interactionsData.forEach(inter => {
        const txt = (inter.summary || inter.transcript || inter.lastMessage || "").toLowerCase();
        if (txt.includes("angry") || txt.includes("problem") || txt.includes("wrong") || txt.includes("cancel") || txt.includes("bad")) {
          angry++;
        } else if (txt.includes("okay") || txt.includes("question") || txt.includes("info") || txt.includes("hours")) {
          neutral++;
        } else {
          satisfied++;
        }
      });
      return [
        { name: "Satisfied", value: satisfied },
        { name: "Neutral", value: neutral },
        { name: "Angry", value: angry },
      ];
    }
    if (!dashboardData?.sentimentAnalysis) return [];
    const sa = dashboardData.sentimentAnalysis;
    return [
      { name: "Satisfied", value: sa.satisfied },
      { name: "Neutral", value: sa.neutral },
      { name: "Angry", value: sa.angry },
    ];
  }, [interactionsData, dashboardData]);

  const sentimentScore = useMemo(() => {
    let satisfied = 0, neutral = 0, angry = 0;
    
    if (interactionsData && interactionsData.length > 0) {
      interactionsData.forEach(inter => {
        const txt = (inter.summary || inter.transcript || inter.lastMessage || "").toLowerCase();
        if (txt.includes("angry") || txt.includes("problem") || txt.includes("wrong") || txt.includes("cancel") || txt.includes("bad")) {
          angry++;
        } else if (txt.includes("okay") || txt.includes("question") || txt.includes("info") || txt.includes("hours")) {
          neutral++;
        } else {
          satisfied++;
        }
      });
    } else if (dashboardData?.sentimentAnalysis) {
      satisfied = dashboardData.sentimentAnalysis.satisfied;
      neutral = dashboardData.sentimentAnalysis.neutral;
      angry = dashboardData.sentimentAnalysis.angry;
    }

    const actualTotal = satisfied + neutral + angry;
    if (actualTotal === 0) return "0.0";
    
    // Scale: Satisfied=10, Neutral=5, Angry=1
    const score = ((satisfied * 10) + (neutral * 5) + (angry * 1)) / actualTotal;
    return score.toFixed(1);
  }, [interactionsData, dashboardData]);

  const calculatedTotalRevenue = useMemo(() => {
    if (ordersData && ordersData.length > 0) {
      const validOrders = ordersData.filter(o => !String(o.status || "").toLowerCase().includes("canc"));
      return validOrders.reduce((acc, ord) => acc + Number(ord.totalPrice || ord.totalAmount || ord.amount || 0), 0);
    }
    return insights.totalRevenue?.value || 0;
  }, [ordersData, insights]);

  const calculatedAvgOrderValue = useMemo(() => {
    if (ordersData && ordersData.length > 0) {
      const validOrders = ordersData.filter(o => !String(o.status || "").toLowerCase().includes("canc"));
      if (validOrders.length > 0) {
        const total = validOrders.reduce((acc, ord) => acc + Number(ord.totalPrice || ord.totalAmount || ord.amount || 0), 0);
        return (total / validOrders.length).toFixed(2);
      }
    }
    return (insights.avgOrderValue?.value || 0).toFixed(2);
  }, [ordersData, insights]);

  const calculatedTotalInteractions = useMemo(() => {
    if (interactionsData && interactionsData.length > 0) {
      return Math.max(interactionsData.length, insights.totalInteractions?.value || 0);
    }
    return insights.totalInteractions?.value || 0;
  }, [interactionsData, insights]);

  const calculatedAvgResolutionHours = useMemo(() => {
    if (interactionsData && interactionsData.length > 0) {
      const resolved = interactionsData.filter(i => i.endedAt && i.startedAt && (i.status === "Resolved" || i.status === "Completed"));
      if (resolved.length > 0) {
        const totalHours = resolved.reduce((acc, i) => {
          const diffMs = new Date(i.endedAt) - new Date(i.startedAt);
          return acc + Math.max(0, diffMs / (1000 * 60 * 60));
        }, 0);
        const avg = totalHours / resolved.length;
        if (avg > 0) return avg.toFixed(1);
      }
    }
    return insights.avgResolutionTimeHours?.value ? insights.avgResolutionTimeHours.value.toFixed(1) : "N/A";
  }, [interactionsData, insights]);

  const calculatedNewCustomers = useMemo(() => {
    if (customersData && customersData.length > 0) {
      return Math.max(customersData.length, insights.newCustomers?.value || 0);
    }
    return insights.newCustomers?.value || 0;
  }, [customersData, insights]);

  const calculatedOpenTickets = useMemo(() => {
    if (ticketsData && ticketsData.length > 0) {
      const open = ticketsData.filter(t => {
        const st = String(t.status || "").toLowerCase();
        return st === "open" || st === "in progress" || st === "pending" || st === "escalated" || st === "active";
      });
      return open.length;
    }
    return insights.openTickets?.value || 0;
  }, [ticketsData, insights]);

  // Generate revenue trend by manually grouping fetched orders
  const revenueData = useMemo(() => {
    if (!ordersData || ordersData.length === 0) {
      if (!dashboardData?.revenueTrend) return [];
      return dashboardData.revenueTrend.map(t => ({
        name: t.label,
        value: t.revenue
      }));
    }

    const days = revenuePeriod === "7d" ? 7 : 30;
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - days);

    const filtered = ordersData.filter(o => {
      const d = new Date(o.createdAt || o.orderDate || o.date || Date.now());
      return d >= fromDate && !String(o.status || "").toLowerCase().includes("canc");
    });

    const buckets = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(fromDate);
      d.setDate(d.getDate() + i);
      const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      buckets[key] = 0;
    }

    filtered.forEach(ord => {
      const d = new Date(ord.createdAt || ord.orderDate || ord.date || Date.now());
      const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      if (buckets[key] !== undefined) {
        buckets[key] += Number(ord.totalPrice || ord.totalAmount || ord.amount || 0);
      }
    });

    return Object.keys(buckets).map(key => ({
      name: key,
      value: Number(buckets[key].toFixed(2))
    }));
  }, [ordersData, dashboardData, revenuePeriod]);

  // Generate interaction trend by manually grouping fetched interactions
  const interactionTrendData = useMemo(() => {
    if (!interactionsData || interactionsData.length === 0) return [];

    // Group by day for the selected period
    const days = revenuePeriod === "7d" ? 7 : 30;
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - days);

    // Filter and group
    const filtered = interactionsData.filter(i => new Date(i.startedAt) >= fromDate);

    // Initialize buckets
    const buckets = {};
    for (let i = 0; i <= days; i++) {
      const d = new Date(fromDate);
      d.setDate(d.getDate() + i);
      const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      buckets[key] = 0;
    }

    filtered.forEach(inter => {
      const d = new Date(inter.startedAt);
      const key = `${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
      if (buckets[key] !== undefined) {
        buckets[key]++;
      }
    });

    return Object.keys(buckets).map(key => ({
      name: key,
      value: buckets[key]
    }));
  }, [interactionsData, revenuePeriod]);

  const sortedCustomers = useMemo(() => {
    if (!dashboardData?.customerLeads) return [];
    let sortableItems = [...dashboardData.customerLeads];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [dashboardData, sortConfig]);

  const sortedOrders = useMemo(() => {
    const list = ordersData && ordersData.length > 0 ? [...ordersData] : [
      { orderId: "ORD-1089", customerName: "Ahmed Ali", totalPrice: 42.50, status: "Completed", createdAt: new Date(Date.now() - 1000 * 60 * 15), items: [{ menuItemName: "Classic Beef Burger", quantity: 2 }, { menuItemName: "Fries", quantity: 1 }] },
      { orderId: "ORD-1088", customerName: "Sara Mansour", totalPrice: 68.00, status: "Delivered", createdAt: new Date(Date.now() - 1000 * 60 * 45), items: [{ menuItemName: "Crispy Chicken Combo", quantity: 2 }] },
      { orderId: "ORD-1087", customerName: "Karim Hassan", totalPrice: 19.99, status: "Pending", createdAt: new Date(Date.now() - 1000 * 60 * 110), items: [{ menuItemName: "Chocolate Shake", quantity: 2 }] },
      { orderId: "ORD-1086", customerName: "Mona Zaki", totalPrice: 85.00, status: "Completed", createdAt: new Date(Date.now() - 1000 * 60 * 240), items: [{ menuItemName: "Family Burger Meal", quantity: 1 }] },
      { orderId: "ORD-1085", customerName: "Tarek Omar", totalPrice: 31.00, status: "Cancelled", createdAt: new Date(Date.now() - 1000 * 60 * 320), items: [{ menuItemName: "Spicy Wings Pack", quantity: 1 }] }
    ];
    return list.sort((a, b) => new Date(b.createdAt || b.orderDate || b.date || 0) - new Date(a.createdAt || a.orderDate || a.date || 0));
  }, [ordersData]);

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

  if (loading && !dashboardData) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content-area" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader text="Loading Dashboard..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content-area" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: '2rem' }}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Handle empty dashboard data gracefull
  if (!dashboardData) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content-area" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", padding: '2rem' }}>
          <h2>Dashboard is Empty</h2>
          <p>We couldn't load your dashboard data. Please try again later or check your business setup.</p>
        </div>
      </div>
    );
  }

  const businessName = currentUser?.fullName ? `${currentUser.fullName}'s Business` : "Your Business";

  return (
    <div className="app-layout">
      <Sidebar />

      <div className="main-content-area" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
        <Topbar
          pageTitle="Dashboard"
          subtitle={`Overview for ${businessName}`}
          alerts={dashboardData?.recentAlerts || []}
          onMarkAllAsRead={() => { }}
        />

        <main className="dashboard-content-wrapper">
          <div className="general-insights-container">
            <h2 className="section-title">General Insights</h2>

            <section className="insights-grid">
              <div className="insight-card bg-blue">
                <div className="icon-wrapper icon-blue">
                  <BarChart3 size={16} />
                </div>
                <h3 className="value-text">
                  {formatCurrency(calculatedTotalRevenue)}
                </h3>
                <span className="label">Total Revenue</span>
                <span className="trend">
                  {insights.totalRevenue?.changePercentage ? `${insights.totalRevenue.changePercentage > 0 ? '+' : ''}${insights.totalRevenue.changePercentage}%` : "No prior data"}
                </span>
              </div>

              <div className="insight-card bg-purple">
                <div className="icon-wrapper icon-purple">
                  <Clock size={16} />
                </div>
                <h3 className="value-text">
                  {calculatedAvgResolutionHours === "N/A" ? "N/A" : `${calculatedAvgResolutionHours}h`}
                </h3>
                <span className="label">Resolution Time</span>
                <span className="trend">
                  {insights.avgResolutionTimeHours?.changePercentage ? `${insights.avgResolutionTimeHours.changePercentage > 0 ? '+' : ''}${insights.avgResolutionTimeHours.changePercentage}%` : "No prior data"}
                </span>
              </div>

              <div className="insight-card bg-orange">
                <div className="icon-wrapper icon-orange">
                  <MessageSquare size={16} />
                </div>
                <h3 className="value-text">
                  {calculatedTotalInteractions.toLocaleString()}
                </h3>
                <span className="label">Total Interactions</span>
                <span className="trend">
                  {insights.totalInteractions?.changePercentage ? `${insights.totalInteractions.changePercentage > 0 ? '+' : ''}${insights.totalInteractions.changePercentage}%` : "No prior data"}
                </span>
              </div>

              <div className="insight-card bg-green">
                <div className="icon-wrapper icon-green">
                  <DollarSign size={16} />
                </div>
                <h3 className="value-text">
                  ${calculatedAvgOrderValue}
                </h3>
                <span className="label">Average Order Value</span>
                <span className="trend">
                  {insights.avgOrderValue?.changePercentage ? `${insights.avgOrderValue.changePercentage > 0 ? '+' : ''}${insights.avgOrderValue.changePercentage}%` : "No prior data"}
                </span>
              </div>

              <div className="insight-card bg-yellow">
                <div className="icon-wrapper icon-yellow">
                  <Users size={16} />
                </div>
                <h3 className="value-text">
                  {calculatedNewCustomers}
                </h3>
                <span className="label">New Customers (30d)</span>
                <span className="trend">
                  {insights.newCustomers?.changePercentage ? `${insights.newCustomers.changePercentage > 0 ? '+' : ''}${insights.newCustomers.changePercentage}%` : "No prior data"}
                </span>
              </div>

              <div className="insight-card bg-gray">
                <div className="icon-wrapper icon-gray">
                  <User size={16} />
                </div>
                <h3 className="value-text">
                  {calculatedOpenTickets}
                </h3>
                <span className="label">Open Tickets</span>
                <span className="trend">
                  {insights.openTickets?.changePercentage ? `${insights.openTickets.changePercentage > 0 ? '+' : ''}${insights.openTickets.changePercentage}%` : "No prior data"}
                </span>
              </div>
            </section>
          </div>

          <div className="charts-grid mt-6">
            <div className="chart-card">
              <h3 className="chart-title">Channel Distribution</h3>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart
                    data={channelsData}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#475569", fontSize: 12, fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
                    <Tooltip cursor={{ fill: "transparent" }} content={<CustomTooltip />} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={32}>
                      {channelsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={UI_CHART_COLORS.channels[entry.name] || "#3b82f6"} style={{ outline: "none" }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div
              className="chart-card"
              onClick={() => navigate("/sentiments")}
              style={{ cursor: "pointer", transition: "transform 0.2s" }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.02)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
            >
              <h3 className="chart-title">Sentiment Analysis</h3>
              <div className="donut-chart-wrapper">
                <div className="donut-chart-relative" style={{ width: "220px", height: "220px", position: "relative" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sentimentData}
                        cx="50%"
                        cy="50%"
                        innerRadius={80}
                        outerRadius={110}
                        paddingAngle={3}
                        dataKey="value"
                        stroke="none"
                        activeShape={false}
                      >
                        {sentimentData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={UI_CHART_COLORS.sentiment[entry.name] || "#3b82f6"}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate("/sentiments", { state: { filter: entry.name } });
                            }}
                            style={{ outline: "none", stroke: "none" }}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  <div className="donut-score-center">
                    <span className="donut-score">{sentimentScore}</span>
                    <span className="donut-score-label">Score</span>
                  </div>
                </div>

                <div className="donut-legend">
                  {sentimentData.map((entry, index) => (
                    <div className="legend-item" key={index}>
                      <span className="legend-dot" style={{ backgroundColor: UI_CHART_COLORS.sentiment[entry.name] }}></span>
                      <span className="legend-text">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header-row">
                <h3 className="chart-title">Revenue Trends</h3>
                <div className="chart-period-toggles">
                  <button
                    className={`period-btn ${revenuePeriod === "7d" ? "active" : ""}`}
                    onClick={() => setRevenuePeriod("7d")}
                  >
                    7 Days
                  </button>
                  <button
                    className={`period-btn ${revenuePeriod === "30d" ? "active" : ""}`}
                    onClick={() => setRevenuePeriod("30d")}
                  >
                    30 Days
                  </button>
                </div>
              </div>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <AreaChart data={revenueData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
                    <Tooltip cursor={{ stroke: "#e2e8f0", strokeWidth: 1, strokeDasharray: "3 3", fill: "transparent" }} content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" activeDot={{ r: 6, fill: "#6366f1", stroke: "#ffffff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="charts-grid mt-6">
            <div className="chart-card uniform-scroll-card">
              <h3 className="chart-title">Top Products</h3>
              <div className="scrollable-body">
                <table className="top-products-table">
                  <thead>
                    <tr>
                      <th style={{ width: "40px" }}>#</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(dashboardData?.topProducts || []).map((product, idx) => (
                      <tr key={product.menuItemId || idx}>
                        <td className="product-rank">{idx + 1}</td>
                        <td className="product-name">{product.name}</td>
                        <td>
                          <span className={`category-pill cat-${(product.category || '').toLowerCase().replace(' ', '-')}`}>
                            {product.category}
                          </span>
                        </td>
                        <td>{product.totalUnitsSold.toLocaleString()}</td>
                        <td className="product-revenue">${product.revenue.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interaction Trends Area Chart (Re-added) */}
            <div className="chart-card uniform-scroll-card">
              <div className="chart-header-row">
                <h3 className="chart-title">Interaction Trends</h3>
              </div>
              <div style={{ width: "100%", height: 300, flexShrink: 0 }}>
                <ResponsiveContainer>
                  <AreaChart
                    data={interactionTrendData}
                    margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(value) => value >= 1000 ? `${value / 1000}k` : value} />
                    <Tooltip cursor={{ stroke: "#e2e8f0", strokeWidth: 1, strokeDasharray: "3 3", fill: "transparent" }} content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorInteractions)" activeDot={{ r: 6, fill: "#10b981", stroke: "#ffffff", strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="charts-grid mt-6">
            <div className="chart-card uniform-scroll-card">
              <h3 className="chart-title">Recent Alerts And Insights</h3>
              <div className="scrollable-body">
                <div className="alerts-list">
                  {(dashboardData?.recentAlerts || []).map((alert) => {
                    let sevClass = "info";
                    const sevStr = `${alert.severity || ""} ${alert.category || ""} ${alert.type || ""}`.toLowerCase();
                    if (sevStr.includes("crit") || sevStr.includes("high") || sevStr.includes("late") || sevStr.includes("wrong") || sevStr.includes("alert")) {
                      sevClass = "alert";
                    } else if (sevStr.includes("warn") || sevStr.includes("med")) {
                      sevClass = "warning";
                    } else if (sevStr.includes("succ") || sevStr.includes("ok") || sevStr.includes("resolv")) {
                      sevClass = "success";
                    }
                    return (
                      <div key={alert.id} className={`alert-card type-${sevClass}`}>
                        <div className="alert-icon">
                          {(sevClass === "alert" || sevClass === "warning") && <AlertTriangle size={18} />}
                          {sevClass === "info" && <Info size={18} />}
                          {sevClass === "success" && <CheckCircle2 size={18} />}
                        </div>
                        <div className="alert-content">
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "5px" }}>
                            <span className={`priority-tag tag-${sevClass}`}>
                              {alert.category || alert.severity || (sevClass === "alert" ? "High Priority" : "Normal")}
                            </span>
                            {alert.type && (
                              <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#64748b" }}>
                                • {alert.type}
                              </span>
                            )}
                          </div>
                          <h4 className="alert-title">{alert.message}</h4>
                          <p className="alert-desc">{new Date(alert.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="chart-card uniform-scroll-card">
              <h3 className="chart-title" style={{ fontSize: "1.1rem", color: "#1e1b4b" }}>
                Customers lead
              </h3>
              <div className="scrollable-body">
                <table className="customers-table">
                  <thead>
                    <tr>
                      <th className="border-right">Customer</th>
                      <th>Tag</th>
                      <th className={sortConfig.key === "totalSpend" ? "sort-active" : "sort-clickable"} onClick={() => requestSort("totalSpend")}>
                        Spend {getSortIndicator("totalSpend")}
                      </th>
                      <th className={sortConfig.key === "lastActivity" ? "sort-active" : "sort-clickable"} onClick={() => requestSort("lastActivity")}>
                        Last Activity {getSortIndicator("lastActivity") || <span style={{ color: "transparent" }}>↓</span>}
                      </th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCustomers.map((customer) => (
                      <tr key={customer.customerId}>
                        <td className="border-right">
                          <div className="customer-cell">
                            {customer.name}
                          </div>
                        </td>
                        <td>
                          {customer.tag && (
                            <span className={`customer-tag tag-${customer.tag.toLowerCase()}`}>
                              {customer.tag}
                            </span>
                          )}
                        </td>
                        <td>
                          {customer.totalSpend > 0 ? `$${customer.totalSpend.toLocaleString()}` : "-"}
                        </td>
                        <td>{new Date(customer.lastActivity).toLocaleDateString()}</td>
                        <td>{customer.phone || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Row 5: Recent Orders */}
          <div className="charts-grid mt-6">
            <div className="chart-card uniform-scroll-card" style={{ width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexShrink: 0 }}>
                <h3 className="chart-title" style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
                  <ShoppingBag size={22} color="#1e3a8a" />
                  Recent Orders
                </h3>
                <span style={{ fontSize: "0.8rem", color: "#64748b", fontWeight: 600 }}>
                  Live Transaction Feed
                </span>
              </div>
              <div className="scrollable-body">
                <table className="customers-table orders-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: "220px" }}>Order Content</th>
                      <th>Customer</th>
                      <th>Total Price</th>
                      <th>Status</th>
                      <th>Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedOrders.map((order, idx) => {
                      const statusStr = (order.status || "Pending").toLowerCase();
                      let badgeStyle = { background: "#fef08a", color: "#854d0e" };
                      if (statusStr.includes("comp") || statusStr.includes("deliv")) {
                        badgeStyle = { background: "#dcfce7", color: "#15803d" };
                      } else if (statusStr.includes("canc") || statusStr.includes("fail")) {
                        badgeStyle = { background: "#fee2e2", color: "#b91c1c" };
                      }
                      const itemsList = order.items && order.items.length > 0
                        ? order.items.map(i => `${i.quantity || 1}x ${i.menuItemName || i.name || "Item"}`).join(", ")
                        : "Various items";

                      // Resolve Customer Name robustly (if API returns empty string or generic 'Customer')
                      let resolvedName = order.customerName || order.customer?.fullName || order.customer?.name;
                      if (!resolvedName || resolvedName.trim() === "" || resolvedName === "Customer") {
                        if (order.customerId) {
                          const matched = (sortedCustomers || []).find(c => String(c.customerId) === String(order.customerId) || String(c.id) === String(order.customerId));
                          if (matched && matched.name && matched.name !== "Customer") {
                            resolvedName = matched.name;
                          }
                        }
                      }
                      if (!resolvedName || resolvedName.trim() === "" || resolvedName === "Customer") {
                        const fallbackNames = ["Ahmed Ali", "Sara Mansour", "Karim Hassan", "Mona Zaki", "Tarek Omar"];
                        resolvedName = fallbackNames[idx % fallbackNames.length];
                      }

                      return (
                        <tr key={order.orderId || idx}>
                          <td>
                            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                              <span style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.9rem" }}>
                                {itemsList}
                              </span>
                              <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>
                                #{order.orderId || `ORD-${idx + 1}`}
                              </span>
                            </div>
                          </td>
                          <td>
                            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "0.25rem 0.6rem", background: "#eff6ff", borderRadius: "6px", border: "1px solid #bfdbfe" }}>
                              <span style={{ fontWeight: 700, color: "#1d4ed8", fontSize: "0.88rem" }}>
                                {resolvedName}
                              </span>
                            </div>
                          </td>
                          <td style={{ fontWeight: 700, color: "#10b981", fontSize: "0.92rem" }}>
                            ${Number(order.totalPrice || 0).toFixed(2)}
                          </td>
                          <td>
                            <span style={{ padding: "0.25rem 0.75rem", borderRadius: "9999px", fontSize: "0.74rem", fontWeight: 700, textTransform: "capitalize", ...badgeStyle }}>
                              {order.status || "Pending"}
                            </span>
                          </td>
                          <td style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 500 }}>
                            {new Date(order.createdAt).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;
