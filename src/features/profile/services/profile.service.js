import apiClient from "../../../lib/apiClient";

export const profileService = {
  getMyProfile: () => apiClient.get("/users/me").then((response) => response.data),
  updateMyProfile: (payload) =>
    apiClient.patch("/users/me", payload).then((response) => response.data),
  changePassword: (payload) =>
    apiClient.patch("/users/me/password", payload).then((response) => response.data),
};
