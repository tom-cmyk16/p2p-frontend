import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { useAuthContext } from "../../../context/AuthContext";

export function useAuth() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const {
    login: setAuthState,
    logout: clearAuthState,
  } = useAuthContext();

  const getErrorMessage = (err, fallback) => {
    const apiError = err.response?.data?.error;
    const details = Array.isArray(apiError?.details)
      ? apiError.details
          .map((detail) =>
            detail?.field && detail?.message
              ? `${detail.field}: ${detail.message}`
              : detail?.message
          )
          .filter(Boolean)
      : [];

    return [apiError?.message || err.message || fallback, ...details].join(" ");
  };

  const register = async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.register(payload);
      if (data.user?.role === "STUDENT" || data.user?.role === "TUTOR") {
        navigate("/login", {
          replace: true,
          state: {
            message: data.user.role === "TUTOR"
              ? "Your tutor account has been created. Sign in to complete your application."
              : "Your student account has been created. Sign in to continue.",
          },
        });
      } else {
        throw new Error("The registration response included an unsupported account role.");
      }
      return data;
    } catch (err) {
      setError(getErrorMessage(err, "Registration failed"));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (payload) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await authService.login(payload);
      if (!data.user || !data.token) {
        throw new Error("The login response did not include an authenticated user and token.");
      }
      setAuthState(data.user, data.token);
      navigate(
        data.user?.role === "ADMIN"
          ? "/admin"
          : data.user?.role === "TUTOR"
            ? data.user.status === "APPROVED"
              ? "/tutor-portal"
              : "/tutor-application"
            : "/student"
      );
      return data;
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthState();
    navigate("/login", { replace: true });
  };

  return { register, login, logout, isLoading, error };
}