import apiClient from "../../../lib/apiClient";

export const tutorService = {
  getTutors: async (filters = {}) => {
    try {
      const response = await apiClient.get("/tutors", {
        params: filters,
        timeout: 8000,
      });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        const fallbackRes = await apiClient.get("/mentors", {
          params: filters,
          timeout: 8000,
        });
        return fallbackRes.data;
      }
      throw err;
    }
  },
  getMentors: async (filters = {}) => {
    try {
      const response = await apiClient.get("/mentors", {
        params: filters,
        timeout: 8000,
      });
      return response.data;
    } catch (err) {
      if (err.response?.status === 404 || !err.response) {
        const fallbackRes = await apiClient.get("/tutors", {
          params: filters,
          timeout: 8000,
        });
        return fallbackRes.data;
      }
      throw err;
    }
  },
  getTutorById: (tutorId) =>
    apiClient
      .get(`/tutors/${encodeURIComponent(tutorId)}`, { timeout: 8000 })
      .then((response) => response.data),
  getSubjects: () =>
    apiClient.get("/subjects", { timeout: 8000 }).then((response) => response.data),
};
