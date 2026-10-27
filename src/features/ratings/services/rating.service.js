import apiClient from "../../../lib/apiClient";

export const ratingService = {
  getRating: (conversationId) =>
    apiClient
      .get(`/conversations/${encodeURIComponent(conversationId)}/rating`)
      .then((res) => res.data),
  submitRating: (conversationId, payload) =>
    apiClient
      .post(`/conversations/${encodeURIComponent(conversationId)}/rating`, payload)
      .then((res) => res.data),
};
