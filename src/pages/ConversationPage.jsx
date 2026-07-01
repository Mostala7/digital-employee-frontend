import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import {
  ArrowLeft, User, Bot, Headset,
  Download, ShoppingBag, AlertCircle,
  MessageSquare, Phone, ExternalLink, Send
} from "lucide-react";
import "./ConversationPage.css";
import apiClient from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";

// Mocks removed since data is now fetched from the live backend API

const formatDuration = (s, e) => {
  if (!s || !e) return "—";
  return `${Math.round((new Date(e) - new Date(s)) / 60000)} min`;
};

const calcTotal = (items) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);

const ConversationPage = () => {
  const { id }         = useParams();
  const location       = useLocation();
  const navigate       = useNavigate();
  const chatScrollRef  = useRef(null);
  const { currentUser } = useAuth();

  const [loading, setLoading]         = useState(true);
  const [interaction, setInteraction] = useState(null);
  const [messages, setMessages]       = useState([]);
  const [replyText, setReplyText]     = useState("");
  const [sendingReply, setSendingReply] = useState(false);


  useEffect(() => {
    const fetchInteractionData = async () => {
      setLoading(true);
      try {
        const decodedId = decodeURIComponent(id);
        
        // Fetch interaction details
        const intRes = await apiClient.get(`/api/Interaction/${decodedId}`);
        const intData = intRes.data;

        // Fetch messages
        const msgRes = await apiClient.get(`/api/Message/interaction/${decodedId}`).catch(() => ({ data: [] }));
        const msgData = msgRes.data || [];

        // Fetch Customer History
        let fetchedHistory = [];
        const actualCustomerId = intData.customerId || intData.CustomerId;
        let fetchedCustomerPhone = "UNKNOWN";
        if (actualCustomerId) {
          const histRes = await apiClient.get(`/api/Interaction/customer/${actualCustomerId}`).catch(() => ({ data: [] }));
          fetchedHistory = histRes.data || []; // Show ALL interactions for this customer
          
          const custRes = await apiClient.get(`/api/Customer/${actualCustomerId}`).catch(() => ({ data: {} }));
          if (custRes.data) {
             fetchedCustomerPhone = custRes.data.phone || custRes.data.Phone || "UNKNOWN";
          }
        }

        // Fetch Related Ticket
        let fetchedTicket = null;
        const actualBusinessId = intData.businessId || intData.BusinessId;
        if (actualBusinessId) {
          const tktRes = await apiClient.get(`/api/Ticket/business/${actualBusinessId}`).catch(() => ({ data: [] }));
          const allTickets = tktRes.data || [];
          fetchedTicket = allTickets.find(t => 
            (t.interactionId || t.InteractionId) === decodedId || 
            (t.interactionId || t.InteractionId) === (intData.interactionId || intData.InteractionId || intData.id || intData.Id) ||
            (t.customerId || t.CustomerId) === actualCustomerId
          );
        }

        // Map Interaction data
        setInteraction({
          ...intData,
          interactionId: intData.interactionId || intData.id || decodedId,
          customerName: intData.customerName || "Unknown",
          customerId: intData.customerId || "UNKNOWN",
          customerPhone: fetchedCustomerPhone,
          channel: intData.channel || "WebChat",
          resolutionStatus: intData.status || "Open",
          notes: intData.notes || "",
          startedAt: intData.startedAt || new Date().toISOString(),
          endedAt: intData.endedAt || null,
          history: fetchedHistory.map(h => ({
            id: h.interactionId || h.id,
            customerName: h.customerName || "Unknown",
            customerId: h.customerId,
            channel: h.channel || "WebChat",
            assignedUser: h.handledByAgentName || null,
            status: h.status || "Open",
            notes: h.notes || "—",
            feedbackRating: h.feedback?.rating || null,
            sentimentScore: h.sentimentScore || (h.sentimentTag === "Angry" ? 2 : 8),
            sentimentTag: h.sentimentTag || "Neutral"
          })),
          relatedTicket: fetchedTicket ? {
            ticketId: fetchedTicket.ticketId || fetchedTicket.id,
            subject: fetchedTicket.subject,
            priority: fetchedTicket.priorityLevel || fetchedTicket.priority || "Normal",
            status: fetchedTicket.status || "Open",
            assignedTo: fetchedTicket.assignedToUserName || fetchedTicket.assignedToUserId || "Unassigned",
            createdAt: fetchedTicket.createdAt
          } : null,
        });

        // Map Messages data
        const mappedMessages = msgData.map(m => ({
          messageId: m.messageId || m.id,
          senderType: m.senderType || "Unknown",
          content: m.content || "",
          sentAt: m.sentAt ? new Date(m.sentAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—",
        }));
        
        setMessages(mappedMessages);
      } catch (error) {
        console.error("Failed to load conversation:", error);
        setInteraction(null);
      } finally {
        setLoading(false);
      }
    };
    
    fetchInteractionData();
  }, [id]);

  useEffect(() => {
    if (!loading && chatScrollRef.current) {
      chatScrollRef.current.scrollTo({
        top: chatScrollRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, [loading, messages]);

  const handleDownload = () => {
    if (!interaction || !messages.length) return;
    const lines = [
      `Conversation Transcript — ${interaction.interactionId}`,
      `Customer: ${interaction.customerName} (${interaction.customerId})`,
      `Channel: ${interaction.channel}  |  Status: ${interaction.resolutionStatus}`,
      `Date: ${new Date(interaction.startedAt).toLocaleString("en-GB")}`,
      "─".repeat(60),
      "",
      ...messages.map(m =>
        `[${m.sentAt}] ${m.senderType === "AI" ? "AI Assistant" : m.senderType === "Agent" ? "Human Agent" : interaction.customerName}: ${m.content}`
      ),
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `conversation_${id}.txt`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || sendingReply) return;

    setSendingReply(true);
    const content = replyText.trim();
    const humanName = currentUser?.fullName || currentUser?.name || "Human Agent";

    const newMsg = {
      messageId: "msg_reply_" + Date.now(),
      interactionId: interaction?.interactionId || id,
      senderType: "Agent",
      content: content,
      sentAt: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    };

    // Optimistically append the message to the transcript
    setMessages(prev => [...prev, newMsg]);
    setReplyText("");

    // Instantly switch routing type to human agent
    setInteraction(prev => prev ? ({
      ...prev,
      assignedUserName: humanName
    }) : prev);

    try {
      await apiClient.post("/api/Message", {
        interactionId: interaction?.interactionId || id,
        senderType: "Agent",
        content: content,
        userId: currentUser?.id || null
      });
    } catch (err) {
      console.error("Failed to post message to backend:", err);
    } finally {
      setSendingReply(false);
    }
  };

  const sentimentClass = (tag) =>
    tag === "Satisfied" ? "tag-satisfied" : tag === "Angry" ? "tag-angry" : "tag-neutral";

  const priorityClass = (p) => {
    const val = (p || "Normal").toLowerCase();
    if (val === "critical" || val === "high" || val === "urgent") return "tag-status-escalated";
    if (val === "low") return "tag-satisfied";
    return "tag-ai"; // Normal/Medium uses blue
  };

  const bubbleClass = (t) =>
    t === "Customer" ? "bubble bubble-customer"
    : t === "Agent"  ? "bubble bubble-agent"
    : "bubble bubble-ai";

  const senderIcon = (t) =>
    t === "Customer" ? <User size={13} />
    : t === "Agent"  ? <Headset size={13} />
    : <Bot size={13} />;

  const displayName = location.state?.customerName || interaction?.customerName || "—";
  const history     = interaction?.history || [];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-area" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>

        <Topbar pageTitle="Conversation Detail" subtitle={`Viewing interaction thread for ${displayName}`}>
          <div style={{ display: "flex", gap: "0.5rem" }}>

            <button className="log-view-btn" onClick={handleDownload}>
              <Download size={13} /> Download
            </button>
            <button className="log-view-btn" onClick={() => navigate("/logs")}>
              <ArrowLeft size={13} /> Back to Logs
            </button>
          </div>
        </Topbar>

        <main className="dashboard-content-wrapper conversation-wrapper">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gridColumn: '1 / -1' }}>
              <Loader text="Loading conversation..." />
            </div>
          ) : !interaction ? (
            <div className="chart-card" style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
              <p>Conversation not found or was deleted.</p>
              <button className="log-view-btn" style={{ marginTop: "1rem" }} onClick={() => navigate("/logs")}>Back to Logs</button>
            </div>
          ) : (
            <div className="conversation-grid">

              {/* ── CELL 1 · Interaction Details ── */}
              <aside className="conv-meta-panel chart-card">
                <h3 className="chart-title" style={{ fontSize: "0.95rem", marginBottom: "1.25rem" }}>Interaction Details</h3>

                <div className="meta-row">
                  <span className="meta-label">Customer</span>
                  <span className="meta-value">{interaction.customerName}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Phone</span>
                  <span className="meta-value meta-muted">{interaction.customerPhone}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Channel</span>
                  <span className="log-tag tag-channel">{interaction.channel}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Routing</span>
                  {interaction.assignedUserName
                    ? <span className="log-tag tag-human">{interaction.assignedUserName}</span>
                    : <span className="log-tag tag-ai">AI Assistant</span>}
                </div>
                <div className="meta-row">
                  <span className="meta-label">Status</span>
                  <span className={`log-tag tag-status-${interaction.resolutionStatus.toLowerCase()}`}>
                    {interaction.resolutionStatus}
                  </span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Duration</span>
                  <span className="meta-value">{formatDuration(interaction.startedAt, interaction.endedAt)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">Started</span>
                  <span className="meta-value meta-muted">
                    {new Date(interaction.startedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>

                <div className="meta-divider" />

                {/* CSAT & Sentiment — same layout as Logs table */}
                <div className="meta-row">
                  <span className="meta-label">CSAT &amp; Sentiment</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" }}>
                    <span className={`log-tag ${sentimentClass(interaction.sentimentTag)}`}>
                      {interaction.sentimentTag}
                    </span>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>
                        {interaction.sentimentScore}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>/10</span>
                      {interaction.feedback?.rating
                        ? <span style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: "6px" }}>
                            · CSAT {interaction.feedback.rating}/10
                          </span>
                        : <span style={{ fontSize: "0.72rem", color: "#cbd5e1", marginLeft: "6px" }}>
                            · No rating
                          </span>
                      }
                    </div>
                  </div>
                </div>

                {interaction.notes && (
                  <>
                    <div className="meta-divider" />
                    <div className="meta-comment">
                      <span className="meta-label" style={{ display: "block", marginBottom: "0.4rem" }}>Agent Notes</span>
                      <p>{interaction.notes}</p>
                    </div>
                  </>
                )}
              </aside>

              {/* ── CELL 2 · Chat Transcript ── */}
              <div className="conv-chat-panel chart-card">
                <div className="chat-panel-inner">
                  <h3 className="chart-title" style={{ fontSize: "0.95rem", marginBottom: "1.25rem" }}>
                    Chat Transcript
                    <span style={{ fontWeight: 500, fontSize: "0.78rem", color: "#94a3b8", marginLeft: "8px" }}>
                      {messages.length} messages
                    </span>
                  </h3>
                  <div className="chat-scroll-area" ref={chatScrollRef}>
                    {messages.map(msg => (
                      <div key={msg.messageId} className={`bubble-row ${msg.senderType === "Customer" ? "row-customer" : "row-ai"}`}>
                        <div className={bubbleClass(msg.senderType)}>
                          <div className="bubble-sender">
                             {senderIcon(msg.senderType)}
                             <span>
                               {msg.senderType === "AI" ? "AI Assistant"
                                 : msg.senderType === "Agent" ? "Human Agent"
                                 : interaction.customerName}
                             </span>
                          </div>
                          <p className="bubble-text">{msg.content}</p>
                          <span className="bubble-time">{msg.sentAt}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Human Agent Reply Box */}
                  <form onSubmit={handleSendReply} className="conv-chat-input-form">
                    <input
                      type="text"
                      className="conv-chat-input"
                      placeholder="Type a reply to take over as human agent..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      disabled={sendingReply}
                    />
                    <button
                      type="submit"
                      className="conv-chat-send-btn"
                      disabled={!replyText.trim() || sendingReply}
                    >
                      <Send size={15} />
                      {sendingReply ? "..." : "Send"}
                    </button>
                  </form>
                </div>
              </div>

              {/* ── CELL 3 · Order Summary + Ticket ── */}
              <div className="conv-order-card chart-card">
                {/* Order Section */}
                <h3 className="chart-title" style={{ fontSize: "0.9rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <ShoppingBag size={15} /> Order Summary
                  {interaction.relatedOrder && (
                    <span
                      className={`log-tag ${interaction.relatedOrder.status === "Delivered" ? "tag-status-resolved" : "tag-status-active"}`}
                      style={{ marginLeft: "auto", fontSize: "0.7rem" }}
                    >
                      {interaction.relatedOrder.status}
                    </span>
                  )}
                </h3>
                
                {interaction.relatedOrder ? (
                  <>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.75rem" }}>
                      {interaction.relatedOrder.orderId}
                    </p>
                    <div className="order-items-list">
                      {interaction.relatedOrder.items.map((item, i) => (
                        <div key={i} className="order-item-row">
                          <span className="order-item-name">{item.qty}× {item.name}</span>
                          <span className="order-item-price">${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-total-row">
                      <span>Total</span>
                      <span>${calcTotal(interaction.relatedOrder.items)}</span>
                    </div>
                  </>
                ) : (
                  <div className="empty-state-panel">
                    <ShoppingBag size={20} className="empty-state-icon" />
                    <span className="empty-state-text">No order placed</span>
                  </div>
                )}

                <div className="meta-divider" style={{ margin: "1.25rem 0" }} />

                {/* Ticket Section */}
                <h3 className="chart-title" style={{ fontSize: "0.9rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertCircle size={15} /> Support Ticket
                  {interaction.relatedTicket && (
                    <span className="log-tag tag-status-escalated" style={{ marginLeft: "auto", fontSize: "0.7rem" }}>
                      {interaction.relatedTicket.status}
                    </span>
                  )}
                </h3>

                {interaction.relatedTicket ? (
                  <>
                    <p style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.4rem" }}>
                      {interaction.relatedTicket.ticketId}
                    </p>
                    <p style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.875rem", marginBottom: "0.75rem" }}>
                      {interaction.relatedTicket.subject}
                    </p>
                    <div className="meta-row" style={{ paddingTop: 0 }}>
                      <span className="meta-label">Priority</span>
                      <span className={`log-tag ${priorityClass(interaction.relatedTicket.priority)}`} style={{ fontSize: "0.7rem" }}>
                        {interaction.relatedTicket.priority}
                      </span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Assigned To</span>
                      <span className="meta-value">{interaction.relatedTicket.assignedTo}</span>
                    </div>
                    <div className="meta-row">
                      <span className="meta-label">Opened</span>
                      <span className="meta-value meta-muted">
                        {new Date(interaction.relatedTicket.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="empty-state-panel">
                    <AlertCircle size={20} className="empty-state-icon" />
                    <span className="empty-state-text">No support ticket linked</span>
                  </div>
                )}
              </div>

              {/* ── CELL 4 · Customer History (same table as LogsPage) ── */}
              <div className="conv-history-card chart-card">
                <h3 className="chart-title" style={{ fontSize: "0.9rem", marginBottom: "1.25rem" }}>
                  Customer History
                  <span style={{ fontWeight: 500, fontSize: "0.78rem", color: "#94a3b8", marginLeft: "8px" }}>
                    {history.length} previous conversations
                  </span>
                </h3>

                {history.length === 0 ? (
                  <div className="empty-state-panel empty-state-lg">
                    <MessageSquare size={28} className="empty-state-icon" style={{ marginBottom: "0.5rem" }} />
                    <span className="empty-state-text" style={{ fontSize: "0.95rem" }}>No previous conversations</span>
                    <span style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>This is the customer's first interaction.</span>
                  </div>
                ) : (
                  <div className="table-responsive">
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
                        {history.map(log => (
                          <tr key={log.id}>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.875rem" }}>{log.customerName}</span>
                                <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{log.customerId}</span>
                              </div>
                            </td>
                            <td>
                              <span className="log-tag tag-channel" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                {log.channel === "Calls" ? <Phone size={11} /> : <MessageSquare size={11} />}
                                {log.channel}
                              </span>
                            </td>
                            <td>
                              {log.assignedUser
                                ? <span className="log-tag tag-human">{log.assignedUser}</span>
                                : <span className="log-tag tag-ai">AI Assistant</span>}
                            </td>
                            <td>
                              <span className={`log-tag tag-status-${log.status.toLowerCase()}`}>{log.status}</span>
                            </td>
                            <td style={{ maxWidth: "200px" }}>
                              <span style={{ color: "#475569", fontSize: "0.83rem", lineHeight: "1.4", display: "inline-block" }}>
                                {log.notes || "—"}
                              </span>
                            </td>
                            <td>
                              <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-start" }}>
                                <span className={`log-tag ${sentimentClass(log.sentimentTag)}`}>{log.sentimentTag}</span>
                                <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                                  <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>{log.sentimentScore}</span>
                                  <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>/10</span>
                                  {log.feedbackRating
                                    ? <span style={{ fontSize: "0.72rem", color: "#64748b", marginLeft: "6px" }}>· CSAT {log.feedbackRating}/10</span>
                                    : <span style={{ fontSize: "0.72rem", color: "#cbd5e1", marginLeft: "6px" }}>· No rating</span>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <button 
                                className="log-view-btn" 
                                onClick={() => navigate(`/conversations/${log.id}`)}
                                disabled={log.id === interaction.interactionId}
                                style={{
                                  opacity: log.id === interaction.interactionId ? 0.5 : 1,
                                  cursor: log.id === interaction.interactionId ? "not-allowed" : "pointer"
                                }}
                              >
                                <ExternalLink size={13} /> {log.id === interaction.interactionId ? "Current Chat" : "View Chat"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default ConversationPage;
