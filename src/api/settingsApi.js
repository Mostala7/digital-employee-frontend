import apiClient from "./apiClient";

export const fetchBusinessSettings = async (businessId) => {
  const [businessRes, settingsRes, integrationRes, subscriptionRes] =
    await Promise.all([
      apiClient
        .get(`/api/Business/${businessId}`)
        .catch(() => ({ data: null })),
      apiClient
        .get(`/api/Setting/business/${businessId}`)
        .catch(() => ({ data: null })),
      apiClient
        .get(`/api/Integration/business/${businessId}`)
        .catch(() => ({ data: [] })),
      apiClient
        .get(`/api/Subscription/business/${businessId}/active`)
        .catch(() => ({ data: null })),
    ]);

  return {
    business: businessRes.data,
    settings: settingsRes.data,
    integrations: integrationRes.data,
    subscription: subscriptionRes.data,
  };
};

export const fetchUserProfile = async (userId) => {
  try {
    const res = await apiClient.get(`/api/User/${userId}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching user profile", err);
    return null;
  }
};

export const updateBusinessProfile = async (businessId, payload) => {
  const res = await apiClient.put(`/api/Business/${businessId}`, payload);
  return res.data;
};

export const updateSettings = async (businessId, payload) => {
  const res = await apiClient.put(
    `/api/Setting/business/${businessId}`,
    payload,
  );
  return res.data;
};

export const updateUserProfile = async (userId, payload) => {
  const res = await apiClient.put(`/api/User/${userId}`, payload);
  return res.data;
};

export const connectIntegration = async (payload) => {
  const res = await apiClient.post(`/api/Integration/connect`, payload);
  return res.data;
};

export const deleteIntegration = async (integrationId) => {
  const res = await apiClient.delete(`/api/Integration/${integrationId}`);
  return res.data;
};

export const createBusiness = async (payload) => {
  const res = await apiClient.post(`/api/Business`, payload);
  return res.data;
};
