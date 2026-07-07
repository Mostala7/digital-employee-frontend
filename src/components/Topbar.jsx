import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Bell, Info, AlertTriangle, CheckCircle2, Check } from "lucide-react";
import "./Topbar.css";
import apiClient from "../api/apiClient";

// eslint-disable-next-line react/prop-types
const Topbar = ({
  pageTitle,
  subtitle,
  children,
  alerts = [],
  onMarkAllAsRead,
}) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [liveNotifications, setLiveNotifications] = useState([]);
  const [readIds, setReadIds] = useState(new Set());
  const notificationRef = useRef(null);

  // Fetch real backend notifications with background polling
  useEffect(() => {
    if (!currentUser?.businessId) return;
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get(`/api/Notification/business/${currentUser.businessId}`);
        if (Array.isArray(res.data)) {
          setLiveNotifications(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, 15000);
    return () => clearInterval(intervalId);
  }, [currentUser?.businessId]);

  // Listen for real-time report readiness notifications
  useEffect(() => {
    const handleReportReady = (e) => {
      const newNotif = e.detail || {
        notificationId: "notif_rep_" + Date.now(),
        title: "Analytics Report Ready",
        message: "Your AI analytics report has generated and is ready to view.",
        severity: "Success",
        isRead: false,
        createdAt: new Date()
      };
      setLiveNotifications(prev => [newNotif, ...prev]);
    };
    window.addEventListener("newReportReady", handleReportReady);
    return () => window.removeEventListener("newReportReady", handleReportReady);
  }, []);

  // Merge parent alerts + API notifications, or fallback to default system activity
  const rawList = [...(alerts || []), ...liveNotifications];
  const defaults = [
    { id: "sys-1", title: "AI Assistant Active", desc: "Digital Employee voice & chat channels are monitoring interactions.", severity: "success", isRead: false },
    { id: "sys-2", title: "Knowledge Base Synchronized", desc: "Your business hours, menus, and rules are synced.", severity: "info", isRead: false },
    { id: "sys-3", title: "System Analytics Ready", desc: "Daily report metrics have been updated.", severity: "info", isRead: true }
  ];

  const processedList = (rawList.length > 0 ? rawList : defaults).map((item, idx) => {
    const id = item.id || item.notificationId || `notif-${idx}`;
    const title = item.title || item.type || item.category || "System Alert";
    const desc = item.description || item.message || item.content || "New activity detected on your account.";
    const isRead = item.isRead || readIds.has(id) || false;
    
    // Check all severity and priority attributes for unified color assignment
    const sevString = `${item.severity || ""} ${item.category || ""} ${item.priority || ""} ${item.type || ""} ${title}`.toLowerCase();
    let type = "info";
    if (sevString.includes("crit") || sevString.includes("high") || sevString.includes("late") || sevString.includes("wrong") || sevString.includes("alert") || sevString.includes("escalat")) {
      type = "alert";
    } else if (sevString.includes("warn") || sevString.includes("med")) {
      type = "warning";
    } else if (sevString.includes("succ") || sevString.includes("resolv") || sevString.includes("ok") || sevString.includes("ready")) {
      type = "success";
    }

    const badgeLabel = item.category || item.severity || (type === "alert" ? "High Priority" : type === "success" ? "Ready" : "Info");

    return { ...item, id, title, desc, isRead, normalizedType: type, badgeLabel };
  });

  const unreadCount = processedList.filter((a) => !a.isRead).length;

  const handleToggleNotifications = () => {
    const newShowState = !showNotifications;
    setShowNotifications(newShowState);
    if (newShowState && onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const handleMarkItemRead = async (item) => {
    setReadIds(prev => new Set([...prev, item.id]));
    const idToMark = item.notificationId || (item.id && !item.id.toString().startsWith("sys-") && !item.id.toString().startsWith("notif") ? item.id : null);
    if (idToMark) {
      try {
        await apiClient.put(`/api/Notification/${idToMark}/read`);
      } catch (err) {
        console.error("Failed to mark read:", err);
      }
    }
    setLiveNotifications(prev => prev.map(n => (n.notificationId === item.id || n.id === item.id || n.notificationId === item.notificationId) ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async (e) => {
    if (e) e.stopPropagation();
    setReadIds(new Set(processedList.map(n => n.id)));
    const unreadItems = liveNotifications.filter(n => !n.isRead);
    setLiveNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    for (const item of unreadItems) {
      const idToMark = item.notificationId || (item.id && !item.id.toString().startsWith("sys-") && !item.id.toString().startsWith("notif") ? item.id : null);
      if (idToMark) {
        try {
          await apiClient.put(`/api/Notification/${idToMark}/read`);
        } catch (err) {
          console.error("Failed to mark read:", err);
        }
      }
    }
    if (onMarkAllAsRead) onMarkAllAsRead();
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(event.target)
      ) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    logout();
    navigate("/");
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  // Get initials for avatar (fallback to User if no name)
  const displayName = currentUser?.fullName || "User";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const userRoleDisplay = (() => {
    const r = String(currentUser?.role || "").toLowerCase().replace(/[-_]/g, " ").trim();
    if (r === "human agent" || r === "agent" || r === "human" || r.includes("human agent")) return "Human Agent";
    return currentUser?.role || "Workspace Owner";
  })();

  return (
    <>
      <header className="topbar">
        <div className="topbar-left">
          <h2 className="topbar-title">{pageTitle}</h2>
          {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
        </div>

        {children && <div className="topbar-center-actions">{children}</div>}

        <div className="topbar-right">
          {/* Notification Bell */}
          <div className="notification-container" ref={notificationRef}>
            <button
              className="notification-bell-btn"
              onClick={handleToggleNotifications}
            >
              <Bell size={20} color="#1e293b" />
              {unreadCount > 0 && (
                <span className="notification-badge">{unreadCount}</span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="notification-dropdown-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h3>Notifications</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
                      {unreadCount} unread
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#3b82f6",
                          fontSize: "0.75rem",
                          cursor: "pointer",
                          fontWeight: 600,
                          padding: 0
                        }}
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                </div>
                <div className="notification-dropdown-body">
                  {processedList.map((alert) => (
                    <div
                      key={alert.id}
                      onClick={() => handleMarkItemRead(alert)}
                      className={`nav-alert-card type-${alert.normalizedType} ${alert.isRead ? "read-card" : ""}`}
                      style={{ cursor: "pointer", opacity: alert.isRead ? 0.75 : 1 }}
                    >
                      <div className="nav-alert-icon">
                        {alert.normalizedType === "info" && <Info size={16} />}
                        {(alert.normalizedType === "alert" || alert.normalizedType === "warning") && <AlertTriangle size={16} />}
                        {alert.normalizedType === "success" && <CheckCircle2 size={16} />}
                      </div>
                      <div className="nav-alert-content" style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                          <span className={`priority-tag tag-${alert.normalizedType}`}>
                            {alert.badgeLabel}
                          </span>
                        </div>
                        <h4 className="nav-alert-title">{alert.title}</h4>
                        <p className="nav-alert-desc">{alert.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>


          <div className="user-profile">
            <div className="user-info">
              <span className="user-name">{displayName}</span>
              <span className="user-role">{userRoleDisplay}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogoutClick}>
            Log out
          </button>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Sign Out</h3>
            <p>Are you sure you want to log out of your account?</p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={cancelLogout}>
                Cancel
              </button>
              <button className="modal-confirm-btn" onClick={confirmLogout}>
                Yes, log out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Topbar;
