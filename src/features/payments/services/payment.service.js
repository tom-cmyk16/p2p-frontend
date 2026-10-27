import apiClient from "../../../lib/apiClient";

export const paymentService = {
  getOffers: () => apiClient.get("/payments/offers").then((response) => response.data),
  getEligibleTutors: (params) =>
    apiClient.get("/payments/tutors", { params }).then((response) => response.data),
  createCheckout: (payload) =>
    apiClient.post("/payments/checkout", payload).then((response) => response.data),
  verifyPayment: (txRef) =>
    apiClient.get(`/payments/verify/${encodeURIComponent(txRef)}`).then((response) => response.data),
  getPayment: (txRef) =>
    apiClient.get(`/payments/${encodeURIComponent(txRef)}`).then((response) => response.data),
  getMyPayments: () => apiClient.get("/payments/mine").then((response) => response.data),
  getMyAccess: () => apiClient.get("/learning/access").then((response) => response.data),
  getRevenueDashboard: (params = {}) =>
    apiClient.get("/admin/revenue", { params }).then((response) => response.data),
  getManagedOffers: () =>
    apiClient.get("/admin/revenue/offers").then((response) => response.data),
  saveOffer: (payload) => apiClient.put("/admin/revenue/offers", payload).then((response) => response.data),
  saveCommission: (commissionPercent) =>
    apiClient.put("/admin/revenue/commission", { commissionPercent }).then((response) => response.data),
  settlePayout: (payoutId, payoutReference) =>
    apiClient
      .patch(`/admin/revenue/payouts/${encodeURIComponent(payoutId)}/paid`, { payoutReference })
      .then((response) => response.data),
};
