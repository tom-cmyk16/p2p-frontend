import apiClient from "../../../lib/apiClient";

const saveToken = (response) => {
  const { token, user } = response.data;

  if (!token || !user?.id || !user?.role) {
    throw new Error("The authentication response did not include a valid user and token.");
  }

  localStorage.setItem("token", token);
  return response.data;
};

export const authService = {
  register: (payload) =>
    apiClient.post("/auth/register", payload).then((response) => response.data),
  login: (payload) =>
    apiClient.post("/auth/login", payload).then(saveToken),
  forgotPassword: (payload) =>
    apiClient.post("/auth/forgot-password", payload).then((response) => response.data),
  resetPassword: (payload) =>
    apiClient.post("/auth/reset-password", payload).then((response) => response.data),
};
