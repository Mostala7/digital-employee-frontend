import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import { Search, Building2, CheckCircle, XCircle, ShieldCheck, Plus } from "lucide-react";
import "./LogsPage.css";
import "./TicketsPage.css";
import "./CustomersPage.css";
import "./AgentPage.css"; // reuse .form-group styling for the Add/Edit modal
import apiClient from "../api/apiClient";

const EMPTY_FORM = {
  name: "",
  type: "",
  address: "",
  phone: "",
  email: "",
  city: "",
  country: "",
  cuisineType: "",
  priceRange: "",
};

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
};

const AdminBusinessesPage = () => {
  const [businesses, setBusinesses] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBusiness, setEditingBusiness] = useState(null); // null = create mode
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [confirmAction, setConfirmAction] = useState(null); // { type: 'suspend'|'activate'|'delete', business }

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [businessesRes, subscriptionsRes] = await Promise.all([
        apiClient.get("/api/Business"),
        apiClient.get("/api/Subscription").catch(() => ({ data: [] })),
      ]);
      setBusinesses(businessesRes.data || []);
      setSubscriptions(subscriptionsRes.data || []);
    } catch (error) {
      console.error("Failed to fetch businesses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const subscriptionByBusinessId = subscriptions.reduce((acc, sub) => {
    acc[sub.businessId] = sub;
    return acc;
  }, {});

  const filtered = businesses.filter((b) => {
    const q = searchQuery.toLowerCase();
    return (
      q === "" ||
      b.name?.toLowerCase().includes(q) ||
      b.type?.toLowerCase().includes(q) ||
      b.city?.toLowerCase().includes(q)
    );
  });

  const stats = {
    total: businesses.length,
    active: businesses.filter((b) => b.isActive).length,
    suspended: businesses.filter((b) => !b.isActive).length,
    verified: businesses.filter((b) => b.isVerified).length,
  };

  const STAT_CARDS = [
    { label: "Total Businesses", value: stats.total, Icon: Building2 },
    { label: "Active", value: stats.active, Icon: CheckCircle },
    { label: "Suspended", value: stats.suspended, Icon: XCircle },
    { label: "Verified", value: stats.verified, Icon: ShieldCheck },
  ];

  const openCreateModal = () => {
    setEditingBusiness(null);
    setForm(EMPTY_FORM);
    setFormError("");
    setShowFormModal(true);
  };

  const openEditModal = (business) => {
    setEditingBusiness(business);
    setForm({
      name: business.name || "",
      type: business.type || "",
      address: business.address || "",
      phone: business.phone || "",
      email: business.email || "",
      city: business.city || "",
      country: business.country || "",
      cuisineType: business.cuisineType || "",
      priceRange: business.priceRange || "",
    });
    setFormError("");
    setShowFormModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.type.trim() || !form.address.trim() || !form.phone.trim()) {
      setFormError("Name, Type, Address and Phone are required.");
      return;
    }

    setIsSaving(true);
    try {
      if (editingBusiness) {
        await apiClient.put(`/api/Business/${editingBusiness.id}`, form);
      } else {
        await apiClient.post("/api/Business", form);
      }
      setShowFormModal(false);
      await fetchData();
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        error.response?.data?.Message ||
        error.response?.data?.title ||
        "Failed to save business.";
      setFormError(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, business } = confirmAction;
    try {
      if (type === "suspend") {
        await apiClient.post(`/api/AdminDashboard/business/${business.id}/suspend`);
      } else if (type === "activate") {
        await apiClient.post(`/api/AdminDashboard/business/${business.id}/activate`);
      } else if (type === "delete") {
        await apiClient.delete(`/api/Business/${business.id}`);
      }
      setConfirmAction(null);
      await fetchData();
    } catch (error) {
      console.error(`Failed to ${type} business:`, error);
      alert(`Failed to ${type} business. Check console for details.`);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-area" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
        <Topbar pageTitle="Businesses" subtitle={`${businesses.length} businesses on the platform.`}>
          <div className="logs-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, type or city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="filter-btn"
            onClick={openCreateModal}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Add Business
          </button>
        </Topbar>

        <main className="dashboard-content-wrapper">
          <div className="cust-stat-section">
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

          <div className="chart-card" style={{ padding: "1.25rem 1.5rem" }}>
            <h3 className="chart-title" style={{ color: "#1e1b4b", fontSize: "1.1rem", margin: "0 0 1rem" }}>
              Business Directory
            </h3>

            <div className="table-responsive">
              {isLoading ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
                  <Loader text="Loading businesses..." />
                </div>
              ) : (
                <table className="customers-table logs-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
                      <th>City / Country</th>
                      <th>Status</th>
                      <th>Verified</th>
                      <th>Subscription</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? (
                      filtered.map((b) => {
                        const sub = subscriptionByBusinessId[b.id];
                        return (
                          <tr key={b.id}>
                            <td style={{ fontWeight: 600, color: "#1e293b" }}>{b.name}</td>
                            <td>{b.type || "—"}</td>
                            <td>{[b.city, b.country].filter(Boolean).join(", ") || "—"}</td>
                            <td>
                              <span className={`log-tag ${b.isActive ? "tag-status-resolved" : "tag-status-escalated"}`}>
                                {b.isActive ? "Active" : "Suspended"}
                              </span>
                            </td>
                            <td>
                              <span className={`log-tag ${b.isVerified ? "tag-status-resolved" : "tag-unassigned"}`}>
                                {b.isVerified ? "Verified" : "Unverified"}
                              </span>
                            </td>
                            <td>
                              {sub ? (
                                <span>
                                  {sub.planName} · {sub.isActive ? "Active" : "Inactive"}
                                  {sub.endDate && ` · exp. ${formatDate(sub.endDate)}`}
                                </span>
                              ) : (
                                <span style={{ color: "#94a3b8" }}>No subscription</span>
                              )}
                            </td>
                            <td>{formatDate(b.createdAt)}</td>
                            <td>
                              <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                                <button className="log-view-btn" onClick={() => openEditModal(b)}>
                                  Edit
                                </button>
                                {b.isActive ? (
                                  <button
                                    className="log-view-btn"
                                    onClick={() => setConfirmAction({ type: "suspend", business: b })}
                                  >
                                    Suspend
                                  </button>
                                ) : (
                                  <button
                                    className="log-view-btn"
                                    onClick={() => setConfirmAction({ type: "activate", business: b })}
                                  >
                                    Activate
                                  </button>
                                )}
                                <button
                                  className="log-view-btn"
                                  onClick={() => setConfirmAction({ type: "delete", business: b })}
                                >
                                  Delete
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                          No businesses match your search.
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

      {/* Add / Edit Business Modal */}
      {showFormModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "560px", width: "100%" }}>
            <h3>{editingBusiness ? "Edit Business" : "Add Business"}</h3>
            {!editingBusiness && (
              <p style={{ fontSize: "0.85rem", color: "#64748b" }}>
                This creates the business record only. It will not have an Owner account attached
                automatically — the Owner still needs to sign up separately for now.
              </p>
            )}
            {formError && <div className="form-error-message">{formError}</div>}
            <form onSubmit={handleFormSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <div className="form-group">
                  <label>Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Type *</label>
                  <input
                    value={form.type}
                    placeholder="e.g. Restaurant"
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Address *</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Phone *</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>City</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Country</label>
                  <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Cuisine Type</label>
                  <input
                    value={form.cuisineType}
                    placeholder="e.g. Italian"
                    onChange={(e) => setForm({ ...form, cuisineType: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Price Range</label>
                  <input
                    value={form.priceRange}
                    placeholder="e.g. $$"
                    onChange={(e) => setForm({ ...form, priceRange: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowFormModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-confirm-btn" disabled={isSaving}>
                  {isSaving ? "Saving..." : editingBusiness ? "Save Changes" : "Create Business"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Suspend/Activate/Delete Modal */}
      {confirmAction && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {confirmAction.type === "suspend" && "Suspend Business"}
              {confirmAction.type === "activate" && "Activate Business"}
              {confirmAction.type === "delete" && "Delete Business"}
            </h3>
            <p>
              {confirmAction.type === "delete"
                ? `This permanently deletes "${confirmAction.business.name}" and cannot be undone.`
                : `Are you sure you want to ${confirmAction.type} "${confirmAction.business.name}"?`}
            </p>
            <div className="modal-actions">
              <button className="modal-cancel-btn" onClick={() => setConfirmAction(null)}>
                Cancel
              </button>
              <button className="modal-confirm-btn" onClick={runConfirmAction}>
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBusinessesPage;
