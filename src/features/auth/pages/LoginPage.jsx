import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import AuthSplitLayout from "../components/AuthSplitLayout";
import NotificationAlert from "../../../components/common/NotificationAlert";

export default function LoginPage() {
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuth();
  const location = useLocation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneOrEmail.trim() || !password) return;
    await login({ phoneOrEmail: phoneOrEmail.trim(), password });
  };

  return (
    <AuthSplitLayout
      activeTab="login"
      title="Welcome back"
      subtitle="Enter your email and password to access your dashboard."
    >
      {/* Success Notification Message (e.g. from registration or password reset) */}
      {location.state?.message && (
        <NotificationAlert
          type="success"
          message={location.state.message}
          duration={5000}
          className="mb-6"
        />
      )}

      {/* Error Alert */}
      {error && (
        <NotificationAlert
          type="error"
          message={error}
          duration={5000}
          className="mb-6"
        />
      )}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Phone or Email Field */}
        <div>
          <label
            htmlFor="phoneOrEmail"
            className="block text-xs sm:text-sm font-bold text-slate-800 mb-1.5"
          >
             Email Address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="phoneOrEmail"
              type="text"
              autoComplete="username"
              required
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              placeholder="e.g. student@example.com"
              className="block w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0B3C42] focus:ring-4 focus:ring-[#0B3C42]/10"
            />
          </div>
        </div>

        {/* Password Field */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label
              htmlFor="password"
              className="block text-xs sm:text-sm font-bold text-slate-800"
            >
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-xs font-semibold text-[#0B3C42] hover:text-[#062428] hover:underline transition"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="block w-full rounded-xl border border-slate-300 bg-white py-3 pl-10 pr-11 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0B3C42] focus:ring-4 focus:ring-[#0B3C42]/10"
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

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#0B3C42] py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#0B3C42]/20 transition-all duration-200 hover:bg-[#082e33] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Signing in...</span>
            </>
          ) : (
            <>
              <span>Sign in to Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Bottom Toggle Note */}
        <div className="pt-2 text-center text-xs sm:text-sm text-slate-600">
          <span>Don't have an account yet? </span>
          <Link
            to="/register"
            className="font-bold text-[#0B3C42] hover:text-[#062428] hover:underline transition"
          >
            Create an account
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}