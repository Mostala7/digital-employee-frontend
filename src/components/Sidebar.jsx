import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  PieChart,
  BotMessageSquare,
  ScrollText,
  TicketPercent,
  Settings,
  ChevronLeft,
  ChevronRight,
  Users,
  Bot,
} from "lucide-react";
import "./Sidebar.css";
import logoImg from "../assets/logo.png";

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(true);
  const location = useLocation();

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
    { icon: TicketPercent, label: "Tickets", path: "/tickets" },
    { icon: ScrollText, label: "Logs", path: "/logs" },
    { icon: Users, label: "Customers", path: "/customers" },
    { icon: Bot, label: "Agent", path: "/agent" },
    { icon: Settings, label: "Settings", path: "/settings" },
  ];

  return (
    <>
      {/* Define the gradient for the lucide icons */}
      <svg width="0" height="0" className="icon-gradient-defs">
        <defs>
          <linearGradient id="icon-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0880d8" />
            <stop offset="100%" stopColor="#660399" />
          </linearGradient>
        </defs>
      </svg>

      <aside className={`sidebar ${isExpanded ? "expanded" : "collapsed"}`}>
        {/* Toggle Button */}
        <button className="toggle-collapse-btn" onClick={toggleSidebar}>
          {isExpanded ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
        </button>

        {/* Logo Section */}
        <div className="sidebar-logo-container">
          <div className="logo-icon">
            <img src={logoImg} alt="IRIS Logo" className="custom-ai-logo" />
          </div>
          {isExpanded && <span className="logo-text">IRIS</span>}
        </div>

        {/* Navigation Area */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navItems.map((item) => {
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <li key={item.path} className="nav-item">
                  <Link
                    to={
                      item.path === "/pricing" || item.path === "/logs" || item.path === "/customers" || item.path === "/tickets" || item.path === "/settings" || item.path === "/reports" || item.path === "/agent"
                        ? item.path
                        : "/dashboard"
                    } // mock links for now except completed pages
                    className={`nav-link ${isActive ? "active" : ""}`}
                  >
                    <div className="nav-icon-container">
                      <Icon size={22} stroke="url(#icon-grad)" />
                    </div>
                    {isExpanded && (
                      <span className="nav-label">{item.label}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
