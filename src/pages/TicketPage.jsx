import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import {
  ArrowLeft,
  User,
  AlertCircle,
  MessageSquare,
  CheckCircle2,
  ExternalLink,
  History,
  Phone,
  Save,
} from "lucide-react";
import "./ConversationPage.css"; // Reuse meta-rows
import "./TicketsPage.css"; // Reuse tag-priority- styles
import "./TicketPage.css";
import { MOCK_CUSTOMER_HISTORY } from "../services/mockTicketDB";
import apiClient from "../api/apiClient";

const TicketPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState(null);
  const [noteContent, setNoteContent] = useState("");
  const [ticketStatus, setTicketStatus] = useState("Open");
  const [showToast, setShowToast] = useState(false);
  const [isEditingNote, setIsEditingNote] = useState(false);

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const decodedId = decodeURIComponent(id);
        const response = await apiClient.get('/api/Ticket/' + decodedId);
        
        // Use backend data, fallback to dummy customer if mapping fails
        const data = response.data;
        const mappedData = {
          ...data,
          ticketId: data.ticketId || data.id || decodedId,
          status: data.status || "Open",
          priority: data.priorityLevel || data.priority || "Medium",
          resolutionNotes: data.resolutionNotes || data.escalationReason || data.description || "",
          assignedTo: data.assignedToUserName || "Unassigned",
        };
        
        setTicket(mappedData);
        setTicketStatus(mappedData.status);
        setNoteContent(mappedData.resolutionNotes);
      } catch (error) {
        console.error("Failed to fetch ticket:", error);
        setTicket(null);
      } finally {
        setLoading(false);
      }
    };
    fetchTicket();
  }, [id]);

  const handleSaveResolution = async () => {
    if (!ticket) return;
    
    try {
      const idToUse = ticket.id || ticket.ticketId;
      
      await apiClient.put(`/api/Ticket/${idToUse}`, {
        status: ticketStatus || "Open",
        subject: ticket.subject || "Updated Ticket",
        resolutionNotes: noteContent || ""
      });
      
      let newAssignedTo = ticket.assignedTo;

      // Assign the ticket to the current user only if unassigned and not being closed
      if (currentUser && ticket.assignedTo === "Unassigned" && ticketStatus !== "Closed") {
         try {
            await apiClient.post(`/api/Ticket/${idToUse}/assign`, {
               ticketId: idToUse,
               userId: currentUser.id || currentUser.userId
            });
            newAssignedTo = currentUser.fullName || currentUser.name || "Owner";
         } catch (e) {
            console.log("Assignment silently failed or already assigned", e.response?.data);
         }
      }
      
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // Persist to UI locally
      const updated = {
        ...ticket,
        status: ticketStatus,
        resolutionNotes: noteContent,
        assignedTo: newAssignedTo,
        updatedAt: new Date().toISOString(),
      };
      
      setTicket(updated);
      setNoteContent(noteContent);
      setIsEditingNote(false);
    } catch (error) {
      console.error("Failed to save ticket:", error);
      if (error.response && error.response.data) {
        console.error("Backend Error Details:", JSON.stringify(error.response.data, null, 2));
      }
      alert("Failed to save changes. Check console for details.");
    }
  };

  const history = ticket ? MOCK_CUSTOMER_HISTORY[ticket.customerId] || [] : [];

  return (
    <div className="app-layout">
      <Sidebar />
      <div
        className="main-content-area"
        style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}
      >
        <Topbar
          pageTitle="Ticket Overview"
          subtitle={ticket ? `Viewing ticket ${ticket.ticketId}` : "Loading..."}
        >
          <button className="log-view-btn" onClick={() => navigate("/tickets")}>
            <ArrowLeft size={13} /> Back to Tickets
          </button>
        </Topbar>

        <main className="dashboard-content-wrapper ticket-wrapper">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
              <Loader text="Loading ticket details..." />
            </div>
          ) : !ticket ? (
            <div
              className="chart-card"
              style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}
            >
              <p>Ticket not found.</p>
              <button
                className="log-view-btn"
                style={{ marginTop: "1rem" }}
                onClick={() => navigate("/tickets")}
              >
                Back to Tickets
              </button>
            </div>
          ) : (
            <div className="ticket-grid">
              {/* ── QUADRANT 1: Ticket Details ── */}
              <div
                className="chart-card ticket-info-panel"
                style={{ padding: "1.5rem" }}
              >
                <h3
                  className="chart-title"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "1rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <AlertCircle size={18} color="#475569" /> Ticket Information
                  <span
                    className={`log-tag tag-status-${ticket.status.replace(" ", "-").toLowerCase()}`}
                    style={{ marginLeft: "auto" }}
                  >
                    {ticket.status}
                  </span>
                </h3>

                <div className="meta-row">
                  <span className="meta-label">Subject</span>
                  <span
                    className="meta-value"
                    style={{ fontWeight: 600, color: "#1e293b" }}
                  >
                    {ticket.subject}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Priority</span>
                  <span
                    className={`log-tag tag-priority-${ticket.priority.toLowerCase()}`}
                  >
                    {ticket.priority}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Type</span>
                  <span className="log-tag tag-channel">{ticket.type}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Assigned To</span>
                  <span className="meta-value">{ticket.assignedTo}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Opened At</span>
                  <span className="meta-value meta-muted">
                    {new Date(ticket.createdAt).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Last Updated</span>
                  <span className="meta-value meta-muted">
                    {new Date(ticket.updatedAt || ticket.closedAt || ticket.createdAt).toLocaleString("en-GB", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </span>
                </div>

                <div className="meta-divider" style={{ margin: "1rem 0" }} />

                <div style={{ flexGrow: 1 }}>
                  <span className="meta-label" style={{ display: "block" }}>
                    Full Description
                  </span>
                  <div className="ticket-description-box">
                    {ticket.description || "No description provided."}
                  </div>
                </div>
              </div>

              {/* ── QUADRANT 2: Customer Context ── */}
              <div className="chart-card" style={{ padding: "1.5rem" }}>
                <h3
                  className="chart-title"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "1rem",
                    marginBottom: "1.25rem",
                  }}
                >
                  <User size={18} color="#475569" /> Customer Overview
                </h3>

                <div className="meta-row">
                  <span className="meta-label">Customer Name</span>
                  <span className="meta-value" style={{ fontWeight: 500 }}>
                    {ticket.customerName}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Customer ID</span>
                  <span className="meta-value meta-muted">
                    {ticket.customerId}
                  </span>
                </div>

                <div
                  className="meta-divider"
                  style={{ margin: "1.5rem 0 1rem" }}
                />

                <h4
                  style={{
                    fontSize: "0.85rem",
                    color: "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Previous Interactions ({history.length})
                </h4>

                {history.length > 0 ? (
                  <div className="ticket-history-list">
                    {history.map((item, idx) => (
                      <div className="ticket-history-item" key={idx}>
                        <div className="ticket-history-title">
                          <span
                            style={{
                              fontSize: "0.8rem",
                              fontWeight: 600,
                              color: "#1e293b",
                            }}
                          >
                            {item.date}
                          </span>
                          <span
                            className={`log-tag tag-status-${item.status.toLowerCase()}`}
                            style={{
                              fontSize: "0.65rem",
                              padding: "0.1rem 0.4rem",
                            }}
                          >
                            {item.status}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            fontSize: "0.75rem",
                            color: "#64748b",
                            margin: "4px 0",
                          }}
                        >
                          {item.channel === "Calls" ? (
                            <Phone size={10} />
                          ) : (
                            <MessageSquare size={10} />
                          )}
                          <span>{item.channel}</span>
                        </div>
                        <p
                          style={{
                            fontSize: "0.8rem",
                            color: "#475569",
                            margin: "4px 0 0 0",
                          }}
                        >
                          {item.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "#94a3b8",
                      margin: "1rem 0",
                    }}
                  >
                    No previous conversation history found.
                  </p>
                )}
              </div>

              {/* ── QUADRANT 3: Resolution Panel ── */}
              <div
                className="chart-card"
                style={{ padding: "1.5rem", gridColumn: "1 / -1" }}
              >
                <div
                  style={{
                    display: "flex",
                    gap: "1.5rem",
                    flexWrap: "wrap",
                    alignItems: "stretch",
                  }}
                >
                  {/* Left: Resolution Notes */}
                  <div style={{ flex: "2 1 400px" }}>
                    <h3
                      className="chart-title"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "1rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <CheckCircle2 size={18} color="#475569" /> Internal
                      Resolution Notes
                    </h3>
                    
                    {(!isEditingNote && ticketStatus === ticket.status && ticket.status === "Closed") ? (
                      <div className="resolution-readonly-box" style={{ 
                        backgroundColor: "#f8fafc", 
                        borderRadius: "8px", 
                        border: "1px solid #cbd5e1", 
                        minHeight: "120px", 
                        padding: "0",
                        marginBottom: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        overflow: "hidden"
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#f1f5f9", padding: "0.5rem 1rem", borderBottom: "1px solid #cbd5e1" }}>
                          <span style={{ fontSize: "0.75rem", color: "#475569", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                            Resolution Note
                          </span>
                          <button 
                            style={{ display: "flex", alignItems: "center", gap: "4px", color: "#3b82f6", background: "none", border: "none", cursor: "pointer", fontWeight: 600, fontSize: "0.8rem", padding: "4px 8px", borderRadius: "4px" }}
                            onClick={() => setIsEditingNote(true)}
                            onMouseOver={(e) => { e.currentTarget.style.backgroundColor = "#e0f2fe"; }}
                            onMouseOut={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}
                          >
                            ✎ Edit
                          </button>
                        </div>
                        <div style={{ padding: "1rem", fontSize: "0.875rem", color: "#1e293b", lineHeight: 1.6, whiteSpace: "pre-wrap", flex: 1 }}>
                          {noteContent || ticket.resolutionNotes || <span style={{ color: "#94a3b8", fontStyle: "italic" }}>No resolution details have been provided yet.</span>}
                        </div>
                      </div>
                    ) : (
                      <textarea
                        className="resolution-textarea"
                        placeholder="Add investigation details, resolution summary, or reasons for escalation..."
                        value={noteContent}
                        onChange={(e) => setNoteContent(e.target.value)}
                      />
                    )}


                    <div className="resolution-actions" style={{ 
                      width: '100%', 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: '1.25rem',
                      backgroundColor: 'transparent',
                      marginTop: '0.5rem',
                    }}>
                      
                      {/* Full-width Toggle Mechanism */}
                      <div style={{ display: 'flex', width: '100%', backgroundColor: '#f1f5f9', borderRadius: '8px', padding: '4px', border: '1px solid #e2e8f0' }}>
                        {["Open", "InProgress", "Closed"].map((status) => {
                          const isOriginal = ticket.status === status;
                          const isActive = ticketStatus === status;
                          return (
                            <button
                              key={status}
                              onClick={() => setTicketStatus(status)}
                              style={{
                                flex: 1,
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '0.65rem 0',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: isActive ? 'white' : 'transparent',
                                color: isActive ? '#1d4ed8' : '#64748b',
                                fontWeight: 600,
                                fontSize: '0.875rem',
                                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                              }}
                            >
                              {status}
                              {isOriginal && (
                                <span style={{ 
                                  fontSize: '0.65rem', 
                                  color: isActive ? '#3b82f6' : '#94a3b8', 
                                  backgroundColor: isActive ? '#eff6ff' : '#e2e8f0', 
                                  padding: '2px 6px', 
                                  borderRadius: '4px',
                                  fontWeight: 700 
                                }}>
                                  Current
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        className="save-resolution-btn"
                        onClick={handleSaveResolution}
                        style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontSize: '0.9rem' }}
                      >
                        <Save size={16} /> Save & Update Ticket
                      </button>
                    </div>
                  </div>

                  {/* Right: Source Conversation */}
                  <div
                    style={{
                      flex: "1 1 300px",
                      borderLeft: "1px solid #e2e8f0",
                      paddingLeft: "1.5rem",
                    }}
                  >
                    <h3
                      className="chart-title"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        fontSize: "1rem",
                        marginBottom: "1rem",
                      }}
                    >
                      <History size={18} color="#475569" /> Source Interaction
                    </h3>

                    <div
                      style={{
                        backgroundColor: "#f8fafc",
                        padding: "1rem",
                        borderRadius: "6px",
                        border: "1px dashed #cbd5e1",
                        display: "flex",
                        flexDirection: "column",
                        height: "calc(100% - 2.5rem)",
                        justifyContent: "space-between",
                      }}
                    >
                      <div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            fontWeight: 600,
                          }}
                        >
                          Conversation ID
                        </span>
                        <p
                          style={{
                            margin: "4px 0 12px 0",
                            fontSize: "0.875rem",
                            fontFamily: "monospace",
                            color: "#1e293b",
                          }}
                        >
                          {ticket.interactionId || "None Linked"}
                        </p>

                        <span
                          style={{
                            fontSize: "0.75rem",
                            color: "#64748b",
                            textTransform: "uppercase",
                            fontWeight: 600,
                          }}
                        >
                          Summary
                        </span>
                        <p
                          style={{
                            margin: "4px 0 0 0",
                            fontSize: "0.875rem",
                            color: "#475569",
                            lineHeight: 1.5,
                          }}
                        >
                          "{ticket.interactionNotes}"
                        </p>
                      </div>

                      <button
                        className="log-view-btn"
                        style={{
                          marginTop: "1rem",
                          width: "100%",
                          justifyContent: "center",
                          padding: "0.5rem",
                          opacity: ticket.interactionId ? 1 : 0.5,
                          cursor: ticket.interactionId ? "pointer" : "not-allowed"
                        }}
                        disabled={!ticket.interactionId}
                        onClick={() =>
                          navigate(
                            `/conversations/${ticket.interactionId}`,
                          )
                        }
                      >
                        <ExternalLink size={14} /> Move To The Conversation
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {showToast && (
          <div className="toast-success">
            <CheckCircle2 color="white" size={20} />
            <span>Ticket successfully updated!</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TicketPage;
