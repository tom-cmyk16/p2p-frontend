import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { authService } from "../services/auth.service";
import AuthSplitLayout from "../components/AuthSplitLayout";
import NotificationAlert from "../../../components/common/NotificationAlert";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!token) {
      setError(
        "No reset token provided. Please request a new password reset link."
      );
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match. Please ensure both passwords match.");
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        token,
        newPassword,
      });
      setSuccess(true);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to reset password. The link may have expired."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthSplitLayout
      activeTab="reset"
      title="Create new password"
      subtitle="Set a secure, strong password to regain access to your account."
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
      {success ? (
        <div className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 text-xs sm:text-sm text-emerald-900 shadow-xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-emerald-950">
                Password Successfully Updated!
              </h3>
              <p className="mt-1 text-slate-600">
                You can now log in with your updated credentials.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#0B3C42] py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#0B3C42]/20 hover:bg-[#082e33] transition"
          >
            <span>Sign In Now</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <label
              htmlFor="newPassword"
              className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
            >
              New Password (minimum 8 characters)
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="newPassword"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter at least 8 characters"
                className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0B3C42] focus:ring-4 focus:ring-[#0B3C42]/10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
            >
              Confirm New Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <Lock className="h-4 w-4" />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter your new password"
                className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0B3C42] focus:ring-4 focus:ring-[#0B3C42]/10"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !token}
            className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#0B3C42] py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#0B3C42]/20 transition-all duration-200 hover:bg-[#082e33] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Updating password...</span>
              </>
            ) : (
              <>
                <span>Update Password</span>
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
