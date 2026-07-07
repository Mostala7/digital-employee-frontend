import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { Paperclip, Smile, Users, Settings, PhoneCall, MessageSquare, Send } from "lucide-react";
import "./AgentPage.css";
import apiClient from "../api/apiClient";
import aiLogo from "../assets/logo.png";
import { useAuth } from "../contexts/AuthContext";

// Typewriter component for fast perceived rendering
const TypewriterText = ({ text, speed = 15 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(0);
    const timer = setInterval(() => {
      setCount((prev) => {
        if (prev >= text.length) {
          clearInterval(timer);
          return prev;
        }
        return prev + 1;
      });
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{text.slice(0, count)}</span>;
};

const AgentPage = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState("");
  // Owner Chat State
  const [messages, setMessages] = useState([]);

  // Customer Chat State
  const [chatMode, setChatMode] = useState('select'); // 'select' | 'customer' | 'owner'
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [customerMessages, setCustomerMessages] = useState([]);
  const [customerForm, setCustomerForm] = useState({ fullName: "", email: "", phone: "" });
  const [customerModalTab, setCustomerModalTab] = useState('signup'); // 'signup' | 'login'
  const [modalAction, setModalAction] = useState('chat'); // 'chat' | 'call'
  const [activeInteractionId, setActiveInteractionId] = useState(null);
  const [chatEnded, setChatEnded] = useState(false);
  const [formError, setFormError] = useState("");
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [ratingValue, setRatingValue] = useState(5);
  const [feedbackNote, setFeedbackNote] = useState("");
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");
  const [activeTicketId, setActiveTicketId] = useState(null);

  const [isTyping, setIsTyping] = useState(false);

  const handleEndCustomerChat = async () => {
    const intId = activeInteractionId || activeInteractionRef.current;
    if (intId) {
      try {
        await apiClient.post(`/api/Interaction/${intId}/end`, {});
      } catch (err) {
        console.error("Failed to end interaction server-side:", err);
      }
    }
    if (activeInteractionRef.current) {
      activeInteractionRef.current = null;
    }
    setChatMode('select');
    setChatEnded(false);
    setActiveInteractionId(null);
    setActiveTicketId(null);
  };

  const handleSubmitFeedback = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setIsSubmittingFeedback(true);
    setFeedbackError("");

    try {
      const bizId = currentUser?.businessId;
      const custId = customerData?.customerId;

      if (!bizId || !custId) {
        setShowRatingModal(false);
        await handleEndCustomerChat();
        return;
      }

      // =========================================================================================
      // FUTURE BACKEND UPDATE NOTE:
      // Once the backend team makes `TicketId` optional in FeedbackCreateDTOValidator
      // and adds `InteractionId` to FeedbackCreateDTO, you can delete lines 95-135 below
      // and replace them with this simple API call:
      //
      // await apiClient.post('/api/Feedback', {
      //   interactionId: activeInteractionId,
      //   customerId: custId,
      //   rating: Number(ratingValue) || 5,
      //   comment: feedbackNote?.trim() || "No comment provided."
      // });
      // =========================================================================================

      let targetTicketId = activeTicketId;

      if (!targetTicketId) {
        try {
          const ticketsRes = await apiClient.get(`/api/Ticket/business/${bizId}`);
          const tickets = ticketsRes.data || [];
          const found = tickets.find(t => 
            (activeInteractionId && (t.interactionId === activeInteractionId || t.InteractionId === activeInteractionId)) ||
            t.customerId === custId || t.CustomerId === custId
          );
          if (found) {
            targetTicketId = found.id || found.Id || found.ticketId || found.TicketId;
          }
        } catch (err) {
          console.warn("Could not fetch tickets for feedback lookup:", err);
        }
      }

      if (!targetTicketId) {
        try {
          const createTicketRes = await apiClient.post('/api/Ticket', {
            subject: `Chat Session Feedback - ${customerData?.fullName || 'Customer'}`,
            customerId: custId,
            businessId: bizId,
            interactionId: activeInteractionId || null
          });
          const newT = createTicketRes.data;
          targetTicketId = newT?.id || newT?.Id || newT?.ticketId || newT?.TicketId;
        } catch (err) {
          console.warn("Could not create fallback ticket for feedback:", err);
        }
      }

      if (!targetTicketId) {
        targetTicketId = "general-chat-feedback";
      }

      await apiClient.post('/api/Feedback', {
        ticketId: targetTicketId,
        customerId: custId,
        rating: Number(ratingValue) || 5,
        comment: feedbackNote?.trim() || "No comment provided."
      });

    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmittingFeedback(false);
      setShowRatingModal(false);
      setRatingValue(5);
      setFeedbackNote("");
      await handleEndCustomerChat();
    }
  };
  const chatScrollRef = useRef(null);
  const activeInteractionRef = useRef(null);

  useEffect(() => {
    activeInteractionRef.current = activeInteractionId;
  }, [activeInteractionId]);

  useEffect(() => {
    return () => {
      if (activeInteractionRef.current) {
        apiClient.post(`/api/Interaction/${activeInteractionRef.current}/end`, {}).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  useEffect(() => {
    if (chatMode === 'owner') {
      const fetchOwnerHistory = async () => {
        try {
          const response = await apiClient.get('/api/OwnerChat/history');
          const history = response.data || [];
          
          const mappedMessages = [];
          history.forEach((item, index) => {
            mappedMessages.push({
              id: `history-user-${index}`,
              sender: 'user',
              text: item.message
            });
            mappedMessages.push({
              id: `history-ai-${index}`,
              sender: 'ai',
              text: item.reply,
              confidence: item.confidence
            });
          });
          
          setMessages(mappedMessages);
        } catch (err) {
          console.error("Failed to fetch owner chat history:", err);
        }
      };
      
      fetchOwnerHistory();
    }
  }, [chatMode]);

  const handleClearHistory = async () => {
    try {
      await apiClient.delete('/api/OwnerChat/history');
      setMessages([]);
    } catch (err) {
      console.error("Failed to clear owner chat history:", err);
    }
  };

  const handleSend = async () => {
    if (!message.trim() || isTyping) return;

    const userText = message.trim();
    setMessage("");

    // 1. Immediately add user message to UI based on mode
    if (chatMode === 'owner') {
      setMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    } else {
      setCustomerMessages(prev => [...prev, { id: Date.now(), sender: 'user', text: userText }]);
    }

    // 2. Show typing indicator
    setIsTyping(true);

    try {
      if (chatMode === 'owner') {
        // Owner Chat Logic
        const response = await apiClient.post('/api/OwnerChat/message', { message: userText });
        setIsTyping(false);
        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: response.data.reply,
          sources: response.data.data_sources_used,
          confidence: response.data.confidence
        }]);
      } else {
        // Customer Chat Logic
        // We need the BusinessId. Use customerData's businessId first, then currentUser's.
        const bizId = customerData?.businessId || currentUser?.businessId;
        if (!bizId) {
          setChatError("Unable to identify the Business ID for this session.");
          setIsTyping(false);
          return;
        }

        const response = await apiClient.post('/api/CustomerChat/message', {
          businessId: bizId,
          customerId: customerData?.customerId,
          interactionId: activeInteractionId,
          message: userText
        });

        setIsTyping(false);
        setCustomerMessages(prev => [...prev, {
          id: Date.now() + 1,
          sender: 'ai',
          text: response.data.replyText
        }]);

        // Update active interaction if this was the first message
        const newIntId = response.data.interactionId || response.data.InteractionId || response.data.id || response.data.Id;
        if (!activeInteractionId && newIntId) {
          setActiveInteractionId(newIntId);
        }
        const newTId = response.data.ticketId || response.data.TicketId;
        if (newTId) {
          setActiveTicketId(newTId);
        }
      }

    } catch (error) {
      setIsTyping(false);
      console.error("Failed to send message to AI:", error);

      const errorMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: "I'm sorry, I encountered an error while trying to process your request."
      };

      if (chatMode === 'owner') {
        setMessages(prev => [...prev, errorMsg]);
      } else {
        setCustomerMessages(prev => [...prev, errorMsg]);
      }
    }
  };

  const handleCustomerModalSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!customerForm.fullName.trim()) return;

    if (!customerForm.email.trim() && !customerForm.phone.trim()) {
      setFormError("Please provide either an Email Address or a Phone Number.");
      return;
    }

    try {
      const bizId = currentUser?.businessId;
      if (!bizId) {
        setFormError("Unable to find your Business ID. Please re-login.");
        return;
      }

      const response = await apiClient.post('/api/Customer', {
        fullName: customerForm.fullName,
        email: customerForm.email,
        phone: customerForm.phone,
        businessId: bizId
      });

      const customer = response.data;

      if (modalAction === 'call') {
        try {
          const callRes = await apiClient.post('/api/CustomerVoice/call/start', {
            businessId: bizId,
            customerId: customer.customerId
          });
          setShowCustomerModal(false);
          window.open(callRes.data.meetingUrl, '_blank');
          return;
        } catch (callErr) {
          const errMsg = callErr.response?.data?.message || callErr.response?.data?.Message || "Failed to start voice call. Please check if MeetingUrl is configured in Settings.";
          setFormError(errMsg);
          return;
        }
      }

      setCustomerData(customer);
      setShowCustomerModal(false);
      setChatMode('customer');
      setChatEnded(false);
      setCustomerMessages([]);
    } catch (error) {
      console.error("Failed to create customer:", error.response?.data || error);

      // Extract FluentValidation errors if any
      let validationMsg = "";
      if (error.response?.data?.errors) {
        const errs = error.response.data.errors;
        validationMsg = Object.values(errs).flat().join(" | ");
      }

      const backendError = validationMsg || error.response?.data?.Message || error.response?.data?.title || error.message || "Unknown error";

      if (backendError.toLowerCase().includes("already exists")) {
        setCustomerModalTab('login');
        setFormError("This email already exists. Please log in instead.");
      } else {
        setFormError(`Failed to initialize customer session: ${backendError}`);
      }
    }
  };

  const handleCustomerLoginSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    const emailToLogin = customerForm.email.trim();
    if (!emailToLogin) {
      setFormError("Please enter an email to login.");
      return;
    }

    try {
      // 1. Fetch customer by email
      const customerRes = await apiClient.get(`/api/Customer/email/${encodeURIComponent(emailToLogin)}`);
      const customer = customerRes.data;

      if (currentUser?.businessId && customer.businessId && customer.businessId !== currentUser.businessId) {
        setFormError("No customer account found with this email for this business.");
        return;
      }

      if (modalAction === 'call') {
        try {
          const callRes = await apiClient.post('/api/CustomerVoice/call/start', {
            businessId: currentUser?.businessId || customer.businessId,
            customerId: customer.customerId
          });
          setShowCustomerModal(false);
          window.open(callRes.data.meetingUrl, '_blank');
          return;
        } catch (callErr) {
          const errMsg = callErr.response?.data?.message || callErr.response?.data?.Message || "Failed to start voice call. Please check if MeetingUrl is configured in Settings.";
          setFormError(errMsg);
          return;
        }
      }

      setCustomerData(customer);
      setShowCustomerModal(false);
      setChatMode('customer');
      setChatEnded(false);

      // 2. Fetch interactions
      let oldMessages = [];
      try {
        const interactionsRes = await apiClient.get(`/api/Interaction/customer/${customer.customerId}`);
        const rawInteractions = interactionsRes.data || [];
        const interactions = rawInteractions.filter(i => !currentUser?.businessId || i.businessId === currentUser.businessId || i.BusinessId === currentUser.businessId || (!i.businessId && !i.BusinessId));

        if (interactions && interactions.length > 0) {
          // Find an open interaction if available, otherwise pick the most recent one to display history
          const openInteractions = interactions.filter(i => i.status !== 'Closed' && i.status !== 'Resolved' && !i.isEnded);
          const activeOrLatest = openInteractions.length > 0 ? openInteractions[openInteractions.length - 1] : interactions[interactions.length - 1];
          const intId = activeOrLatest.interactionId || activeOrLatest.InteractionId || activeOrLatest.id || activeOrLatest.Id;
          
          if (activeOrLatest.status !== 'Closed' && activeOrLatest.status !== 'Resolved' && !activeOrLatest.isEnded) {
            setActiveInteractionId(intId);
          } else {
            setActiveInteractionId(null);
          }

          // Fetch the messages for this interaction
          const messagesRes = await apiClient.get(`/api/Message/interaction/${intId}`);
          const fetchedMessages = messagesRes.data;

          if (fetchedMessages && fetchedMessages.length > 0) {
            oldMessages = fetchedMessages
              .sort((a, b) => new Date(a.sentAt) - new Date(b.sentAt))
              .map((msg, index) => ({
                id: msg.messageId || Date.now() + index,
                sender: msg.senderType === 'Customer' ? 'user' : 'ai',
                text: msg.content
              }));
          }
        }
      } catch (interactionError) {
        console.error("Failed to fetch past interactions:", interactionError);
      }

      if (oldMessages.length > 0) {
        setCustomerMessages(oldMessages);
      } else {
        setCustomerMessages([]);
      }

    } catch (error) {
      console.error("Login failed:", error.response?.data || error);
      if (error.response?.status === 404) {
        setCustomerModalTab('signup');
        setFormError("This email is not registered yet. Please sign up as a new customer.");
      } else {
        setCustomerModalTab('signup');
        setFormError("An error occurred while logging in. Please check your email or sign up.");
      }
    }
  };

  const activeMessages = chatMode === 'owner' ? messages : customerMessages;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-area">
        {/* Topbar */}
        <header className={`agent-topbar ${chatMode === 'customer' ? 'customer-mode-topbar' : ''}`}>
          <div className="agent-topbar-left">
            <h1 className="agent-topbar-title">
              {chatMode === 'select' ? 'Digital Employee Simulator' : chatMode === 'owner' ? 'Chat with IRIS' : 'Customer View Simulator'}
            </h1>
            <p className="agent-topbar-subtitle">
              {chatMode === 'select'
                ? 'Test and experience your AI assistant from your customers perspective'
                : chatMode === 'owner'
                  ? 'Your 24/7 assistant with instant replies'
                  : `Testing as: ${customerData?.fullName || 'Guest'}`}
            </p>
          </div>
          <div className="agent-topbar-right">
            {chatMode === 'select' ? null : chatMode === 'owner' ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  className="agent-btn-outline"
                  onClick={handleClearHistory}
                  style={{ color: '#ef4444', borderColor: '#ef4444' }}
                >
                  Clear History
                </button>
                <button
                  className="agent-btn-outline exit-btn"
                  onClick={() => setChatMode('select')}
                >
                  Exit IRIS Chat
                </button>
              </div>
            ) : (
              <button
                className="agent-btn-outline exit-btn"
                style={activeInteractionId ? { backgroundColor: '#ef4444', color: 'white', borderColor: '#ef4444' } : {}}
                onClick={() => {
                  if (customerData) {
                    setShowRatingModal(true);
                  } else {
                    handleEndCustomerChat();
                  }
                }}
              >
                {activeInteractionId ? "End Customer Chat" : "Exit Customer Mode"}
              </button>
            )}
          </div>
        </header>

        {/* Customer Initialization Modal */}
        {showCustomerModal && (
          <div className="customer-modal-overlay">
            <div className="customer-modal-content">

              <div className="customer-modal-tabs">
                <button
                  className={`modal-tab ${customerModalTab === 'signup' ? 'active' : ''}`}
                  onClick={() => { setCustomerModalTab('signup'); setFormError(""); }}
                >
                  New Customer
                </button>
                <button
                  className={`modal-tab ${customerModalTab === 'login' ? 'active' : ''}`}
                  onClick={() => { setCustomerModalTab('login'); setFormError(""); }}
                >
                  Returning Customer
                </button>
              </div>

              {formError && <div className="form-error-message">{formError}</div>}

              {customerModalTab === 'signup' ? (
                <>
                  <h2>{modalAction === 'call' ? 'Start Voice Call' : 'Simulate New Customer'}</h2>
                  <p>{modalAction === 'call' ? 'Enter a name and email to start testing the AI voice agent.' : 'Enter details to test as a brand new customer.'}</p>

                  <form onSubmit={handleCustomerModalSubmit}>
                    <div className="form-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={customerForm.fullName}
                        onChange={e => setCustomerForm({ ...customerForm, fullName: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        placeholder="Required if no phone"
                        value={customerForm.email}
                        onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input
                        type="tel"
                        placeholder="Required if no email"
                        value={customerForm.phone}
                        onChange={e => setCustomerForm({ ...customerForm, phone: e.target.value })}
                      />
                    </div>

                    <div className="modal-actions">
                      <button type="button" className="btn-cancel" onClick={() => setShowCustomerModal(false)}>Cancel</button>
                      <button type="submit" className="btn-save">{modalAction === 'call' ? 'Start Call' : 'Start Chat'}</button>
                    </div>
                  </form>
                </>
              ) : (
                <>
                  <h2>Welcome Back</h2>
                  <p>{modalAction === 'call' ? 'Enter an existing customer email to resume voice testing.' : 'Enter the email address of a customer you previously created to resume their chat.'}</p>

                  <form onSubmit={handleCustomerLoginSubmit}>
                    <div className="form-group">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. john@example.com"
                        value={customerForm.email}
                        onChange={e => setCustomerForm({ ...customerForm, email: e.target.value })}
                      />
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-cancel" onClick={() => setShowCustomerModal(false)}>Cancel</button>
                      <button type="submit" className="btn-save">{modalAction === 'call' ? 'Start Call' : 'Load Chat'}</button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        )}

        {/* Chat Area Container or Channel Selection Screen */}
        {chatMode === 'select' ? (
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f8fafc',
            padding: '2rem'
          }}>
            <div style={{
              background: 'white',
              padding: '3.5rem 3rem',
              borderRadius: '20px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.08), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              maxWidth: '850px',
              width: '100%',
              textAlign: 'center',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '20px',
                background: 'linear-gradient(135deg, #0880d8, #660399)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                color: 'white',
                boxShadow: '0 10px 15px -3px rgba(8, 128, 216, 0.3)'
              }}>
                <Users size={36} />
              </div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.75rem' }}>
                Select Interaction Channel
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginTop: '2.5rem' }}>
                <button
                  onClick={() => { setChatMode('owner'); }}
                  style={{
                    padding: '2rem 1.5rem',
                    borderRadius: '16px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.25rem',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#8b5cf6'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 20px -5px rgba(139, 92, 246, 0.15)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    minWidth: '64px',
                    minHeight: '64px',
                    borderRadius: '16px',
                    background: '#f5f3ff',
                    color: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    flexShrink: 0,
                    boxSizing: 'border-box'
                  }}>
                    <MessageSquare size={32} style={{ display: 'block', margin: 'auto', flexShrink: 0 }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.35rem 0' }}>Chat with IRIS</h4>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Your AI assistant</span>
                  </div>
                </button>

                <button
                  onClick={() => { setModalAction('chat'); setShowCustomerModal(true); }}
                  style={{
                    padding: '2rem 1.5rem',
                    borderRadius: '16px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.25rem',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#3b82f6'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 20px -5px rgba(59, 130, 246, 0.15)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    minWidth: '64px',
                    minHeight: '64px',
                    borderRadius: '16px',
                    background: '#eff6ff',
                    color: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    flexShrink: 0,
                    boxSizing: 'border-box'
                  }}>
                    <MessageSquare size={32} style={{ display: 'block', margin: 'auto', flexShrink: 0 }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.35rem 0' }}>Customer Chat</h4>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Test live AI text support</span>
                  </div>
                </button>

                <button
                  onClick={() => { setModalAction('call'); setShowCustomerModal(true); }}
                  style={{
                    padding: '2rem 1.5rem',
                    borderRadius: '16px',
                    border: '2px solid #e2e8f0',
                    background: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '1.25rem',
                    transition: 'all 0.25s ease',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.02)'
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 15px 20px -5px rgba(16, 185, 129, 0.15)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.02)'; }}
                >
                  <div style={{
                    width: '64px',
                    height: '64px',
                    minWidth: '64px',
                    minHeight: '64px',
                    borderRadius: '16px',
                    background: '#ecfdf5',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto',
                    flexShrink: 0,
                    boxSizing: 'border-box'
                  }}>
                    <PhoneCall size={32} style={{ display: 'block', margin: 'auto', flexShrink: 0 }} />
                  </div>
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#1e293b', margin: '0 0 0.35rem 0' }}>Customer Call</h4>
                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Test live AI voice call</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className={`agent-chat-container ${chatMode === 'customer' ? 'customer-mode-bg' : ''}`}>
            <div className="agent-chat-history" ref={chatScrollRef}>
              {activeMessages.length === 0 ? (
                /* Welcome Area (Centered) */
                <div className="agent-welcome">
                  <img src={aiLogo} alt="IRIS Logo" className="agent-welcome-logo" />
                  <h2 className="agent-welcome-title">
                    {chatMode === 'owner' ? "Hello! I'm IRIS your AI assistant" : "Customer Support Portal"}
                  </h2>
                  <p className="agent-welcome-subtitle">
                    {chatMode === 'owner' ? "How can I help you today?" : "We are here to help."}
                  </p>
                </div>
              ) : (
                <div className="agent-message-list">
                  {activeMessages.map((msg) => (
                    <div key={msg.id} className={`agent-msg-row ${msg.sender} ${chatMode === 'customer' ? 'customer-theme' : ''}`}>
                      {msg.sender === 'ai' && (
                        <img src={aiLogo} alt="IRIS" className="agent-msg-avatar" />
                      )}
                      <div className="agent-msg-bubble-container">
                        <div dir="auto" className={`agent-msg-bubble ${msg.sender} ${chatMode === 'customer' ? 'customer-theme' : ''}`}>
                          {msg.sender === 'ai' ? (
                            <TypewriterText text={msg.text} speed={10} />
                          ) : (
                            msg.text
                          )}
                        </div>

                        {/* Optional Data Sources Pill (Only for Owner) */}
                        {chatMode === 'owner' && msg.sender === 'ai' && msg.sources && msg.sources.length > 0 && (
                          <div className="agent-msg-sources">
                            <span className="source-label">Sources:</span>
                            {msg.sources.map((src, idx) => (
                              <span key={idx} className="source-pill">{src}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className={`agent-msg-row ai ${chatMode === 'customer' ? 'customer-theme' : ''}`}>
                      <img src={aiLogo} alt="IRIS" className="agent-msg-avatar" />
                      <div className="agent-msg-bubble-container">
                        <div className={`agent-msg-bubble ai typing ${chatMode === 'customer' ? 'customer-theme' : ''}`}>
                          <span className="dot"></span>
                          <span className="dot"></span>
                          <span className="dot"></span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Input Box Area (Bottom Fixed) */}
            <div className="agent-input-wrapper">
              <div className="agent-input-container">


                <input
                  type="text"
                  dir="auto"
                  className="agent-input-field"
                  placeholder={chatMode === 'customer' && chatEnded ? "Chat ended. Start a new session to continue..." : (isTyping ? "AI is thinking..." : "Message to IRIS...")}
                  value={message}
                  disabled={(chatMode === 'customer' && chatEnded) || isTyping}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !(chatMode === 'customer' && chatEnded) && !isTyping) handleSend();
                  }}
                />

                <div className="agent-input-actions">
                  <button className="agent-icon-btn" disabled={(chatMode === 'customer' && chatEnded) || isTyping}>
                    <Smile size={20} />
                  </button>
                  <button className="agent-send-btn" onClick={handleSend} disabled={(chatMode === 'customer' && chatEnded) || isTyping || !message.trim()}>
                    Send <Send size={16} className="send-icon" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Rating & Feedback Modal */}
        {showRatingModal && (
          <div className="customer-modal-overlay" style={{ zIndex: 1100 }}>
            <div className="customer-modal-content rating-modal-content" style={{ maxWidth: '440px', padding: '2rem', borderRadius: '20px', background: '#ffffff', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <div className="rating-modal-header" style={{ marginBottom: '1.25rem' }}>
                <div className="rating-modal-icon" style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)', color: '#d97706', fontSize: '1.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 10px 15px -3px rgba(245, 158, 11, 0.2)' }}>
                  ★
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.4rem', letterSpacing: '-0.02em' }}>
                  Rate Your Chat Experience
                </h3>
                <p style={{ fontSize: '0.9rem', color: '#64748b', lineHeight: '1.5', margin: 0 }}>
                  Your feedback helps IRIS learn and improve future customer interactions.
                </p>
              </div>

              {feedbackError && (
                <div className="form-error-message" style={{ margin: '1rem 0' }}>
                  {feedbackError}
                </div>
              )}

              <form onSubmit={handleSubmitFeedback} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div className="rating-stars-container" style={{ background: '#f8fafc', padding: '1.25rem', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                  <div className="rating-stars-row" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '0.5rem' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        className={`rating-star-btn ${star <= ratingValue ? 'active' : ''}`}
                        onClick={() => setRatingValue(star)}
                        title={`${star} Star${star > 1 ? 's' : ''}`}
                        style={{ background: 'none', border: 'none', fontSize: '2.2rem', cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)', color: star <= ratingValue ? '#f59e0b' : '#cbd5e1', transform: star <= ratingValue ? 'scale(1.1)' : 'scale(1)', padding: '0 4px', textShadow: star <= ratingValue ? '0 4px 12px rgba(245, 158, 11, 0.35)' : 'none' }}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                  <span className="rating-label-text" style={{ fontSize: '0.9rem', fontWeight: 600, color: '#334155', display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {ratingValue === 1 && "Poor"}
                    {ratingValue === 2 && "Fair"}
                    {ratingValue === 3 && "Good"}
                    {ratingValue === 4 && "Very Good"}
                    {ratingValue === 5 && "Excellent!"}
                  </span>
                </div>

                <div className="form-group" style={{ textAlign: 'left', margin: 0 }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#334155', marginBottom: '0.5rem' }}>
                    Additional Feedback (Optional)
                  </label>
                  <textarea
                    className="customer-form-input"
                    rows="3"
                    placeholder="Tell us what went well or how we can improve this chat..."
                    value={feedbackNote}
                    onChange={(e) => setFeedbackNote(e.target.value)}
                    style={{ width: '100%', resize: 'vertical', padding: '0.85rem', borderRadius: '12px', border: '1px solid #cbd5e1', fontFamily: 'inherit', fontSize: '0.9rem', transition: 'border-color 0.2s, box-shadow 0.2s', outline: 'none' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="agent-btn-outline"
                    style={{ flex: 1, padding: '0.85rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.95rem', borderColor: '#cbd5e1', color: '#475569' }}
                    onClick={() => {
                      setShowRatingModal(false);
                      handleEndCustomerChat();
                    }}
                    disabled={isSubmittingFeedback}
                  >
                    Skip & Exit
                  </button>
                  <button
                    type="submit"
                    className="customer-submit-btn"
                    style={{ flex: 1.5, padding: '0.85rem', borderRadius: '12px', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)', color: 'white', border: 'none', boxShadow: '0 10px 15px -3px rgba(79, 70, 229, 0.3)', cursor: 'pointer' }}
                    disabled={isSubmittingFeedback}
                  >
                    {isSubmittingFeedback ? (
                      <>
                        <span className="loading-spinner-small" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                        Submitting...
                      </>
                    ) : (
                      "Submit Feedback"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentPage;
