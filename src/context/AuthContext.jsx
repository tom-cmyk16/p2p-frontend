import { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "../lib/apiClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const response = await apiClient.get("/auth/test-auth");
    const authenticatedUser = response.data.user;
    if (!authenticatedUser?.id || !authenticatedUser?.role) {
      throw new Error("The authentication response did not include a valid user.");
    }
    localStorage.setItem("user", JSON.stringify(authenticatedUser));
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  useEffect(() => {
    let isMounted = true;

    const restoreSession = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (!token || !storedUser) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (isMounted) setIsLoading(false);
        return;
      }

      try {
        const response = await apiClient.get("/auth/test-auth");
        const authenticatedUser = response.data.user;
        if (!authenticatedUser?.id || !authenticatedUser?.role) {
          throw new Error("The authentication response did not include a valid user.");
        }
        localStorage.setItem("user", JSON.stringify(authenticatedUser));
        if (isMounted) setUser(authenticatedUser);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = (userData, token) => {
    if (!userData?.id || !userData?.role || !token) {
      throw new Error("An authenticated user and token are required.");
    }
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const updateUser = (userData) => {
    setUser((currentUser) => {
      if (!currentUser) return null;
      const updatedUser = { ...currentUser, ...userData };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, updateUser, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be used inside <AuthProvider>");
  return ctx;
}
