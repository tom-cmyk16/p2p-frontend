import { Navigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export default function ProtectedRoute({ children, requiredRole, requireApprovedTutor = false }) {
  const { user, isLoading } = useAuthContext();

  if (isLoading) return <p>Loading...</p>;
  if (!user || !localStorage.getItem("token")) return <Navigate to="/login" replace />;
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }
  if (requireApprovedTutor && user.role === "TUTOR" && user.status !== "APPROVED") {
    return <Navigate to="/tutor-application" replace />;
  }
  return children;
}
