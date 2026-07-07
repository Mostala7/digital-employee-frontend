import { useState, useEffect, useRef } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import {
  ArrowLeft, User, Bot, Headset,
  Download, ShoppingBag, AlertCircle,
  MessageSquare, Phone, ExternalLink, Volume2,
  FileText, Globe, ShieldAlert, Eye, X
} from "lucide-react";
import apiClient from "../api/apiClient";
import "./ConversationPage.css";
import "./CallPage.css";

const formatDuration = (s, e, sec) => {
  if (sec !== undefined && sec !== null && !isNaN(sec)) {
    const mins = Math.floor(sec / 60);
    const secs = Math.round(sec % 60);
    return `${mins}m ${secs}s`;
  }
  if (!s || !e) return "—";
  return `${Math.round((new Date(e) - new Date(s)) / 60000)} min`;
};

const calcTotal = (items) =>
  items.reduce((sum, i) => sum + i.price * i.qty, 0).toFixed(2);

const CallPage = () => {
  const { id }         = useParams();
  const location       = useLocation();
  const navigate       = useNavigate();
  const scrollRef      = useRef(null);

  const [loading, setLoading]         = useState(true);
  const [summary, setSummary]         = useState(null);
  const [interaction, setInteraction] = useState(null);

  // Modal states for comfortable reading
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalTab, setModalTab]       = useState("en"); // "en" | "ar" | "transcript"

  useEffect(() => {
    const fetchCallData = async () => {
      setLoading(true);
      try {
        const decodedId = decodeURIComponent(id);

        // 1. Fetch CallSummary
        let sumData = null;
        try {
          const sumRes = await apiClient.get(`/api/CallSummary/${decodedId}`);
          sumData = sumRes.data;
          setSummary(sumData);
        } catch (err) {
          console.warn("CallSummary not found directly:", decodedId);
        }

        // 2. Fetch Interaction details
        let intData = null;
        try {
          const intRes = await apiClient.get(`/api/Interaction/${decodedId}`);
          intData = intRes.data;
        } catch (err) {
          if (!sumData) {
            setLoading(false);
            return;
          }
        }

        const actualCustomerId = sumData?.customerId || intData?.customerId || intData?.CustomerId;
        const actualBusinessId = sumData?.businessId || intData?.businessId || intData?.BusinessId;

        // 3. Fetch Customer History & Phone
        let fetchedHistory = [];
        let fetchedCustomerPhone = "UNKNOWN";
        if (actualCustomerId) {
          const histRes = await apiClient.get(`/api/Interaction/customer/${actualCustomerId}`).catch(() => ({ data: [] }));
          fetchedHistory = histRes.data || [];

          const custRes = await apiClient.get(`/api/Customer/${actualCustomerId}`).catch(() => ({ data: {} }));
          if (custRes.data) {
            fetchedCustomerPhone = custRes.data.phone || custRes.data.Phone || "UNKNOWN";
          }
        }

        // 4. Fetch Related Ticket
        let fetchedTicket = null;
        if (actualBusinessId) {
          const tktRes = await apiClient.get(`/api/Ticket/business/${actualBusinessId}`).catch(() => ({ data: [] }));
          const allTickets = tktRes.data || [];
          fetchedTicket = allTickets.find(t =>
            (t.interactionId || t.InteractionId) === decodedId ||
            (t.interactionId || t.InteractionId) === (intData?.interactionId || intData?.id || sumData?.interactionId)
          );
        }

        // 5. Fetch Related Order
        let fetchedOrder = null;
        try {
          let allOrders = [];
          if (actualBusinessId) {
            const ordRes = await apiClient.get(`/api/Order/business/${actualBusinessId}`).catch(() => ({ data: [] }));
            allOrders = ordRes.data || [];
          }
          if (allOrders.length === 0 && actualCustomerId) {
            const ordRes = await apiClient.get(`/api/Order/customer/${actualCustomerId}`).catch(() => ({ data: [] }));
            allOrders = ordRes.data || [];
          }
          fetchedOrder = allOrders.find(o => 
            (o.interactionId || o.InteractionId) === decodedId || 
            (o.interactionId || o.InteractionId) === (intData?.interactionId || intData?.id || sumData?.interactionId) ||
            String(o.customerId || o.CustomerId) === String(actualCustomerId)
          );
        } catch (e) {
          console.warn("Failed to fetch related order:", e);
        }

        setInteraction({
          ...(intData || {}),
          interactionId: intData?.interactionId || intData?.id || sumData?.interactionId || sumData?.callId || decodedId,
          customerName: intData?.customerName || intData?.customer?.name || "Voice Customer",
          customerId: actualCustomerId || "UNKNOWN",
          customerPhone: fetchedCustomerPhone,
          channel: intData?.channel || "Calls",
          assignedUserName: intData?.handledByUser?.fullName || intData?.handledByAgentName || null,
          resolutionStatus: intData?.status || "Completed",
          notes: intData?.notes || sumData?.escalationReason || "",
          startedAt: sumData?.startTime || intData?.startedAt || new Date().toISOString(),
          endedAt: sumData?.endTime || intData?.endedAt || null,
          sentimentScore: (sumData?.sentimentScore !== undefined && sumData?.sentimentScore !== null) ? sumData.sentimentScore : ((intData?.sentimentScore !== undefined && intData?.sentimentScore !== null) ? intData.sentimentScore : null),
          sentimentTag: ((sumData?.sentimentScore !== undefined && sumData?.sentimentScore !== null) || (intData?.sentimentScore !== undefined && intData?.sentimentScore !== null)) ? (sumData?.sentimentLabel || intData?.sentimentTag || intData?.sentiment || "Neutral") : "Unrated",
          history: fetchedHistory.map(h => ({
            id: h.interactionId || h.id,
            customerName: h.customerName || "Unknown",
            customerId: h.customerId,
            channel: h.channel || "Calls",
            assignedUser: h.handledByAgentName || h.handledByUser?.fullName || null,
            status: h.status || "Completed",
            notes: h.notes || "—",
            feedbackRating: h.feedback?.rating || null,
            sentimentScore: h.sentimentScore !== undefined && h.sentimentScore !== null ? h.sentimentScore : null,
            sentimentTag: h.sentimentScore !== undefined && h.sentimentScore !== null ? (h.sentimentTag || h.sentiment || "Neutral") : "Unrated"
          })),
          relatedTicket: fetchedTicket ? {
            ticketId: fetchedTicket.ticketNumber || `TKT-${fetchedTicket.ticketId || fetchedTicket.id}`,
            subject: fetchedTicket.title || fetchedTicket.subject || "Voice Support Ticket",
            priority: fetchedTicket.priority || "Normal",
            status: (fetchedTicket.status === "Escalated" || fetchedTicket.status === "escalated") ? "Open" : (fetchedTicket.status || "Open"),
            assignedTo: fetchedTicket.assignedAgentName || "Unassigned",
            createdAt: fetchedTicket.createdAt || new Date().toISOString()
          } : null,
          relatedOrder: intData?.relatedOrder || (fetchedOrder ? {
            orderId: fetchedOrder.orderId || fetchedOrder.id || "ORD-" + Math.floor(1000 + Math.random() * 9000),
            status: fetchedOrder.status || "Completed",
            items: fetchedOrder.items && fetchedOrder.items.length > 0 ? fetchedOrder.items.map(i => ({
              name: i.menuItemName || i.name || "Item",
              qty: i.quantity || i.qty || 1,
              price: Number(i.price || i.unitPrice || 0) || (Number(fetchedOrder.totalPrice || fetchedOrder.totalAmount || 0) / (i.quantity || 1))
            })) : [{ name: "Order Items", qty: 1, price: Number(fetchedOrder.totalPrice || fetchedOrder.totalAmount || 0) }]
          } : null),
        });
      } catch (error) {
        console.error("Failed to load call page data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCallData();
  }, [id]);

  const sentimentClass = (tag) =>
    tag === "Satisfied" ? "tag-satisfied" : tag === "Angry" ? "tag-angry" : "tag-neutral";

  const priorityClass = (p) => {
    const val = (p || "Normal").toLowerCase();
    if (val === "critical" || val === "high" || val === "urgent") return "tag-status-escalated";
    if (val === "low") return "tag-satisfied";
    return "tag-ai";
  };

  const getAudioSource = () => {
    if (!summary?.audioUrls) return null;
    const url = summary.audioUrls.stereo || summary.audioUrls.customer || summary.audioUrls.agent;
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = apiClient.defaults.baseURL || "https://graduationproject.fly.dev";
    return url.startsWith("/") ? `${baseUrl}${url}` : `${baseUrl}/${url}`;
  };

  const openReadingModal = (tab) => {
    setModalTab(tab);
    setModalOpen(true);
  };

  const audioSrc = getAudioSource();
  const displayName = location.state?.customerName || interaction?.customerName || "Voice Customer";
  const history     = interaction?.history || [];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-area" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>

        <Topbar pageTitle="Voice Call Detail" subtitle={`Viewing interaction thread for ${displayName}`}>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            {audioSrc && (
              <a
                href={audioSrc}
                download={`call_${interaction?.interactionId || id}.wav`}
                target="_blank"
                rel="noopener noreferrer"
                className="log-view-btn"
                style={{ textDecoration: "none" }}
              >
                <Download size={13} /> Download .wav
              </a>
            )}
            <button className="log-view-btn" onClick={() => navigate("/logs")}>
              <ArrowLeft size={13} /> Back to Logs
            </button>
          </div>
        </Topbar>

        <main className="dashboard-content-wrapper conversation-wrapper">
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', gridColumn: '1 / -1' }}>
              <Loader text="Loading call details..." />
            </div>
          ) : !interaction && !summary ? (
            <div className="chart-card" style={{ padding: "3rem", textAlign: "center", color: "#94a3b8" }}>
              <p>Call record not found or was deleted.</p>
              <button className="log-view-btn" style={{ marginTop: "1rem" }} onClick={() => navigate("/logs")}>Back to Logs</button>
            </div>
          ) : (
            <>
              {summary?.escalationRequired && (
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", padding: "0.85rem 1.25rem", borderRadius: "10px", fontWeight: 600, fontSize: "0.88rem", marginBottom: "1rem" }}>
                  <ShieldAlert size={20} />
                  <div><strong>Escalation Required:</strong> {summary.escalationReason || "Flagged during voice sentiment analysis."}</div>
                </div>
              )}

              <div className="conversation-grid">

                {/* ── CELL 1 · Interaction Details ── */}
                <aside className="conv-meta-panel chart-card">
                  <h3 className="chart-title" style={{ fontSize: "0.95rem", marginBottom: "1.25rem" }}>Interaction Details</h3>

                  <div className="meta-row">
                    <span className="meta-label">Customer</span>
                    <span className="meta-value">{interaction?.customerName || "Voice Customer"}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Phone</span>
                    <span className="meta-value meta-muted">{interaction?.customerPhone || "—"}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Channel</span>
                    <span className="log-tag tag-channel" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <Phone size={12} /> {interaction?.channel || "Calls"}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Routing</span>
                    {interaction?.assignedUserName
                      ? <span className="log-tag tag-human">{interaction.assignedUserName}</span>
                      : <span className="log-tag tag-ai">AI Assistant</span>}
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Status</span>
                    <span className={`log-tag tag-status-${(interaction?.resolutionStatus || "Completed").toLowerCase()}`}>
                      {interaction?.resolutionStatus || "Completed"}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Duration</span>
                    <span className="meta-value">{formatDuration(interaction?.startedAt, interaction?.endedAt, summary?.durationSeconds)}</span>
                  </div>
                  <div className="meta-row">
                    <span className="meta-label">Started</span>
                    <span className="meta-value meta-muted">
                      {interaction?.startedAt ? new Date(interaction.startedAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" }) : "—"}
                    </span>
                  </div>

                  <div className="meta-divider" />

                  <div className="meta-row">
                    <span className="meta-label">CSAT &amp; Sentiment</span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "5px", alignItems: "flex-end" }}>
                      <span className={`log-tag ${sentimentClass(interaction?.sentimentTag)}`}>
                        {interaction?.sentimentTag || "Unrated"}
                      </span>
                      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
                        <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>
                          {interaction?.sentimentScore ?? '-'}
                        </span>
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>/10</span>
                      </div>
                    </div>
                  </div>

                  {interaction?.notes && (
                    <>
                      <div className="meta-divider" />
                      <div className="meta-comment">
                        <span className="meta-label" style={{ display: "block", marginBottom: "0.4rem" }}>Call / Agent Notes</span>
                        <p>{interaction.notes}</p>
                      </div>
                    </>
                  )}
                </aside>

                {/* ── CELL 2 · COMPACT Voice Recording & Analysis Overview ── */}
                <div className="conv-chat-panel chart-card">
                  <div className="chat-panel-inner">
                    <h3 className="chart-title" style={{ fontSize: "0.95rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
                      <Volume2 size={18} color="#4f46e5" /> Voice Call Recording &amp; Analysis
                    </h3>

                    <div className="chat-scroll-area" ref={scrollRef}>
                      {/* Compact Audio Player */}
                      <div className="call-compact-audio">
                        <div className="call-compact-audio-header">
                          <span style={{ fontWeight: 700, fontSize: "0.85rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Phone size={14} color="#4f46e5" /> Audio Recording Stream (.wav)
                          </span>
                          <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            {summary?.durationSeconds ? `Duration: ${formatDuration(null, null, summary.durationSeconds)}` : "High-fidelity stereo"}
                          </span>
                        </div>

                        {audioSrc ? (
                          <audio controls src={audioSrc} className="compact-audio-player">
                            Your browser does not support the audio element.
                          </audio>
                        ) : (
                          <div style={{ padding: "0.65rem", background: "#ffffff", borderRadius: "6px", textAlign: "center", color: "#94a3b8", fontSize: "0.8rem", border: "1px dashed #cbd5e1" }}>
                            Audio stream is processing or unavailable.
                          </div>
                        )}
                      </div>

                      {/* Compact Analysis Action List */}
                      <div className="call-analysis-list">
                        {/* Item 1: English Summary */}
                        <div className="analysis-compact-card">
                          <div className="analysis-compact-info">
                            <div className="analysis-compact-title">
                              <FileText size={15} color="#4f46e5" /> English Executive Summary
                            </div>
                            <p className="analysis-compact-preview">
                              {summary?.summary ? summary.summary : "No English summary stored."}
                            </p>
                          </div>
                          <button
                            className="view-popup-btn"
                            onClick={() => openReadingModal("en")}
                            disabled={!summary?.summary}
                            style={{ opacity: !summary?.summary ? 0.5 : 1 }}
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>

                        {/* Item 2: Arabic Summary */}
                        <div className="analysis-compact-card">
                          <div className="analysis-compact-info">
                            <div className="analysis-compact-title">
                              <Globe size={15} color="#4f46e5" /> Arabic Call Summary (ملخص عربي)
                            </div>
                            <p className="analysis-compact-preview" style={{ direction: "rtl", textAlign: "right", fontFamily: "Segoe UI, Tahoma, sans-serif" }}>
                              {summary?.summaryAr ? summary.summaryAr : "لا يوجد ملخص عربي متاح."}
                            </p>
                          </div>
                          <button
                            className="view-popup-btn"
                            onClick={() => openReadingModal("ar")}
                            disabled={!summary?.summaryAr}
                            style={{ opacity: !summary?.summaryAr ? 0.5 : 1 }}
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>

                        {/* Item 3: Full Script */}
                        <div className="analysis-compact-card">
                          <div className="analysis-compact-info">
                            <div className="analysis-compact-title">
                              <MessageSquare size={15} color="#4f46e5" /> Full Conversation Script (Transcript)
                            </div>
                            <p className="analysis-compact-preview">
                              {summary?.fullTranscript ? summary.fullTranscript : "Full conversation script not transcribed."}
                            </p>
                          </div>
                          <button
                            className="view-popup-btn"
                            onClick={() => openReadingModal("transcript")}
                            disabled={!summary?.fullTranscript}
                            style={{ opacity: !summary?.fullTranscript ? 0.5 : 1 }}
                          >
                            <Eye size={14} /> View
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── CELL 3 · Support Ticket ── */}
                <div className="conv-order-card chart-card">
                  <h3 className="chart-title" style={{ fontSize: "0.9rem", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertCircle size={15} /> Support Ticket
                    {interaction?.relatedTicket && (
                      <span className="log-tag tag-status-escalated" style={{ marginLeft: "auto", fontSize: "0.7rem" }}>
                        {interaction.relatedTicket.status}
                      </span>
                    )}
                  </h3>

                  {interaction?.relatedTicket ? (
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

                {/* ── CELL 4 · Customer History ── */}
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
                          {history.map(log => {
                            const isCallLog = log.channel === "Calls" || log.channel === "Voice" || log.channel?.toLowerCase()?.includes("call");
                            const isCurrent = (log.id === (interaction?.interactionId || id));
                            return (
                              <tr key={log.id}>
                                <td>
                                  <div style={{ display: "flex", flexDirection: "column" }}>
                                    <span style={{ fontWeight: 600, color: "#1e293b", fontSize: "0.875rem" }}>{log.customerName}</span>
                                    <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>{log.customerId}</span>
                                  </div>
                                </td>
                                <td>
                                  <span className="log-tag tag-channel" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                    {isCallLog ? <Phone size={11} /> : <MessageSquare size={11} />}
                                    {log.channel}
                                  </span>
                                </td>
                                <td>
                                  {log.assignedUser
                                    ? <span className="log-tag tag-human">{log.assignedUser}</span>
                                    : <span className="log-tag tag-ai">AI Assistant</span>}
                                </td>
                                <td>
                                  <span className={`log-tag tag-status-${(log.status || "Completed").toLowerCase()}`}>{log.status}</span>
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
                                      <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#1e293b" }}>{log.sentimentScore ?? '-'}</span>
                                      <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>/10</span>
                                    </div>
                                  </div>
                                </td>
                                <td>
                                  <button
                                    className="log-view-btn"
                                    onClick={() => {
                                      if (isCallLog) navigate(`/calls/${log.id}`);
                                      else navigate(`/conversations/${log.id}`);
                                    }}
                                    disabled={isCurrent}
                                    style={{
                                      opacity: isCurrent ? 0.5 : 1,
                                      cursor: isCurrent ? "not-allowed" : "pointer"
                                    }}
                                  >
                                    {isCallLog ? <Phone size={13} /> : <ExternalLink size={13} />}
                                    {isCurrent ? "Current Call" : (isCallLog ? "View Call" : "View Chat")}
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            </>
          )}
        </main>
      </div>

      {/* ── BIG POPUP MODAL FOR READING SUMMARY OR TRANSCRIPT ── */}
      {modalOpen && (
        <div className="call-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="call-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="call-modal-header">
              <h3 className="call-modal-title">
                <FileText size={20} color="#4f46e5" />
                Voice Call Detailed Report
              </h3>
              <button className="call-modal-close" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="call-modal-tabs">
              <button
                className={`modal-tab-btn ${modalTab === "en" ? "active" : ""}`}
                onClick={() => setModalTab("en")}
              >
                <FileText size={14} /> English Summary
              </button>
              <button
                className={`modal-tab-btn ${modalTab === "ar" ? "active" : ""}`}
                onClick={() => setModalTab("ar")}
              >
                <Globe size={14} /> الملخص العربي
              </button>
              <button
                className={`modal-tab-btn ${modalTab === "transcript" ? "active" : ""}`}
                onClick={() => setModalTab("transcript")}
              >
                <MessageSquare size={14} /> Full Script (Transcript)
              </button>
            </div>

            <div className={`call-modal-body ${modalTab === "ar" ? "rtl-content" : ""}`}>
              {modalTab === "en" && (summary?.summary || "No English summary available for this call.")}
              {modalTab === "ar" && (summary?.summaryAr || "لا يوجد ملخص عربي متاح لهذه المكالمة.")}
              {modalTab === "transcript" && (summary?.fullTranscript || "Full conversation script has not been transcribed yet.")}
            </div>

            <div className="call-modal-footer">
              <button className="log-view-btn" onClick={() => setModalOpen(false)} style={{ padding: "0.55rem 1.25rem", background: "#4f46e5", color: "#fff", border: "none" }}>
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallPage;
