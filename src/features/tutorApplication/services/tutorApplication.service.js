import apiClient from "../../../lib/apiClient";

export const tutorApplicationService = {
  getMyApplication: () => apiClient.get("/tutor-applications/me").then((res) => res.data),
  submitApplication: (payload) => apiClient.post("/tutor-applications", payload).then((res) => res.data),
  getDocument: (applicationId, documentId) =>
    apiClient
      .get(
        `/tutor-applications/${applicationId}/documents/${documentId}`,
        { responseType: "blob" },
      )
      .then((res) => res.data),
  uploadDocument: (applicationId, file, documentType) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("documentType", documentType);
    return apiClient
      .post(`/tutor-applications/${applicationId}/documents`, formData)
      .then((res) => res.data);
  },
};
