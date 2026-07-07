import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import {
  Settings,
  BotMessageSquare,
  Mic2,
  BellRing,
  Save,
  CheckCircle2,
  User,
  Store,
  Clock,
  Plug,
  CreditCard,
  UploadCloud,
  ChevronRight,
  ChevronLeft,
  Building,
  MapPin,
  Coffee,
  CheckSquare,
  PieChart,
} from "lucide-react";
import ReportsTabContent from "../components/ReportsTabContent";
import { useAuth } from "../contexts/AuthContext";
import {
  fetchBusinessSettings,
  updateBusinessProfile,
  updateSettings,
  updateUserProfile,
  connectIntegration,
  deleteIntegration,
  createBusiness,
} from "../api/settingsApi";
import apiClient from "../api/apiClient";
import "./SettingsPage.css";

const ToggleSwitch = ({ label, description, checked, onChange }) => (
  <div className="settings-toggle-container">
    <div className="toggle-info">
      <strong>{label}</strong>
      <span>{description}</span>
    </div>
    <div
      className={`toggle-switch ${checked ? "active" : ""}`}
      onClick={() => onChange(!checked)}
    >
      <div className="toggle-knob"></div>
    </div>
  </div>
);

const SettingsPage = () => {
  const { currentUser, login, tempPassword, setTempPassword } = useAuth(); // Need login to update context
  const businessId = currentUser?.businessId;
  const userId = currentUser?.id || currentUser?.userId;

  const [isOnboarding, setIsOnboarding] = useState(!businessId);
  const [onboardingStep, setOnboardingStep] = useState(1);

  const [activeTab, setActiveTab] = useState("profile");
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(!isOnboarding); // Only load if not onboarding
  const [showToast, setShowToast] = useState(false);

  // States mapped to DB models
  const [userProfile, setUserProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
  });
  const [businessProfile, setBusinessProfile] = useState({
    name: "",
    type: "",
    cuisineType: "",
    priceRange: "$$",
    description: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    facebookUrl: "",
    instagramUrl: "",
    hasDelivery: false,
    hasTakeout: false,
    hasParking: false,
    hasWiFi: false,
    hasOutdoorSeating: false,
    acceptsReservations: false,
    paymentMethods: "",
  });

  const [systemSettings, setSystemSettings] = useState({
    language: "en",
    timeZone: "UTC",
    chatbotEnabled: true,
    chatbotWelcomeMessage: "",
    chatbotPersonality: "Friendly",
    agentVoice: "default",
    agentVoiceProvider: "azure",
    agentVoiceLanguage: "en-US",
    agentVoiceSpeed: 1.0,
    agentVoicePitch: 1.0,
    enableNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    autoAssignTickets: true,
    meetingUrl: "",
  });

  const [workingHours, setWorkingHours] = useState([
    { dayOfWeek: 0, openTime: "09:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 1, openTime: "09:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 2, openTime: "09:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 3, openTime: "09:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 4, openTime: "09:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 5, openTime: "09:00", closeTime: "22:00", isClosed: false },
    { dayOfWeek: 6, openTime: "09:00", closeTime: "22:00", isClosed: false },
  ]);

  const [integrations, setIntegrations] = useState([]);
  const [subscription, setSubscription] = useState(null);

  const [kbFile, setKbFile] = useState(null); // For onboarding visual mockup
  const [kbEntries, setKbEntries] = useState([]);
  const [menuFile, setMenuFile] = useState(null);
  const [menuEntries, setMenuEntries] = useState([]);
  const [settingsKbLoading, setSettingsKbLoading] = useState(false);
  const [settingsMenuLoading, setSettingsMenuLoading] = useState(false);

  useEffect(() => {
    if (isOnboarding) return; // Don't fetch if onboarding
    if (!businessId) {
      setIsLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        const data = await fetchBusinessSettings(businessId);
        if (data.business) {
          setBusinessProfile((prev) => ({ ...prev, ...data.business }));
          if (
            data.business.workingHours &&
            data.business.workingHours.length > 0
          ) {
            setWorkingHours(data.business.workingHours);
          }
        }
        if (data.settings)
          setSystemSettings((prev) => ({ ...prev, ...data.settings }));
        if (data.integrations) setIntegrations(data.integrations);
        if (data.subscription) setSubscription(data.subscription);

        if (currentUser) {
          const names = (currentUser.fullName || "").trim().split(" ");
          setUserProfile({
            firstName: names[0] || "",
            lastName: names.slice(1).join(" ") || "",
            email: currentUser.email || "",
            phoneNumber: currentUser.phoneNumber || "",
          });
        }
      } catch (err) {
        console.error("Failed to load settings", err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [businessId, currentUser, isOnboarding]);

  const handleUserChange = (field, value) =>
    setUserProfile((p) => ({ ...p, [field]: value }));
  const handleBusinessChange = (field, value) =>
    setBusinessProfile((p) => ({ ...p, [field]: value }));
  const handleSettingChange = (field, value) =>
    setSystemSettings((p) => ({ ...p, [field]: value }));
  const handleWorkingHourChange = (dayOfWeek, field, value) => {
    setWorkingHours((prev) =>
      prev.map((wh) =>
        wh.dayOfWeek === dayOfWeek ? { ...wh, [field]: value } : wh,
      ),
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (businessId) {
        await updateBusinessProfile(businessId, {
          ...businessProfile,
          workingHours,
        });
        await updateSettings(businessId, systemSettings);
      }

      if (userId) {
        await updateUserProfile(userId, {
          fullName: `${userProfile.firstName} ${userProfile.lastName}`.trim(),
          email: userProfile.email,
        });
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (error) {
      console.error("Failed to save settings", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinishOnboarding = async () => {
    setIsSaving(true);
    try {
      // 1. Create the business (which includes working hours in the backend logic)
      const payload = {
        ...businessProfile,
        workingHours,
      };
      const newBusiness = await createBusiness(payload);

      // 2. We skip calling a PDF upload endpoint because it doesn't exist natively yet.
      // The file is purely visual mockup as requested.

      // 3. To get a fresh token WITHOUT touching the backend code, we automatically re-login!
      // This retrieves a fresh JWT token containing the new BusinessId claim.
      let newToken = localStorage.getItem("authToken");
      let updatedUser = {
        ...currentUser,
        businessId: newBusiness.id,
        role: "Owner",
      };

      if (tempPassword) {
        try {
          const authClient = await import("../api/apiClient");
          const response = await authClient.default.post("/api/Auth/login", {
            email: currentUser.email,
            password: tempPassword
          });

          newToken = response.data.token;
          updatedUser = {
            id: response.data.userId,
            email: response.data.email,
            fullName: response.data.fullName,
            role: response.data.role,
            businessId: response.data.businessId
          };
          setTempPassword(""); // Clear memory
        } catch (authErr) {
          console.error("Auto log-in failed after business creation", authErr);
        }
      }

      login(updatedUser, newToken);

      if (kbEntries.length > 0) {
        try {
          const authClient = await import("../api/apiClient");
          await authClient.default.post("/api/KnowledgeBase/bulk", {
            businessId: newBusiness.id,
            entries: kbEntries.map(e => ({
              question: e.question || e.Question || "",
              answer: e.answer || e.Answer || "",
              isFAQ: e.isFAQ ?? e.IsFAQ ?? true,
              displayOrder: e.displayOrder ?? e.DisplayOrder ?? 0,
              isActive: e.isActive ?? e.IsActive ?? true
            }))
          });
        } catch (kbErr) {
          console.error("Failed bulk Knowledge Base upload during onboarding:", kbErr);
        }
      }

      if (menuEntries.length > 0) {
        try {
          const authClient = await import("../api/apiClient");
          await authClient.default.post("/api/MenuItem/bulk", {
            businessId: newBusiness.id,
            items: menuEntries.map(m => ({
              name: m.name || m.Name || "",
              description: m.description || m.Description || "",
              price: parseFloat(m.price || m.Price || 0),
              categoryName: m.categoryName || m.CategoryName || "General",
              isAvailable: m.isAvailable ?? m.IsAvailable ?? true
            }))
          });
        } catch (menuErr) {
          console.error("Failed bulk Menu upload during onboarding:", menuErr);
        }
      }


      setIsOnboarding(false);
      window.location.href = "/dashboard"; // Force redirect to dashboard
    } catch (error) {
      console.error("Failed to complete onboarding", error);

      // Display detailed validation errors if they exist
      const errorDetails = error.response?.data?.errors
        ? JSON.stringify(error.response.data.errors)
        : error.response?.data?.Message ||
        error.response?.data?.title ||
        error.message;

      alert("Error creating business: " + errorDetails);
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateKbOutside = async (e) => {
    const file = e.target.files[0];
    if (!file || !businessId) return;
    setSettingsKbLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const entries = Array.isArray(json) ? json : (json.entries || json.Entries || []);
        await apiClient.post("/api/KnowledgeBase/bulk", {
          businessId: businessId,
          entries: entries.map(ent => ({
            question: ent.question || ent.Question || "",
            answer: ent.answer || ent.Answer || "",
            isFAQ: ent.isFAQ ?? ent.IsFAQ ?? true,
            displayOrder: ent.displayOrder ?? ent.DisplayOrder ?? 0,
            isActive: ent.isActive ?? ent.IsActive ?? true
          }))
        });
        alert(`Successfully updated Knowledge Base with ${entries.length} entries!`);
      } catch (err) {
        console.error("KB update error:", err);
        alert("Failed to update Knowledge Base. Check JSON format.");
      } finally {
        setSettingsKbLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateMenuOutside = async (e) => {
    const file = e.target.files[0];
    if (!file || !businessId) return;
    setSettingsMenuLoading(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const items = Array.isArray(json) ? json : (json.items || json.Items || []);
        await apiClient.post("/api/MenuItem/bulk", {
          businessId: businessId,
          items: items.map(m => ({
            name: m.name || m.Name || "",
            description: m.description || m.Description || "",
            price: parseFloat(m.price || m.Price || 0),
            categoryName: m.categoryName || m.CategoryName || "General",
            isAvailable: m.isAvailable ?? m.IsAvailable ?? true
          }))
        });
        alert(`Successfully updated Restaurant Menu with ${items.length} items!`);
      } catch (err) {
        console.error("Menu update error:", err);
        alert("Failed to update Restaurant Menu. Check JSON format.");
      } finally {
        setSettingsMenuLoading(false);
      }
    };
    reader.readAsText(file);
  };

  const handleKbFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const entries = Array.isArray(json) ? json : (json.entries || json.Entries || []);
        setKbEntries(entries);
        setKbFile({ name: file.name, size: `${(file.size/1024).toFixed(1)} KB` });
      } catch (err) {
        alert("Invalid JSON format for Knowledge Base file.");
      }
    };
    reader.readAsText(file);
  };

  const handleMenuFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const items = Array.isArray(json) ? json : (json.items || json.Items || []);
        setMenuEntries(items);
        setMenuFile({ name: file.name, size: `${(file.size/1024).toFixed(1)} KB` });
      } catch (err) {
        alert("Invalid JSON format for Menu file.");
      }
    };
    reader.readAsText(file);
  };

  const toggleIntegration = async (platform) => {
    try {
      const existing = integrations.find((i) => i.platformName === platform);
      if (existing) {
        await deleteIntegration(existing.id);
        setIntegrations(integrations.filter((i) => i.id !== existing.id));
      } else {
        if (businessId) {
          const newInt = await connectIntegration({
            businessId,
            platformName: platform,
            apiKeyOrConfig: "connected",
          });
          setIntegrations([...integrations, newInt]);
        }
      }
    } catch (e) {
      console.error("Integration update failed", e);
    }
  };

  const TABS = [
    { id: "profile", label: "Profile", Icon: User },
    { id: "business", label: "Business", Icon: Store },
    { id: "hours", label: "Working Hours", Icon: Clock },
    { id: "reports", label: "Reports", Icon: PieChart },
    { id: "data", label: "AI Knowledge & Menu", Icon: UploadCloud },
    { id: "notifications", label: "Notifications", Icon: BellRing },
  ];

  const DAYS_OF_WEEK = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const COMMUNICATION_CHANNELS = [
    "Voice Calls",
    "WhatsApp",
    "Instagram",
    "Messenger",
  ];

  if (isLoading) {
    return (
      <div className="app-layout">
        <Sidebar />
        <div className="main-content-area" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh", display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <Loader text="Loading Settings..." />
        </div>
      </div>
    );
  }

  // --- ONBOARDING WIZARD RENDER ---
  if (isOnboarding) {
    const isStep1Valid =
      businessProfile.name.trim() !== "" && businessProfile.type.trim() !== "";
    const isStep2Valid =
      businessProfile.address.trim() !== "" &&
      businessProfile.city.trim() !== "" &&
      businessProfile.country.trim() !== "" &&
      businessProfile.phone.trim() !== "";
    const isStep5Valid = kbFile !== null;
    const isStep6Valid = menuFile !== null;

    return (
      <div
        className="app-layout"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#f3f4f6",
          minHeight: "100vh",
          padding: "2rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "800px",
            background: "white",
            borderRadius: "12px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.05)",
            overflow: "hidden",
          }}
        >
          {/* Header */}
          <div
            style={{
              background: "#4f46e5",
              color: "white",
              padding: "2rem",
              textAlign: "center",
            }}
          >
            <h1 style={{ margin: "0 0 0.5rem", fontSize: "1.75rem" }}>
              Welcome to IRIS AI!
            </h1>
            <p style={{ margin: 0, opacity: 0.9 }}>
              Let's set up your business profile so your digital employee can
              start working.
            </p>
          </div>

          <div style={{ padding: "2rem" }}>
            {/* Step Indicators */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "2rem",
                position: "relative",
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((step) => (
                <div
                  key={step}
                  style={{
                    width: "35px",
                    height: "35px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: onboardingStep >= step ? "#4f46e5" : "#e2e8f0",
                    color: onboardingStep >= step ? "white" : "#64748b",
                    fontWeight: "bold",
                    zIndex: 1,
                  }}
                >
                  {step}
                </div>
              ))}
              <div
                style={{
                  position: "absolute",
                  top: "17px",
                  left: "0",
                  right: "0",
                  height: "2px",
                  background: "#e2e8f0",
                  zIndex: 0,
                }}
              ></div>
              <div
                style={{
                  position: "absolute",
                  top: "17px",
                  left: "0",
                  width: `${((onboardingStep - 1) / 5) * 100}%`,
                  height: "2px",
                  background: "#4f46e5",
                  zIndex: 0,
                  transition: "width 0.3s",
                }}
              ></div>
            </div>

            <style>
              {`
                .onboard-input {
                  width: 100%;
                  background-color: white;
                  border: 1px solid #cbd5e1;
                  color: #1e293b;
                  padding: 0.75rem 1rem;
                  border-radius: 8px;
                  transition: all 0.2s;
                }
                .onboard-input:focus {
                  outline: none;
                  border-color: #4f46e5;
                  box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
                }
                .onboard-input::placeholder {
                  color: #94a3b8;
                }
                .onboard-label {
                  display: block;
                  margin-bottom: 0.5rem;
                  font-size: 0.9rem;
                  font-weight: 500;
                  color: #475569;
                }
                .onboard-group {
                  margin-bottom: 1.5rem;
                  flex: 1;
                }
                .onboard-row {
                  display: flex;
                  gap: 1.5rem;
                }
                
                /* Wizard Step Container for Consistent Height */
                .wizard-step {
                  height: 420px;
                  overflow-y: auto;
                  padding-right: 10px;
                }
                
                /* Custom Scrollbar for all scrollable areas */
                .wizard-step::-webkit-scrollbar, .scrollable-hours::-webkit-scrollbar {
                  width: 6px;
                }
                .wizard-step::-webkit-scrollbar-track, .scrollable-hours::-webkit-scrollbar-track {
                  background: #f1f5f9;
                  border-radius: 4px;
                }
                .wizard-step::-webkit-scrollbar-thumb, .scrollable-hours::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 4px;
                }
              `}
            </style>

            {/* Step 1: Basic Info */}
            {onboardingStep === 1 && (
              <div className="wizard-step">
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#1e293b",
                    marginBottom: "1.5rem",
                  }}
                >
                  <Building size={20} color="#4f46e5" /> Step 1: Basic
                  Information
                </h3>
                <div className="onboard-row">
                  <div className="onboard-group">
                    <label className="onboard-label">Business Name *</label>
                    <input
                      type="text"
                      className="onboard-input"
                      value={businessProfile.name}
                      onChange={(e) =>
                        handleBusinessChange("name", e.target.value)
                      }
                      placeholder="e.g. The Golden Fork"
                    />
                  </div>
                  <div className="onboard-group">
                    <label className="onboard-label">Business Type *</label>
                    <input
                      type="text"
                      className="onboard-input"
                      value={businessProfile.type}
                      onChange={(e) =>
                        handleBusinessChange("type", e.target.value)
                      }
                      placeholder="e.g. Restaurant, Clinic"
                    />
                  </div>
                </div>
                <div className="onboard-row">
                  <div className="onboard-group">
                    <label className="onboard-label">
                      Category (e.g. Italian, Dental)
                    </label>
                    <input
                      type="text"
                      className="onboard-input"
                      value={businessProfile.cuisineType}
                      onChange={(e) =>
                        handleBusinessChange("cuisineType", e.target.value)
                      }
                      placeholder="e.g. Italian"
                    />
                  </div>
                  <div className="onboard-group">
                    <label className="onboard-label">Price Range</label>
                    <select
                      className="onboard-input"
                      value={businessProfile.priceRange}
                      onChange={(e) =>
                        handleBusinessChange("priceRange", e.target.value)
                      }
                    >
                      <option value="$">$ (Low)</option>
                      <option value="$$">$$ (Moderate)</option>
                      <option value="$$$">$$$ (High)</option>
                    </select>
                  </div>
                </div>
                <div className="onboard-group">
                  <label className="onboard-label">Store Description</label>
                  <textarea
                    className="onboard-input"
                    rows="3"
                    value={businessProfile.description}
                    onChange={(e) =>
                      handleBusinessChange("description", e.target.value)
                    }
                    placeholder="Tell customers about your business..."
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location & Contact */}
            {onboardingStep === 2 && (
              <div className="wizard-step">
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#1e293b",
                    marginBottom: "1.5rem",
                  }}
                >
                  <MapPin size={20} color="#4f46e5" /> Step 2: Location &
                  Contact
                </h3>
                <div className="onboard-row">
                  <div className="onboard-group" style={{ flex: 2 }}>
                    <label className="onboard-label">Street Address *</label>
                    <input
                      type="text"
                      className="onboard-input"
                      value={businessProfile.address}
                      onChange={(e) =>
                        handleBusinessChange("address", e.target.value)
                      }
                      placeholder="123 Main St"
                    />
                  </div>
                  <div className="onboard-group" style={{ flex: 1 }}>
                    <label className="onboard-label">City *</label>
                    <input
                      type="text"
                      className="onboard-input"
                      placeholder="City"
                      value={businessProfile.city}
                      onChange={(e) =>
                        handleBusinessChange("city", e.target.value)
                      }
                    />
                  </div>
                  <div className="onboard-group" style={{ flex: 1 }}>
                    <label className="onboard-label">Country *</label>
                    <input
                      type="text"
                      className="onboard-input"
                      placeholder="Country"
                      value={businessProfile.country}
                      onChange={(e) =>
                        handleBusinessChange("country", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="onboard-row">
                  <div className="onboard-group">
                    <label className="onboard-label">Business Phone *</label>
                    <input
                      type="tel"
                      className="onboard-input"
                      value={businessProfile.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        handleBusinessChange(
                          "phone",
                          digits ? `+${digits}` : "",
                        );
                      }}
                      placeholder="+12345678900"
                    />
                  </div>
                  <div className="onboard-group">
                    <label className="onboard-label">Business Email</label>
                    <input
                      type="email"
                      className="onboard-input"
                      value={businessProfile.email}
                      onChange={(e) =>
                        handleBusinessChange("email", e.target.value)
                      }
                      placeholder="contact@business.com"
                    />
                  </div>
                </div>
                <div className="onboard-row">
                  <div className="onboard-group">
                    <label className="onboard-label">Website URL</label>
                    <input
                      type="url"
                      className="onboard-input"
                      value={businessProfile.website}
                      onChange={(e) =>
                        handleBusinessChange("website", e.target.value)
                      }
                      placeholder="https://"
                    />
                  </div>
                  <div className="onboard-group">
                    <label className="onboard-label">Instagram URL</label>
                    <input
                      type="url"
                      className="onboard-input"
                      value={businessProfile.instagramUrl}
                      onChange={(e) =>
                        handleBusinessChange("instagramUrl", e.target.value)
                      }
                      placeholder="https://instagram.com/..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Amenities */}
            {onboardingStep === 3 && (
              <div className="wizard-step">
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#1e293b",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Coffee size={20} color="#4f46e5" /> Step 3: Amenities &
                  Services
                </h3>
                <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
                  Toggle the services your business provides. The AI will use
                  this to answer customer questions accurately.
                </p>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "1rem",
                  }}
                >
                  <ToggleSwitch
                    label="Has Delivery"
                    description="We deliver orders."
                    checked={businessProfile.hasDelivery}
                    onChange={(v) => handleBusinessChange("hasDelivery", v)}
                  />
                  <ToggleSwitch
                    label="Has Takeout"
                    description="Customers can pick up."
                    checked={businessProfile.hasTakeout}
                    onChange={(v) => handleBusinessChange("hasTakeout", v)}
                  />
                  <ToggleSwitch
                    label="Parking Available"
                    description="Store features parking lot."
                    checked={businessProfile.hasParking}
                    onChange={(v) => handleBusinessChange("hasParking", v)}
                  />
                  <ToggleSwitch
                    label="Has WiFi"
                    description="Free WiFi for guests."
                    checked={businessProfile.hasWiFi}
                    onChange={(v) => handleBusinessChange("hasWiFi", v)}
                  />
                  <ToggleSwitch
                    label="Outdoor Seating"
                    description="Patios or tables outside."
                    checked={businessProfile.hasOutdoorSeating}
                    onChange={(v) =>
                      handleBusinessChange("hasOutdoorSeating", v)
                    }
                  />
                  <ToggleSwitch
                    label="Accepts Reservations"
                    description="Users can reserve tables."
                    checked={businessProfile.acceptsReservations}
                    onChange={(v) =>
                      handleBusinessChange("acceptsReservations", v)
                    }
                  />
                </div>

                <div className="onboard-group" style={{ marginTop: "1.5rem" }}>
                  <label className="onboard-label">
                    Accepted Payment Methods (Comma Separated)
                  </label>
                  <input
                    type="text"
                    className="onboard-input"
                    placeholder="e.g. Cash, Credit Card, Apple Pay"
                    value={businessProfile.paymentMethods}
                    onChange={(e) =>
                      handleBusinessChange("paymentMethods", e.target.value)
                    }
                  />
                </div>
              </div>
            )}

            {/* Step 4: Working Hours */}
            {onboardingStep === 4 && (
              <div className="wizard-step">
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#1e293b",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Clock size={20} color="#4f46e5" /> Step 4: Working Hours
                </h3>
                <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
                  Set your operating times. The AI will notify customers if you
                  are closed when they ask.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {workingHours.map((wh) => (
                    <div
                      key={wh.dayOfWeek}
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                        background: wh.isClosed ? "#f8fafc" : "#ffffff",
                        padding: "1rem 1.5rem",
                        borderRadius: "12px",
                        border: "1px solid #e2e8f0",
                        opacity: wh.isClosed ? 0.7 : 1,
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          width: "100px",
                          fontWeight: "600",
                          color: "#1e293b",
                        }}
                      >
                        {DAYS_OF_WEEK[wh.dayOfWeek]}
                      </div>

                      <div
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          alignItems: "center",
                          flex: 1,
                        }}
                      >
                        <input
                          type="time"
                          className="onboard-input"
                          style={{ width: "130px", padding: "0.5rem" }}
                          value={wh.openTime || ""}
                          onChange={(e) =>
                            handleWorkingHourChange(
                              wh.dayOfWeek,
                              "openTime",
                              e.target.value,
                            )
                          }
                          disabled={wh.isClosed}
                        />
                        <span style={{ color: "#64748b", fontWeight: "500" }}>
                          to
                        </span>
                        <input
                          type="time"
                          className="onboard-input"
                          style={{ width: "130px", padding: "0.5rem" }}
                          value={wh.closeTime || ""}
                          onChange={(e) =>
                            handleWorkingHourChange(
                              wh.dayOfWeek,
                              "closeTime",
                              e.target.value,
                            )
                          }
                          disabled={wh.isClosed}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          background: "#f1f5f9",
                          padding: "0.5rem 1rem",
                          borderRadius: "8px",
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`closed-${wh.dayOfWeek}`}
                          checked={wh.isClosed}
                          onChange={(e) =>
                            handleWorkingHourChange(
                              wh.dayOfWeek,
                              "isClosed",
                              e.target.checked,
                            )
                          }
                          style={{
                            cursor: "pointer",
                            width: "16px",
                            height: "16px",
                            accentColor: "#4f46e5",
                          }}
                        />
                        <label
                          htmlFor={`closed-${wh.dayOfWeek}`}
                          style={{
                            cursor: "pointer",
                            color: "#475569",
                            fontSize: "0.9rem",
                            userSelect: "none",
                          }}
                        >
                          Closed
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Step 5: Knowledge Base Upload */}
            {onboardingStep === 5 && (
              <div className="wizard-step">
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#1e293b",
                    marginBottom: "0.5rem",
                  }}
                >
                  <CheckSquare size={20} color="#4f46e5" /> Step 5: Train Your AI Employee (Knowledge Base)
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    marginBottom: "2rem",
                    lineHeight: "1.6",
                  }}
                >
                  Upload a JSON document containing your business FAQs and policies. <br />
                  <span style={{ color: "#4f46e5" }}>
                    The AI will extract this into Question & Answer format internally so it can respond to customers accurately.
                  </span>
                </p>

                <input 
                  type="file" 
                  id="kb-file-input" 
                  accept=".json" 
                  style={{ display: "none" }} 
                  onChange={handleKbFileChange}
                />

                <div
                  style={{
                    border: `2px dashed ${kbFile ? "#10b981" : "#4f46e5"}`,
                    borderRadius: "16px",
                    padding: "4rem 2rem",
                    textAlign: "center",
                    background: kbFile
                      ? "rgba(16, 185, 129, 0.05)"
                      : "rgba(79, 70, 229, 0.05)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => document.getElementById("kb-file-input").click()}
                >
                  <UploadCloud
                    size={56}
                    color={kbFile ? "#10b981" : "#4f46e5"}
                    style={{ margin: "0 auto 1.5rem" }}
                  />
                  {kbFile ? (
                    <div>
                      <h4
                        style={{
                          margin: "0 0 0.5rem",
                          color: "#10b981",
                          fontSize: "1.25rem",
                        }}
                      >
                        {kbFile.name} Uploaded Successfully!
                      </h4>
                      <span style={{ color: "#64748b", fontSize: "0.95rem" }}>
                        {kbFile.size} ({kbEntries.length} entries loaded)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <h4
                        style={{
                          margin: "0 0 0.5rem",
                          color: "#1e293b",
                          fontSize: "1.25rem",
                        }}
                      >
                        Click to select your Knowledge Base JSON file
                      </h4>
                      <span style={{ color: "#64748b", fontSize: "0.95rem" }}>
                        Supported format: .json (Array of Q&A objects)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 6: Menu Upload */}
            {onboardingStep === 6 && (
              <div className="wizard-step">
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    color: "#1e293b",
                    marginBottom: "0.5rem",
                  }}
                >
                  <Store size={20} color="#4f46e5" /> Step 6: Restaurant Menu Setup
                </h3>
                <p
                  style={{
                    color: "#64748b",
                    marginBottom: "2rem",
                    lineHeight: "1.6",
                  }}
                >
                  Upload a JSON document containing your restaurant menu items and pricing. <br />
                  <span style={{ color: "#4f46e5" }}>
                    Customers will be able to browse and order these items directly through AI chat or voice calls.
                  </span>
                </p>

                <input 
                  type="file" 
                  id="menu-file-input" 
                  accept=".json" 
                  style={{ display: "none" }} 
                  onChange={handleMenuFileChange}
                />

                <div
                  style={{
                    border: `2px dashed ${menuFile ? "#10b981" : "#4f46e5"}`,
                    borderRadius: "16px",
                    padding: "4rem 2rem",
                    textAlign: "center",
                    background: menuFile
                      ? "rgba(16, 185, 129, 0.05)"
                      : "rgba(79, 70, 229, 0.05)",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                  onClick={() => document.getElementById("menu-file-input").click()}
                >
                  <UploadCloud
                    size={56}
                    color={menuFile ? "#10b981" : "#4f46e5"}
                    style={{ margin: "0 auto 1.5rem" }}
                  />
                  {menuFile ? (
                    <div>
                      <h4
                        style={{
                          margin: "0 0 0.5rem",
                          color: "#10b981",
                          fontSize: "1.25rem",
                        }}
                      >
                        {menuFile.name} Uploaded Successfully!
                      </h4>
                      <span style={{ color: "#64748b", fontSize: "0.95rem" }}>
                        {menuFile.size} ({menuEntries.length} menu items loaded)
                      </span>
                    </div>
                  ) : (
                    <div>
                      <h4
                        style={{
                          margin: "0 0 0.5rem",
                          color: "#1e293b",
                          fontSize: "1.25rem",
                        }}
                      >
                        Click to select your Menu JSON file
                      </h4>
                      <span style={{ color: "#64748b", fontSize: "0.95rem" }}>
                        Supported format: .json (Array of Menu item objects)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Wizard Controls */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: "2rem",
                paddingTop: "1.5rem",
                borderTop: "1px solid #e2e8f0",
              }}
            >
              <button
                onClick={() => setOnboardingStep((p) => Math.max(1, p - 1))}
                style={{
                  padding: "0.75rem 1.5rem",
                  borderRadius: "8px",
                  background: "white",
                  color: "#1e293b",
                  border: "1px solid #cbd5e1",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  visibility: onboardingStep === 1 ? "hidden" : "visible",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                <ChevronLeft size={16} /> Back
              </button>

              {onboardingStep < 6 ? (
                <button
                  onClick={() => setOnboardingStep((p) => Math.min(6, p + 1))}
                  disabled={
                    (onboardingStep === 1 && !isStep1Valid) ||
                    (onboardingStep === 2 && !isStep2Valid) ||
                    (onboardingStep === 5 && !isStep5Valid)
                  }
                  style={{
                    padding: "0.75rem 1.5rem",
                    borderRadius: "8px",
                    background: "#4f46e5",
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "600",
                    opacity:
                      (onboardingStep === 1 && !isStep1Valid) ||
                        (onboardingStep === 2 && !isStep2Valid) ||
                        (onboardingStep === 5 && !isStep5Valid)
                        ? 0.5
                        : 1,
                  }}
                >
                  Next Step <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={handleFinishOnboarding}
                  disabled={!isStep6Valid || isSaving}
                  style={{
                    padding: "0.75rem 2rem",
                    borderRadius: "8px",
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem",
                    cursor: "pointer",
                    fontWeight: "bold",
                    opacity: !isStep6Valid || isSaving ? 0.5 : 1,
                  }}
                >
                  {isSaving ? "Creating Business..." : "Finish Setup"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD SETTINGS PAGE RENDER ---
  return (
    <div className="app-layout">
      <Sidebar />
      <div
        className="main-content-area"
        style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}
      >
        <Topbar
          pageTitle="Settings"
          subtitle="Manage your business preferences and AI behavior."
        />

        <main className="dashboard-content-wrapper settings-container">
          <div className="settings-tabs">
            {TABS.map(({ id, label, Icon }) => (
              <button
                key={id}
                className={`settings-tab-btn ${activeTab === id ? "active" : ""}`}
                onClick={() => setActiveTab(id)}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </div>

          <div className="settings-card">
            {activeTab === "profile" && (
              <>
                <h3>
                  <User size={20} color="#4f46e5" /> Personal Information
                </h3>
                <p className="subtitle">
                  Manage your account details and contact information.
                </p>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={userProfile.firstName}
                      onChange={(e) =>
                        handleUserChange("firstName", e.target.value)
                      }
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={userProfile.lastName}
                      onChange={(e) =>
                        handleUserChange("lastName", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label>Email Address</label>
                    <input
                      type="email"
                      className="settings-input"
                      value={userProfile.email}
                      onChange={(e) =>
                        handleUserChange("email", e.target.value)
                      }
                      disabled
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Phone Number</label>
                    <input
                      type="tel"
                      className="settings-input"
                      value={userProfile.phoneNumber}
                      onChange={(e) =>
                        handleUserChange("phoneNumber", e.target.value)
                      }
                    />
                  </div>
                </div>
              </>
            )}

            {activeTab === "business" && (
              <>
                <h3>
                  <Store size={20} color="#4f46e5" /> Business Profile
                </h3>
                <p className="subtitle">
                  Manage how your storefront appears to customers.
                </p>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label>Business Name</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={businessProfile.name || ""}
                      onChange={(e) =>
                        handleBusinessChange("name", e.target.value)
                      }
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Business Type</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={businessProfile.type || ""}
                      onChange={(e) =>
                        handleBusinessChange("type", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label>Cuisine Category</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={businessProfile.cuisineType || ""}
                      onChange={(e) =>
                        handleBusinessChange("cuisineType", e.target.value)
                      }
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Price Range</label>
                    <select
                      className="settings-select"
                      value={businessProfile.priceRange || "$$"}
                      onChange={(e) =>
                        handleBusinessChange("priceRange", e.target.value)
                      }
                    >
                      <option value="$">$ (Low)</option>
                      <option value="$$">$$ (Moderate)</option>
                      <option value="$$$">$$$ (High)</option>
                    </select>
                  </div>
                </div>
                <div className="settings-form-group">
                  <label>Store Description</label>
                  <textarea
                    className="settings-input"
                    rows="2"
                    value={businessProfile.description || ""}
                    onChange={(e) =>
                      handleBusinessChange("description", e.target.value)
                    }
                  />
                </div>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label>Street Address</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={businessProfile.address || ""}
                      onChange={(e) =>
                        handleBusinessChange("address", e.target.value)
                      }
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>City, Country</label>
                    <input
                      type="text"
                      className="settings-input"
                      value={`${businessProfile.city || ""}, ${businessProfile.country || ""}`}
                      onChange={(e) => {
                        const parts = e.target.value.split(",");
                        handleBusinessChange("city", parts[0]?.trim() || "");
                        handleBusinessChange("country", parts[1]?.trim() || "");
                      }}
                    />
                  </div>
                </div>
                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label>Business Phone</label>
                    <input
                      type="tel"
                      className="settings-input"
                      value={businessProfile.phone || ""}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, "");
                        handleBusinessChange(
                          "phone",
                          digits ? `+${digits}` : "",
                        );
                      }}
                      placeholder="+12345678900"
                    />
                  </div>
                  <div className="settings-form-group">
                    <label>Business Email</label>
                    <input
                      type="email"
                      className="settings-input"
                      value={businessProfile.email || ""}
                      onChange={(e) =>
                        handleBusinessChange("email", e.target.value)
                      }
                    />
                  </div>
                </div>

                <h4
                  style={{
                    color: "#334155",
                    fontSize: "0.95rem",
                    margin: "1rem 0 0.5rem",
                  }}
                >
                  Amenities & Offerings
                </h4>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0 1.5rem",
                  }}
                >
                  <ToggleSwitch
                    label="Has Delivery"
                    description="We deliver orders."
                    checked={businessProfile.hasDelivery}
                    onChange={(v) => handleBusinessChange("hasDelivery", v)}
                  />
                  <ToggleSwitch
                    label="Has Takeout"
                    description="Customers can pick up."
                    checked={businessProfile.hasTakeout}
                    onChange={(v) => handleBusinessChange("hasTakeout", v)}
                  />
                  <ToggleSwitch
                    label="Parking Available"
                    description="Store features parking lot."
                    checked={businessProfile.hasParking}
                    onChange={(v) => handleBusinessChange("hasParking", v)}
                  />
                  <ToggleSwitch
                    label="Has WiFi"
                    description="Free WiFi for guests."
                    checked={businessProfile.hasWiFi}
                    onChange={(v) => handleBusinessChange("hasWiFi", v)}
                  />
                  <ToggleSwitch
                    label="Outdoor Seating"
                    description="Patios or tables outside."
                    checked={businessProfile.hasOutdoorSeating}
                    onChange={(v) =>
                      handleBusinessChange("hasOutdoorSeating", v)
                    }
                  />
                  <ToggleSwitch
                    label="Accepts Reservations"
                    description="Users can reserve tables."
                    checked={businessProfile.acceptsReservations}
                    onChange={(v) =>
                      handleBusinessChange("acceptsReservations", v)
                    }
                  />
                </div>
              </>
            )}

            {activeTab === "reports" && (
              <ReportsTabContent />
            )}

            {activeTab === "data" && (
              <>
                <h3>
                  <UploadCloud size={20} color="#4f46e5" /> AI Knowledge Base & Restaurant Menu
                </h3>
                <p className="subtitle">
                  Update your digital employee&apos;s training data and restaurant menu items anytime.
                </p>

                <input
                  type="file"
                  id="settings-kb-input"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleUpdateKbOutside}
                />
                <input
                  type="file"
                  id="settings-menu-input"
                  accept=".json"
                  style={{ display: "none" }}
                  onChange={handleUpdateMenuOutside}
                />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "2rem" }}>
                  <div
                    style={{
                      border: "2px dashed #4f46e5",
                      borderRadius: "16px",
                      padding: "2.5rem 1.5rem",
                      textAlign: "center",
                      background: "rgba(79, 70, 229, 0.05)",
                      cursor: settingsKbLoading ? "wait" : "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => !settingsKbLoading && document.getElementById("settings-kb-input").click()}
                  >
                    <CheckSquare size={40} color="#4f46e5" style={{ margin: "0 auto 1rem" }} />
                    <h4 style={{ margin: "0 0 0.5rem", color: "#1e293b", fontSize: "1.1rem" }}>
                      {settingsKbLoading ? "Updating Knowledge Base..." : "Update Knowledge Base"}
                    </h4>
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      Click to upload new Q&A JSON dataset
                    </span>
                  </div>

                  <div
                    style={{
                      border: "2px dashed #10b981",
                      borderRadius: "16px",
                      padding: "2.5rem 1.5rem",
                      textAlign: "center",
                      background: "rgba(16, 185, 129, 0.05)",
                      cursor: settingsMenuLoading ? "wait" : "pointer",
                      transition: "all 0.3s ease",
                    }}
                    onClick={() => !settingsMenuLoading && document.getElementById("settings-menu-input").click()}
                  >
                    <Store size={40} color="#10b981" style={{ margin: "0 auto 1rem" }} />
                    <h4 style={{ margin: "0 0 0.5rem", color: "#1e293b", fontSize: "1.1rem" }}>
                      {settingsMenuLoading ? "Updating Restaurant Menu..." : "Update Restaurant Menu"}
                    </h4>
                    <span style={{ color: "#64748b", fontSize: "0.85rem" }}>
                      Click to upload new Menu Items JSON
                    </span>
                  </div>
                </div>
              </>
            )}

            {activeTab === "hours" && (
              <>
                <h3>
                  <Clock size={20} color="#4f46e5" /> Working Hours & General
                </h3>
                <p className="subtitle">
                  Set your operating times and basic preferences.
                </p>
                <div
                  className="settings-form-row"
                  style={{ marginBottom: "1.5rem" }}
                >
                  <div className="settings-form-group">
                    <label>System Language</label>
                    <select
                      className="settings-select"
                      value={systemSettings.language || "en"}
                      onChange={(e) =>
                        handleSettingChange("language", e.target.value)
                      }
                    >
                      <option value="en">English</option>
                      <option value="ar">Arabic</option>
                      <option value="fr">French</option>
                    </select>
                  </div>
                  <div className="settings-form-group">
                    <label>Time Zone</label>
                    <select
                      className="settings-select"
                      value={systemSettings.timeZone || "UTC"}
                      onChange={(e) =>
                        handleSettingChange("timeZone", e.target.value)
                      }
                    >
                      <option value="UTC">UTC</option>
                      <option value="Africa/Cairo">Africa/Cairo</option>
                      <option value="America/New_York">America/New_York</option>
                    </select>
                  </div>
                </div>
                <div className="working-hours-list">
                  {workingHours.map((wh) => (
                    <div
                      key={wh.dayOfWeek}
                      className="working-hours-row"
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "center",
                        marginBottom: "1rem",
                        background: "#f8fafc",
                        padding: "1rem",
                        borderRadius: "8px",
                      }}
                    >
                      <div style={{ width: "100px", fontWeight: "600" }}>
                        {DAYS_OF_WEEK[wh.dayOfWeek]}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "0.5rem",
                          alignItems: "center",
                        }}
                      >
                        <input
                          type="time"
                          className="settings-input"
                          style={{ width: "auto" }}
                          value={wh.openTime || ""}
                          onChange={(e) =>
                            handleWorkingHourChange(
                              wh.dayOfWeek,
                              "openTime",
                              e.target.value,
                            )
                          }
                          disabled={wh.isClosed}
                        />
                        <span>to</span>
                        <input
                          type="time"
                          className="settings-input"
                          style={{ width: "auto" }}
                          value={wh.closeTime || ""}
                          onChange={(e) =>
                            handleWorkingHourChange(
                              wh.dayOfWeek,
                              "closeTime",
                              e.target.value,
                            )
                          }
                          disabled={wh.isClosed}
                        />
                      </div>
                      <div
                        style={{
                          marginLeft: "auto",
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                        }}
                      >
                        <input
                          type="checkbox"
                          id={`closed-${wh.dayOfWeek}`}
                          checked={wh.isClosed}
                          onChange={(e) =>
                            handleWorkingHourChange(
                              wh.dayOfWeek,
                              "isClosed",
                              e.target.checked,
                            )
                          }
                        />
                        <label htmlFor={`closed-${wh.dayOfWeek}`}>Closed</label>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}


            {activeTab === "notifications" && (
              <>
                <h3>
                  <BellRing size={20} color="#4f46e5" /> Notifications &
                  Automations
                </h3>
                <p className="subtitle">
                  Control routing and alerts targeting your administrative
                  account.
                </p>
                <ToggleSwitch
                  label="Master Notification Toggle"
                  description="When disabled, all channels are silenced immediately."
                  checked={systemSettings.enableNotifications}
                  onChange={(v) =>
                    handleSettingChange("enableNotifications", v)
                  }
                />
                <div
                  style={{
                    opacity: systemSettings.enableNotifications ? 1 : 0.5,
                    pointerEvents: systemSettings.enableNotifications
                      ? "auto"
                      : "none",
                    transition: "opacity 0.2s",
                  }}
                >
                  <ToggleSwitch
                    label="Email Alerts"
                    description="Receive daily digests."
                    checked={systemSettings.emailNotifications}
                    onChange={(v) =>
                      handleSettingChange("emailNotifications", v)
                    }
                  />
                  <ToggleSwitch
                    label="Push Notifications"
                    description="Receive web popups."
                    checked={systemSettings.pushNotifications}
                    onChange={(v) =>
                      handleSettingChange("pushNotifications", v)
                    }
                  />
                  <ToggleSwitch
                    label="SMS Alerts"
                    description="Recieve text messages."
                    checked={systemSettings.smsNotifications}
                    onChange={(v) => handleSettingChange("smsNotifications", v)}
                  />
                </div>
                <hr
                  style={{
                    border: "0",
                    borderTop: "1px solid #e2e8f0",
                    margin: "1.5rem 0",
                  }}
                />
                <ToggleSwitch
                  label="Auto-Assign Tickets"
                  description="System will automatically route unassigned tickets to available agents."
                  checked={systemSettings.autoAssignTickets}
                  onChange={(v) => handleSettingChange("autoAssignTickets", v)}
                />
              </>
            )}


            <div className="settings-actions">
              <button
                className="save-settings-btn"
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? (
                  "Saving..."
                ) : (
                  <>
                    <Save size={16} /> Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>

      {showToast && (
        <div className="toast-success">
          <CheckCircle2 color="white" size={20} />
          <span>Settings saved successfully!</span>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
