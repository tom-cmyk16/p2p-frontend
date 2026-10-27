import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { authService } from "../services/auth.service";
import AuthSplitLayout from "../components/AuthSplitLayout";
import NotificationAlert from "../../../components/common/NotificationAlert";

export default function ForgotPasswordPage() {
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [devResetUrl, setDevResetUrl] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setDevResetUrl(null);
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword({
        phoneOrEmail: phoneOrEmail.trim(),
      });
      setSuccessMessage(
        response?.message ||
          "If an account with that email exists, password reset instructions have been sent."
      );
      if (response?.devResetUrl) {
        setDevResetUrl(response.devResetUrl);
      }
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Unable to process password reset request. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      activeTab="forgot"
      title="Reset your password"
      subtitle="Enter your registered email and receive a secure recovery link."
    >
      {/* Error Alert */}
      {error && (
        <NotificationAlert
          type="error"
          message={error}
          duration={5000}
          onDismiss={() => setError(null)}
          className="mb-6"
        />
      )}

      {/* Success Notification */}
      {successMessage && (
        <NotificationAlert
          type="success"
          message={
            <div className="space-y-2">
              <p>{successMessage}</p>
              {devResetUrl && (
                <div className="rounded-xl border border-emerald-200 bg-white p-3 text-xs">
                  <span className="font-bold text-emerald-800">
                    Direct Dev Reset Link:
                  </span>
                  <a
                    href={devResetUrl}
                    className="mt-1 flex items-center gap-1 break-all text-[#0B3C42] font-semibold underline hover:text-[#062428]"
                  >
                    <span>Click here to reset your password</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </a>
                </div>
              )}
            </div>
          }
          duration={5000}
          onDismiss={() => setSuccessMessage(null)}
          className="mb-6"
        />
      )}

      {!successMessage && (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="phoneOrEmail"
              className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5"
            >
              Registered Email or Phone Number
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Mail className="h-4 w-4" />
              </div>
              <input
                id="phoneOrEmail"
                type="text"
                autoComplete="email"
                required
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                placeholder="e.g. student@example.com "
                className="block w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0B3C42] focus:ring-4 focus:ring-[#0B3C42]/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B3C42] py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#0B3C42]/20 transition-all duration-200 hover:bg-[#082e33] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Sending link...</span>
              </>
            ) : (
              <>
                <span>Send Password Reset Link</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>
      )}

      {/* Back to Login link */}
      <div className="pt-6 text-center text-xs sm:text-sm">
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 font-bold text-[#0B3C42] hover:text-[#062428] hover:underline transition"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Sign in</span>
        </Link>
      </div>
    </AuthSplitLayout>
  );
}
