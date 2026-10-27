import apiClient from "../../../lib/apiClient";

export const tutorRatingsService = {
  getRatings: (tutorId) =>
    apiClient
      .get(`/tutors/${encodeURIComponent(tutorId)}`)
      .then((response) => response.data),
};
