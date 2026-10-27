import { Link } from "react-router-dom";
import {
  GraduationCap,
  Sparkles,
  Video,
  BookOpenCheck,
  Star,
  Users,
  CheckCircle2,
} from "lucide-react";

export default function AuthSplitLayout({
  children,
  activeTab = "login",
  title,
  subtitle,
}) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white selection:bg-[#0B3C42]/10 selection:text-[#0B3C42]">
      {/* ============================================================ */}
      {/* LEFT SIDE: Clean, Minimalist Form Area (50% on Desktop)     */}
      {/* ============================================================ */}
      <section className="w-full lg:w-1/2 flex flex-col justify-between px-6 py-10 sm:px-12 md:px-16 lg:px-12 xl:px-20 min-h-screen">
        {/* Top Header / Mobile Brand Area */}
        <header className="flex items-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2.5 group transition"
            title="P2P Exam Prep"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0B3C42] text-white shadow-md shadow-[#0B3C42]/20 group-hover:scale-105 transition-transform">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg block leading-tight">
                P2P Exam Prep
              </span>
              <span className="text-[11px] font-medium text-slate-500 block">
                Peer Learning Platform
              </span>
            </div>
          </Link>
        </header>

        {/* Center Content: Form Area */}
        <main className="my-auto py-12 sm:py-16 w-full max-w-md mx-auto text-left flex-1 flex flex-col justify-center">
          {/* Segmented Switcher Tab (Sign In / Create Account) */}
          {activeTab && (activeTab === "login" || activeTab === "register") && (
            <div className="flex rounded-2xl bg-slate-100 p-1 mb-8 border border-slate-200/80 shadow-inner">
              <Link
                to="/login"
                className={`flex-1 text-center py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 ${
                  activeTab === "login"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className={`flex-1 text-center py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all duration-200 ${
                  activeTab === "register"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Create Account
              </Link>
            </div>
          )}

          {/* Title & Subtitle */}
          <div className="mb-6 space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-slate-600 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Form Content */}
          {children}
        </main>

        {/* Bottom Footer Note */}
        <footer className="pt-6 pb-2 border-t border-slate-100 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} P2P Exam Prep. All rights reserved.</p>
        </footer>
      </section>

      {/* ============================================================ */}
      {/* RIGHT SIDE: Brand & Information Area (50% on Desktop)        */}
      {/* Dark Teal / Deep Greenish Blue (#0B3C42) with modern visuals */}
      {/* ============================================================ */}
      <aside className="hidden lg:flex lg:w-1/2 relative bg-[#0B3C42] text-white flex-col justify-between p-12 xl:p-16 overflow-hidden selection:bg-teal-400/30 selection:text-white">
        {/* Background Gradient Mesh & Glows */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#062428] via-[#0B3C42] to-[#0e484f] pointer-events-none" />
        
        {/* Radial Glow Circles */}
        <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-teal-400/15 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        {/* Abstract Geometric Shapes Pattern */}
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
            backgroundSize: "28px 28px",
          }}
        />

        {/* Decorative Ring */}
        <div className="absolute top-1/3 -right-20 h-80 w-80 rounded-full border border-teal-400/10 pointer-events-none" />
        <div className="absolute top-1/3 -right-36 h-112 w-112 rounded-full border border-teal-400/5 pointer-events-none" />

        {/* Top Brand Tagline */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal-300/20 bg-teal-400/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-teal-200 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-teal-300 animate-pulse" />
            <span>Excellence in Exam Preparation</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-teal-200/80">
            <Users className="h-4 w-4" />
            <span>Grades 8–12 & Entrance</span>
          </div>
        </div>

        {/* Middle Brand Pitch & Information Content */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-xl">
          <div className="space-y-4">
            <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
              Empowering students with peer-to-peer tutoring, structured exam preparation, and interactive mentorship.
            </h2>
            <p className="text-sm xl:text-base text-teal-100/80 leading-relaxed font-normal">
              Connect directly with high-achieving peer tutors, master national curriculum subjects with timed practice quizzes, and boost your scores with confidence.
            </p>
          </div>

          {/* Modern Glassmorphic Feature Highlights */}
          <div className="grid grid-cols-1 gap-3.5">
            {/* Feature 1 */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/20 text-teal-300 border border-teal-300/30">
                <Video className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-white">
                  1-on-1 Live Mentorship Sessions
                </h3>
                <p className="mt-0.5 text-xs text-teal-100/70 leading-relaxed">
                  Direct Google Meet video calls and collaborative messaging to review tough questions and exam strategies.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/20 text-teal-300 border border-teal-300/30">
                <BookOpenCheck className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-white">
                  National Exam Practice Quizzes
                </h3>
                <p className="mt-0.5 text-xs text-teal-100/70 leading-relaxed">
                  Timed multiple-choice mock exams categorized by grade and subject with immediate score breakdown and feedback.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3.5 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition hover:bg-white/[0.08]">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-400/20 text-teal-300 border border-teal-300/30">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-white">
                  Verified Top-Tier Peer Mentors
                </h3>
                <p className="mt-0.5 text-xs text-teal-100/70 leading-relaxed">
                  Every tutor undergoes rigorous credential verification and student evaluations to guarantee quality support.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Brand Proof / Trust Banner */}
        <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-teal-100/80">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <div className="h-7 w-7 rounded-full bg-teal-200 text-[#0B3C42] font-bold text-[10px] flex items-center justify-center border-2 border-[#0B3C42]">
                S1
              </div>
              <div className="h-7 w-7 rounded-full bg-emerald-300 text-[#0B3C42] font-bold text-[10px] flex items-center justify-center border-2 border-[#0B3C42]">
                T2
              </div>
              <div className="h-7 w-7 rounded-full bg-amber-200 text-[#0B3C42] font-bold text-[10px] flex items-center justify-center border-2 border-[#0B3C42]">
                S3
              </div>
            </div>
            <span className="font-semibold text-white">
              Over 5,000+ students & tutors
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="flex text-amber-300">
              <Star className="h-3.5 w-3.5 fill-amber-300" />
              <Star className="h-3.5 w-3.5 fill-amber-300" />
              <Star className="h-3.5 w-3.5 fill-amber-300" />
              <Star className="h-3.5 w-3.5 fill-amber-300" />
              <Star className="h-3.5 w-3.5 fill-amber-300" />
            </div>
            <span className="font-bold text-white">4.9/5 Rating</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
