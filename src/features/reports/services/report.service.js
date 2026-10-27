import apiClient from "../../../lib/apiClient";

export const reportService = {
  // targetType: "MESSAGE" | "CONVERSATION" | "USER_PROFILE"
  // targetId: the id of whichever one is being reported
  submitReport: (payload) => apiClient.post("/reports", payload).then((res) => res.data),
};
