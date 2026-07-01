import React, { useState, useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import { Paperclip, Smile, Users, Settings, PhoneCall, MessageSquare, Send } from "lucide-react";
import "./AgentPage.css";
import apiClient from "../api/apiClient";
import aiLogo from "../assets/logo.png";
import { useAuth } from "../contexts/AuthContext";

// Typewriter component for fast perceived rendering
const TypewriterText = ({ text, speed = 15 }) => {
  const [displayedText, setDisplayedText] = useState("");

  useEffect(() => {
    let i = 0;
    setDisplayedText(""); // Reset
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayedText((prev) => prev + text.charAt(i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed]);

  return <span>{displayedText}</span>;
};

const AgentPage = () => {
  const { currentUser } = useAuth();
  const [message, setMessage] = useState("");
  // Owner Chat State
  const [messages, setMessages] = useState([]);
  
  // Customer Chat State
  const [chatMode, setChatMode] = useState('owner'); // 'owner' | 'customer'
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerData, setCustomerData] = useState(null);
  const [customerMessages, setCustomerMessages] = useState([]);
  const [customerForm, setCustomerForm] = useState({ fullName: "", email: "", phone: "" });
  const [customerModalTab, setCustomerModalTab] = useState('signup'); // 'signup' | 'login'
  const [modalAction, setModalAction] = useState('chat'); // 'chat' | 'call'
  const [activeInteractionId, setActiveInteractionId] = useState(null);
  const [formError, setFormError] = useState("");

  const [isTyping, setIsTyping] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!message.trim()) return;

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
        // We need the BusinessId. We get it from the Auth Context.
        const bizId = currentUser?.businessId || "b-123"; 

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
        if (!activeInteractionId && response.data.interactionId) {
          setActiveInteractionId(response.data.interactionId);
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

      // 2. Fetch interactions
      let oldMessages = [];
      try {
        const interactionsRes = await apiClient.get(`/api/Interaction/customer/${customer.customerId}`);
        const interactions = interactionsRes.data;
        
        if (interactions && interactions.length > 0) {
          // Pick the most recent interaction
          const latestInteraction = interactions[interactions.length - 1];
          setActiveInteractionId(latestInteraction.interactionId);
          
          // Fetch the messages for this interaction
          const messagesRes = await apiClient.get(`/api/Message/interaction/${latestInteraction.interactionId}`);
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
              {chatMode === 'owner' ? 'Chat with IRIS' : 'Customer View Simulator'}
            </h1>
            <p className="agent-topbar-subtitle">
              {chatMode === 'owner' 
                ? 'Your 24/7 assistant with instant replies' 
                : `Testing as: ${customerData?.fullName || 'Guest'}`}
            </p>
          </div>
          <div className="agent-topbar-right">
            {chatMode === 'owner' ? (
              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  className="agent-btn-outline highlight-btn"
                  onClick={() => { setModalAction('chat'); setShowCustomerModal(true); }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageSquare size={16} /> Customer Chat
                </button>
                <button 
                  className="agent-btn-outline"
                  onClick={() => { setModalAction('call'); setShowCustomerModal(true); }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '6px',
                    backgroundColor: '#10b981', color: 'white', borderColor: '#10b981'
                  }}
                >
                  <PhoneCall size={16} /> Customer Call
                </button>
              </div>
            ) : (
              <button 
                className="agent-btn-outline exit-btn"
                onClick={() => setChatMode('owner')}
              >
                Exit Customer Mode
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
                        onChange={e => setCustomerForm({...customerForm, fullName: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Email Address</label>
                      <input 
                        type="email" 
                        placeholder="Required if no phone"
                        value={customerForm.email}
                        onChange={e => setCustomerForm({...customerForm, email: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input 
                        type="tel" 
                        placeholder="Required if no email"
                        value={customerForm.phone}
                        onChange={e => setCustomerForm({...customerForm, phone: e.target.value})}
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
                        onChange={e => setCustomerForm({...customerForm, email: e.target.value})}
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

        {/* Chat Area Container */}
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
                      <div className={`agent-msg-bubble ${msg.sender} ${chatMode === 'customer' ? 'customer-theme' : ''}`}>
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
                className="agent-input-field"
                placeholder="Message to IRIS..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSend();
                }}
              />

              <div className="agent-input-actions">
                <button className="agent-icon-btn">
                  <Smile size={20} />
                </button>
                <button className="agent-send-btn" onClick={handleSend}>
                  Send <Send size={16} className="send-icon" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentPage;
