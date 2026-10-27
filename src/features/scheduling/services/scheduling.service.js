import apiClient from "../../../lib/apiClient";

export const schedulingService = {
  getAvailability: (params = {}) =>
    apiClient.get("/scheduling/availability", { params }).then((res) => res.data),
  createAvailability: (payload) =>
    apiClient.post("/scheduling/availability", payload).then((res) => res.data),
  deleteAvailability: (availabilityId) =>
    apiClient.delete(`/scheduling/availability/${encodeURIComponent(availabilityId)}`),
  getSessions: () =>
    apiClient.get("/scheduling/sessions").then((res) => res.data),
  bookWeeklySessions: (payload) =>
    apiClient.post("/scheduling/sessions/book", payload).then((res) => res.data),
  getGoogleStatus: () =>
    apiClient.get("/scheduling/google/status").then((res) => res.data),
  connectGoogleCalendar: () =>
    apiClient.post("/scheduling/google/connect").then((res) => res.data),
  getSessionMessages: (sessionId, params = {}) =>
    apiClient.get(`/scheduling/sessions/${encodeURIComponent(sessionId)}/messages`, { params })
      .then((res) => res.data),
  sendSessionMessage: (sessionId, textContent) =>
    apiClient
      .post(`/scheduling/sessions/${encodeURIComponent(sessionId)}/messages`, { textContent })
      .then((res) => res.data),
  sendSessionResource: (sessionId, file) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiClient
      .post(`/scheduling/sessions/${encodeURIComponent(sessionId)}/messages/file`, formData)
      .then((res) => res.data);
  },
  getAssignedStudents: () =>
    apiClient.get("/scheduling/assigned-students").then((res) => res.data),
  mentorScheduleSessions: (payload) =>
    apiClient.post("/scheduling/sessions/mentor-schedule", payload).then((res) => res.data),
  assignMentor: (payload) =>
    apiClient.post("/scheduling/assign-mentor", payload).then((res) => res.data),
};
