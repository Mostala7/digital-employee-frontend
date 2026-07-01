import apiClient from "./apiClient";

export const fetchDashboardOverview = async (period = "30d") => {
  const response = await apiClient.get(`/api/Dashboard/overview?period=${period}`);
  return response.data;
};

export const fetchBusinessInteractions = async (businessId) => {
  if (!businessId) return [];
  const response = await apiClient.get(`/api/Interaction/business/${businessId}`);
  return response.data;
};
