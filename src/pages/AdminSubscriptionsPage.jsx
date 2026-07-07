import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import Loader from "../components/Loader";
import { Search, CreditCard, CheckCircle, XCircle, Clock, Plus } from "lucide-react";
import "./LogsPage.css";
import "./TicketsPage.css";
import "./CustomersPage.css";
import "./AgentPage.css"; // reuse .form-group styling for modals
import apiClient from "../api/apiClient";

const PLAN_TIERS = ["Lite", "Pro", "Enterprise"];

const formatDate = (isoString) => {
  if (!isoString) return "—";
  return new Date(isoString).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" });
};

const isExpiringSoon = (endDate) => {
  if (!endDate) return false;
  const days = (new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24);
  return days >= 0 && days <= 7;
};

const isExpired = (endDate) => {
  if (!endDate) return false;
  return new Date(endDate) < new Date();
};

const CREATE_FORM_DEFAULT = { businessId: "", planName: "Lite", price: "" };

const AdminSubscriptionsPage = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState(CREATE_FORM_DEFAULT);
  const [createError, setCreateError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [renewTarget, setRenewTarget] = useState(null); // subscription being upgraded/downgraded
  const [renewForm, setRenewForm] = useState({ planName: "", price: "", endDate: "" });
  const [renewError, setRenewError] = useState("");

  const [confirmAction, setConfirmAction] = useState(null); // { type: 'activate'|'deactivate'|'delete', subscription }

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [subsRes, businessesRes] = await Promise.all([
        apiClient.get("/api/Subscription"),
        apiClient.get("/api/Business").catch(() => ({ data: [] })),
      ]);
      setSubscriptions(subsRes.data || []);
      setBusinesses(businessesRes.data || []);
    } catch (error) {
      console.error("Failed to fetch subscriptions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filtered = subscriptions.filter((s) => {
    const q = searchQuery.toLowerCase();
    return q === "" || s.businessName?.toLowerCase().includes(q) || s.planName?.toLowerCase().includes(q);
  });

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.isActive).length,
    inactive: subscriptions.filter((s) => !s.isActive).length,
    expiringSoon: subscriptions.filter((s) => isExpiringSoon(s.endDate)).length,
  };

  const STAT_CARDS = [
    { label: "Total Subscriptions", value: stats.total, Icon: CreditCard },
    { label: "Active", value: stats.active, Icon: CheckCircle },
    { label: "Inactive", value: stats.inactive, Icon: XCircle },
    { label: "Expiring Soon (7d)", value: stats.expiringSoon, Icon: Clock },
  ];

  const openCreateModal = () => {
    setCreateForm(CREATE_FORM_DEFAULT);
    setCreateError("");
    setShowCreateModal(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");
    if (!createForm.businessId || !createForm.planName || !createForm.price) {
      setCreateError("Business, plan and price are all required.");
      return;
    }
    setIsSaving(true);
    try {
      await apiClient.post("/api/Subscription", {
        businessId: createForm.businessId,
        planName: createForm.planName,
        price: parseFloat(createForm.price),
      });
      setShowCreateModal(false);
      await fetchData();
    } catch (error) {
      setCreateError(error.response?.data?.message || error.response?.data?.Message || "Failed to create subscription.");
    } finally {
      setIsSaving(false);
    }
  };

  const openRenewModal = (subscription) => {
    setRenewTarget(subscription);
    setRenewForm({
      planName: subscription.planName || "Lite",
      price: subscription.price ?? "",
      endDate: subscription.endDate ? subscription.endDate.slice(0, 10) : "",
    });
    setRenewError("");
  };

  const handleRenewSubmit = async (e) => {
    e.preventDefault();
    setRenewError("");
    setIsSaving(true);
    try {
      await apiClient.post(`/api/Subscription/${renewTarget.id}/renew`, {
        subscriptionId: renewTarget.id,
        newStartDate: new Date().toISOString(),
        newEndDate: renewForm.endDate ? new Date(renewForm.endDate).toISOString() : null,
        newPlanName: renewForm.planName,
        newPrice: renewForm.price ? parseFloat(renewForm.price) : null,
        autoRenewEnabled: false,
      });
      setRenewTarget(null);
      await fetchData();
    } catch (error) {
      setRenewError(error.response?.data?.message || error.response?.data?.Message || "Failed to update subscription.");
    } finally {
      setIsSaving(false);
    }
  };

  const runConfirmAction = async () => {
    if (!confirmAction) return;
    const { type, subscription } = confirmAction;
    try {
      if (type === "activate") {
        await apiClient.post(`/api/Subscription/${subscription.id}/activate`);
      } else if (type === "deactivate") {
        await apiClient.post(`/api/Subscription/${subscription.id}/deactivate`);
      } else if (type === "delete") {
        await apiClient.delete(`/api/Subscription/${subscription.id}`);
      }
      setConfirmAction(null);
      await fetchData();
    } catch (error) {
      console.error(`Failed to ${type} subscription:`, error);
      alert(`Failed to ${type} subscription. Check console for details.`);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content-area" style={{ backgroundColor: "#f3f4f6", minHeight: "100vh" }}>
        <Topbar pageTitle="Subscriptions" subtitle={`${subscriptions.length} subscriptions across the platform.`}>
          <div className="logs-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by business or plan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button
            className="filter-btn"
            onClick={openCreateModal}
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Create Subscription
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
              Subscriptions
            </h3>

            <div className="table-responsive">
              {isLoading ? (
                <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
                  <Loader text="Loading subscriptions..." />
                </div>
              ) : (
                <table className="customers-table logs-table">
                  <thead>
                    <tr>
                      <th>Business</th>
                      <th>Plan</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length > 0 ? (
                      filtered.map((s) => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 600, color: "#1e293b" }}>{s.businessName}</td>
                          <td>
                            <span className="log-tag tag-status-active">{s.planName}</span>
                          </td>
                          <td>${Number(s.price).toFixed(2)}</td>
                          <td>
                            <span className={`log-tag ${s.isActive ? "tag-status-resolved" : "tag-status-escalated"}`}>
                              {s.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td>{formatDate(s.startDate)}</td>
                          <td
                            style={{
                              color: isExpired(s.endDate) ? "#dc2626" : isExpiringSoon(s.endDate) ? "#d97706" : "inherit",
                              fontWeight: isExpired(s.endDate) || isExpiringSoon(s.endDate) ? 600 : 400,
                            }}
                          >
                            {formatDate(s.endDate)}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                              <button className="log-view-btn" onClick={() => openRenewModal(s)}>
                                Upgrade/Downgrade
                              </button>
                              {s.isActive ? (
                                <button
                                  className="log-view-btn"
                                  onClick={() => setConfirmAction({ type: "deactivate", subscription: s })}
                                >
                                  Deactivate
                                </button>
                              ) : (
                                <button
                                  className="log-view-btn"
                                  onClick={() => setConfirmAction({ type: "activate", subscription: s })}
                                >
                                  Activate
                                </button>
                              )}
                              <button
                                className="log-view-btn"
                                onClick={() => setConfirmAction({ type: "delete", subscription: s })}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" style={{ textAlign: "center", color: "#94a3b8", padding: "2rem" }}>
                          No subscriptions match your search.
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

      {/* Create Subscription Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px", width: "100%" }}>
            <h3>Create Subscription</h3>
            {createError && <div className="form-error-message">{createError}</div>}
            <form onSubmit={handleCreateSubmit}>
              <div className="form-group">
                <label>Business *</label>
                <select
                  value={createForm.businessId}
                  onChange={(e) => setCreateForm({ ...createForm, businessId: e.target.value })}
                >
                  <option value="">Select a business...</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Plan *</label>
                <select
                  value={createForm.planName}
                  onChange={(e) => setCreateForm({ ...createForm, planName: e.target.value })}
                >
                  {PLAN_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  value={createForm.price}
                  onChange={(e) => setCreateForm({ ...createForm, price: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="modal-confirm-btn" disabled={isSaving}>
                  {isSaving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upgrade / Downgrade Modal */}
      {renewTarget && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: "480px", width: "100%" }}>
            <h3>Upgrade / Downgrade — {renewTarget.businessName}</h3>
            {renewError && <div className="form-error-message">{renewError}</div>}
            <form onSubmit={handleRenewSubmit}>
              <div className="form-group">
                <label>Plan</label>
                <select
                  value={renewForm.planName}
                  onChange={(e) => setRenewForm({ ...renewForm, planName: e.target.value })}
                >
                  {PLAN_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Price</label>
                <input
                  type="number"
                  step="0.01"
                  value={renewForm.price}
                  onChange={(e) => setRenewForm({ ...renewForm, price: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>New End Date</label>
                <input
                  type="date"
                  value={renewForm.endDate}
                  onChange={(e) => setRenewForm({ ...renewForm, endDate: e.target.value })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="modal-cancel-btn" onClick={() => setRenewTarget(null)}>
                  Cancel
                </button>
                <button type="submit" className="modal-confirm-btn" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Activate/Deactivate/Delete Modal */}
      {confirmAction && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>
              {confirmAction.type === "activate" && "Activate Subscription"}
              {confirmAction.type === "deactivate" && "Deactivate Subscription"}
              {confirmAction.type === "delete" && "Delete Subscription"}
            </h3>
            <p>
              {confirmAction.type === "delete"
                ? `This permanently deletes the subscription for "${confirmAction.subscription.businessName}" and cannot be undone.`
                : `Are you sure you want to ${confirmAction.type} the subscription for "${confirmAction.subscription.businessName}"?`}
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

export default AdminSubscriptionsPage;
