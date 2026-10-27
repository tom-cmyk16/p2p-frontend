import { Navigate, Route, Routes } from "react-router-dom";
import { useAuthContext } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import AdminDashboardPage from "./features/admin/pages/AdminDashboardPage";
import AdminReportsPage from "./features/admin/pages/AdminReportsPage";
import AdminUserManagementPage from "./features/admin/pages/AdminUserManagementPage";
import AdminContentManagementPage from "./features/admin/pages/AdminContentManagementPage";
import AdminPackageManagementPage from "./features/admin/pages/AdminPackageManagementPage";
import ChatPage from "./features/chat/pages/ChatPage";
import LoginPage from "./features/auth/pages/LoginPage";
import RegisterPage from "./features/auth/pages/RegisterPage";
import ForgotPasswordPage from "./features/auth/pages/ForgotPasswordPage";
import ResetPasswordPage from "./features/auth/pages/ResetPasswordPage";
import ProfilePage from "./features/profile/pages/ProfilePage";
import QuizPage from "./features/quiz/pages/QuizPage";
import QuizResultPage from "./features/quiz/pages/QuizResultPage";
import RatingPage from "./features/ratings/pages/RatingPage";
import ReportPage from "./features/reports/pages/ReportPage";
import TutorApplicationPage from "./features/tutorApplication/pages/TutorApplicationPage";
import TutorApplicationsPage from "./features/admin/pages/TutorApplicationsPage";
import TutorListPage from "./features/tutors/pages/TutorListPage";
import TutorDetailPage from "./features/tutors/pages/TutorDetailPage";
import TutorDashboardPage from "./features/tutor-portal/pages/TutorDashboardPage";
import TutorChatPage from "./features/tutor-portal/pages/TutorChatPage";
import TutorSchedulePage from "./features/tutor-portal/pages/TutorSchedulePage";
import TutorRatingsPage from "./features/tutor-portal/pages/TutorRatingsPage";
import TutorProfilePage from "./features/tutor-portal/pages/TutorProfilePage";
import StudentDashboardPage from "./features/student/pages/StudentDashboardPage";
import StudentSchedulePage from "./features/scheduling/pages/StudentSchedulePage";
import SessionChatPage from "./features/scheduling/pages/SessionChatPage";
import StudentPackagesPage from "./features/payments/pages/StudentPackagesPage";
import PaymentResultPage from "./features/payments/pages/PaymentResultPage";
import AdminRevenuePage from "./features/admin/pages/AdminRevenuePage";
import PortalLayout from "./layouts/PortalLayout";

const portalPage = (children, requiredRole, requireApprovedTutor = false) => (
  <ProtectedRoute requiredRole={requiredRole} requireApprovedTutor={requireApprovedTutor}>
    <PortalLayout>{children}</PortalLayout>
  </ProtectedRoute>
);

export default function App() {
  const { user, isLoading } = useAuthContext();
  const home = isLoading
    ? "/login"
    : !user
      ? "/login"
      : user.role === "ADMIN"
      ? "/admin"
      : user.role === "TUTOR"
        ? user.status === "APPROVED"
          ? "/tutor-portal"
          : "/tutor-application"
        : "/student";

  if (isLoading) {
    return <div className="flex min-h-screen items-center justify-center bg-white text-sm text-slate-600">Loading your account...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={home} replace />} />
      <Route path="/login" element={user ? <Navigate to={home} replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to={home} replace /> : <RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/student" element={portalPage(<StudentDashboardPage />, "STUDENT")} />
      <Route path="/student/schedule" element={portalPage(<StudentSchedulePage />, "STUDENT")} />
      <Route path="/student/packages" element={portalPage(<StudentPackagesPage />, "STUDENT")} />
      <Route path="/student/packages/payment-result" element={portalPage(<PaymentResultPage />, "STUDENT")} />
      <Route path="/payment/success" element={portalPage(<PaymentResultPage />, "STUDENT")} />
      <Route path="/student/:tutorId" element={portalPage(<TutorDetailPage />, "STUDENT")} />
      <Route path="/sessions/:sessionId" element={portalPage(<SessionChatPage />)} />
      <Route path="/chat/new/:tutorId" element={portalPage(<ChatPage />)} />
      <Route path="/chat/:conversationId" element={portalPage(<ChatPage />)} />
      <Route path="/profile" element={portalPage(<ProfilePage />)} />
      <Route path="/tutor-portal" element={portalPage(<TutorDashboardPage />, "TUTOR", true)} />
      <Route path="/tutor-portal/chat" element={portalPage(<TutorChatPage />, "TUTOR", true)} />
      <Route path="/tutor-portal/chat/:conversationId" element={portalPage(<TutorChatPage />, "TUTOR", true)} />
      <Route path="/tutor-portal/schedule" element={portalPage(<TutorSchedulePage />, "TUTOR", true)} />
      <Route path="/tutor-portal/ratings" element={portalPage(<TutorRatingsPage />, "TUTOR", true)} />
      <Route path="/tutor-portal/profile" element={portalPage(<TutorProfilePage />, "TUTOR", true)} />
      <Route path="/quiz" element={portalPage(<QuizPage />, "STUDENT")} />
      <Route path="/student/quizzes" element={portalPage(<QuizPage />, "STUDENT")} />
      <Route path="/quiz/results" element={portalPage(<QuizResultPage />, "STUDENT")} />
      <Route path="/student/quizzes/results" element={portalPage(<QuizResultPage />, "STUDENT")} />
      <Route path="/rating/:conversationId" element={portalPage(<RatingPage />, "STUDENT")} />
      <Route path="/reports" element={portalPage(<ReportPage />)} />
      <Route path="/tutor-application" element={portalPage(<TutorApplicationPage />, "TUTOR")} />
      <Route path="/admin" element={portalPage(<AdminDashboardPage />, "ADMIN")} />
      <Route path="/admin/tutor-applications" element={portalPage(<TutorApplicationsPage />, "ADMIN")} />
      <Route path="/admin/reports" element={portalPage(<AdminReportsPage />, "ADMIN")} />
      <Route path="/admin/users" element={portalPage(<AdminUserManagementPage />, "ADMIN")} />
      <Route path="/admin/content" element={portalPage(<AdminContentManagementPage />, "ADMIN")} />
      <Route path="/admin/packages" element={portalPage(<AdminPackageManagementPage />, "ADMIN")} />
      <Route path="/admin/revenue" element={portalPage(<AdminRevenuePage />, "ADMIN")} />
      <Route path="*" element={<Navigate to={user ? home : "/login"} replace />} />
    </Routes>
  );
}
