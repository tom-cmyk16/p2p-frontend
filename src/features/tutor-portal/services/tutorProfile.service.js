import apiClient from "../../../lib/apiClient";

export const tutorProfileService = {
  getMyProfile: () =>
    apiClient.get("/tutors/me").then((response) => response.data),
  updateMyProfile: (payload) =>
    apiClient.patch("/tutors/me", payload).then((response) => response.data),
  getSubjects: () =>
    apiClient.get("/subjects").then((response) => response.data),
};
