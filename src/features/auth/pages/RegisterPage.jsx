import { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  GraduationCap,
  Users,
  MapPin,
  ArrowRight,
  AlertCircle,
  Loader2,
  Info,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import AuthSplitLayout from "../components/AuthSplitLayout";
import NotificationAlert from "../../../components/common/NotificationAlert";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [phoneOrEmail, setPhoneOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("STUDENT");
  const [gradeLevel, setGradeLevel] = useState("GRADE_12");
  const [regionId, setRegionId] = useState("");
  const { register, isLoading, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneOrEmail.trim() || !password) return;
    await register({
      fullName: fullName.trim(),
      phoneOrEmail: phoneOrEmail.trim(),
      password,
      role,
      ...(role === "STUDENT" && { gradeLevel }),
      ...(regionId.trim() && { regionId: regionId.trim() }),
    });
  };

  return (
    <AuthSplitLayout
      activeTab="register"
      title="Create your account"
      subtitle="Join the peer learning community and start preparing for your exams."
    >
      {/* Error Alert */}
      {error && (
        <NotificationAlert
          type="error"
          message={error}
          duration={5000}
          className="mb-6"
        />
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role Segmented Selection */}
        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-800 mb-2">
            I want to join as a
          </label>
          <div className="grid grid-cols-2 gap-3">
            {/* Student Role Card */}
            <button
              type="button"
              onClick={() => setRole("STUDENT")}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer ${
                role === "STUDENT"
                  ? "border-[#0B3C42] bg-[#0B3C42]/5 text-[#0B3C42] shadow-xs ring-2 ring-[#0B3C42]/15"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  role === "STUDENT"
                    ? "bg-[#0B3C42] text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <GraduationCap className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold leading-tight">
                  Student
                </p>
                <p className="text-[11px] text-slate-500">Exam preparation</p>
              </div>
            </button>

            {/* Tutor Role Card */}
            <button
              type="button"
              onClick={() => setRole("TUTOR")}
              className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all duration-200 cursor-pointer ${
                role === "TUTOR"
                  ? "border-[#0B3C42] bg-[#0B3C42]/5 text-[#0B3C42] shadow-xs ring-2 ring-[#0B3C42]/15"
                  : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  role === "TUTOR"
                    ? "bg-[#0B3C42] text-white"
                    : "bg-slate-100 text-slate-500"
                }`}
              >
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold leading-tight">
                  Tutor
                </p>
                <p className="text-[11px] text-slate-500">Mentor students</p>
              </div>
            </button>
          </div>

          {role === "TUTOR" && (
            <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900">
              <Info className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <p className="leading-relaxed">
                Tutor applications undergo identity and academic credential review by administrators before live session access is unlocked.
              </p>
            </div>
          )}
        </div>

        {/* Full Name */}
        <div>
          <label
            htmlFor="fullName"
            className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
          >
            Full Name
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <User className="h-4 w-4" />
            </div>
            <input
              id="fullName"
              type="text"
              autoComplete="name"
              required
              minLength={1}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="e.g. Abebe Bikila"
              className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0B3C42] focus:ring-4 focus:ring-[#0B3C42]/10"
            />
          </div>
        </div>

        {/* Phone or Email */}
        <div>
          <label
            htmlFor="phoneOrEmail"
            className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
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
              placeholder="e.g. abebe@example.com "
              className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0B3C42] focus:ring-4 focus:ring-[#0B3C42]/10"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label
            htmlFor="password"
            className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
          >
            Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
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

        {/* Grade Level (for Students) */}
        {role === "STUDENT" && (
          <div>
            <label
              htmlFor="gradeLevel"
              className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
            >
              Grade Level
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                <GraduationCap className="h-4 w-4" />
              </div>
              <select
                id="gradeLevel"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 outline-none transition-all duration-200 focus:border-[#0B3C42] focus:ring-4 focus:ring-[#0B3C42]/10 cursor-pointer"
              >
                <option value="GRADE_8">Grade 8 (Regional Exam)</option>
                <option value="GRADE_9">Grade 9</option>
                <option value="GRADE_10">Grade 10</option>
                <option value="GRADE_11">Grade 11</option>
                <option value="GRADE_12">Grade 12 (National Entrance Exam)</option>
              </select>
            </div>
          </div>
        )}

        {/* Region ID (Optional) */}
        <div>
          <label
            htmlFor="regionId"
            className="block text-xs sm:text-sm font-bold text-slate-800 mb-1"
          >
            Region / City ID{" "}
            <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <MapPin className="h-4 w-4" />
            </div>
            <input
              id="regionId"
              type="text"
              value={regionId}
              onChange={(e) => setRegionId(e.target.value)}
              placeholder="e.g. Addis Ababa, Oromia, Amhara"
              className="block w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-[#0B3C42] focus:ring-4 focus:ring-[#0B3C42]/10"
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#0B3C42] py-3.5 px-4 text-xs sm:text-sm font-bold text-white shadow-md shadow-[#0B3C42]/20 transition-all duration-200 hover:bg-[#082e33] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Creating your account...</span>
            </>
          ) : (
            <>
              <span>
                {role === "TUTOR"
                  ? "Register as Tutor"
                  : "Create Student Account"}
              </span>
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        {/* Bottom Toggle Note */}
        <div className="pt-2 text-center text-xs sm:text-sm text-slate-600">
          <span>Already have an account? </span>
          <Link
            to="/login"
            className="font-bold text-[#0B3C42] hover:text-[#062428] hover:underline transition"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthSplitLayout>
  );
}