import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Award,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  FileQuestion,
  GraduationCap,
  LayoutGrid,
  Lock,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Unlock,
  UserCheck,
  Video,
  UserPlus,
  RefreshCw,
  Star,
  ShieldAlert,
} from "lucide-react";
import Button from "../../../components/common/Button";
import { useAuthContext } from "../../../context/AuthContext";
import { useLearningAccess } from "../../learning/hooks/useLearningAccess";
import { quizService } from "../../quiz/services/quiz.service";
import { schedulingService } from "../../scheduling/services/scheduling.service";
import StudentInlineChat from "../components/StudentInlineChat";
import MentorSelectionModal from "../components/MentorSelectionModal";
import RateTutorModal from "../../ratings/components/RateTutorModal";
import ReportTutorModal from "../../reports/components/ReportTutorModal";

const gradeLabels = {
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
  GRADE_11: "Grade 11",
  GRADE_12: "Grade 12",
};

const packageLabels = {
  SINGLE_COURSE: "Single Course",
  FULL_GRADE: "Full Grade",
  ENTRANCE_GRADE_9_12: "Grade 9–12 Entrance",
};

const formatCountdown = (expiry, now) => {
  const remaining = Math.max(0, new Date(expiry).getTime() - now);
  if (remaining === 0) return "Expired";
  const seconds = Math.floor(remaining / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m left`;
};

const formatSessionDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default function StudentDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { access, now, isLoading: isAccessLoading, refresh: refreshAccess } = useLearningAccess();

  // Active Tab state
  const [activeTab, setActiveTab] = useState("courses"); // "courses" | "mentorship" | "history"

  const [exams, setExams] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(true);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [isLoadingAttempts, setIsLoadingAttempts] = useState(true);
  const [sessions, setSessions] = useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Mentor Selection Modal State
  const [isMentorModalOpen, setIsMentorModalOpen] = useState(false);
  const [selectedEnrollmentForMentor, setSelectedEnrollmentForMentor] = useState(null);

  // Rate & Report Modals State
  const [rateModalSession, setRateModalSession] = useState(null);
  const [reportModalData, setReportModalData] = useState(null);

  const handleRatingSubmitted = (savedRating) => {
    if (!rateModalSession) return;
    setSessions((prev) =>
      prev.map((s) =>
        s.id === rateModalSession.id
          ? {
              ...s,
              conversation: {
                ...s.conversation,
                rating: savedRating,
              },
            }
          : s
      )
    );
  };

  // Fetch student's published exams (strictly filtered to active paid courses)
  useEffect(() => {
    let active = true;
    quizService
      .getExams({ isPublished: true })
      .then((data) => {
        if (active) setExams(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setExams([]);
      })
      .finally(() => {
        if (active) setIsLoadingExams(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch student's quiz attempt history
  useEffect(() => {
    let active = true;
    quizService
      .getAttemptHistory()
      .then((data) => {
        if (active) setAttemptHistory(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setAttemptHistory([]);
      })
      .finally(() => {
        if (active) setIsLoadingAttempts(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Fetch scheduled sessions
  const loadSessions = useCallback(() => {
    setIsLoadingSessions(true);
    schedulingService
      .getSessions()
      .then((items) => {
        setSessions(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        setSessions([]);
      })
      .finally(() => {
        setIsLoadingSessions(false);
      });
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Compute active packages
  const activePackages = useMemo(() => {
    if (!access?.packages) return [];
    return access.packages.filter(
      (en) =>
        new Date(en.accessExpiresAt).getTime() > now &&
        new Date(en.startedAt).getTime() <= now
    );
  }, [access, now]);

  // Find assigned mentor if any across active packages
  const primaryAssignedTutor = useMemo(() => {
    const pkgWithTutor = activePackages.find((p) => p.assignedTutor);
    if (pkgWithTutor?.assignedTutor) {
      return {
        ...pkgWithTutor.assignedTutor,
        enrollmentId: pkgWithTutor.id,
      };
    }
    return null;
  }, [activePackages]);

  // Compute average score & pass rate
  const averageScore = useMemo(() => {
    if (!attemptHistory.length) return null;
    const total = attemptHistory.reduce((sum, att) => sum + (att.score || 0), 0);
    return Math.round(total / attemptHistory.length);
  }, [attemptHistory]);

  const passCount = useMemo(() => {
    return attemptHistory.filter((att) => (att.score || 0) >= 60).length;
  }, [attemptHistory]);

  const handleOpenMentorModal = (enrollment = null) => {
    setSelectedEnrollmentForMentor(enrollment || activePackages[0] || null);
    setIsMentorModalOpen(true);
  };

  const handleMentorAssigned = () => {
    if (refreshAccess) refreshAccess();
    loadSessions();
  };

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ============================================================ */}
        {/* HERO / WELCOME SECTION                                       */}
        {/* ============================================================ */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#013638] via-[#024e51] to-[#012728] p-6 sm:p-10 text-white shadow-xl">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-bold tracking-wide backdrop-blur-md">
                <GraduationCap className="h-4 w-4 text-emerald-300" />
                <span>Student Learning Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                Welcome back, {user?.fullName || "Student"}!
              </h1>
              <p className="text-sm text-slate-200 leading-relaxed">
                Track your active course subscriptions, take formal curriculum examinations, review core-course progress, and interact directly with your 1-on-1 mentor.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => navigate("/quiz")}
                className="bg-white text-[#013638] hover:bg-slate-100 font-bold px-5 py-2.5 text-xs rounded-2xl shadow-md"
              >
                Go to Practice Quizzes →
              </Button>
              <Link
                to="/student/packages"
                className="rounded-2xl border border-white/20 bg-white/10 hover:bg-white/20 px-4 py-2.5 text-xs font-bold text-white transition backdrop-blur-md text-center"
              >
                Manage Packages
              </Link>
            </div>
          </div>

          {/* Decorative glows */}
          <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute left-1/2 -top-10 h-48 w-48 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />
        </section>

        {/* ============================================================ */}
        {/* TAB NAVIGATION BAR                                           */}
        {/* ============================================================ */}
        <section className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab("courses")}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition shadow-xs ${
              activeTab === "courses"
                ? "bg-[#013638] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <BookOpenCheck className="h-4 w-4" />
            <span>Active Courses & Exams</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === "courses"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {exams.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("mentorship")}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition shadow-xs ${
              activeTab === "mentorship"
                ? "bg-[#013638] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            <span>Chat & Mentorship</span>
            {primaryAssignedTutor && (
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("history")}
            className={`inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-xs font-bold transition shadow-xs ${
              activeTab === "history"
                ? "bg-[#013638] text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
            }`}
          >
            <Award className="h-4 w-4" />
            <span>Attempt History & Analytics</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] ${
                activeTab === "history"
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {attemptHistory.length}
            </span>
          </button>
        </section>

        {/* ============================================================ */}
        {/* TAB 1: ACTIVE COURSES & EXAMINATIONS                         */}
        {/* ============================================================ */}
        {activeTab === "courses" && (
          <div className="space-y-8 animate-fadeIn">
            {/* KPI OVERVIEW CARDS */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* KPI 1: Active Packages */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Packages
                  </span>
                  <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                    <CreditCard className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {activePackages.length}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    {activePackages.length > 0 ? "Active Access" : "No Package"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  {activePackages[0]
                    ? activePackages[0].type === "SINGLE_COURSE"
                      ? `${activePackages[0].course?.subject?.name || "Single Course"} · ${gradeLabels[activePackages[0].gradeLevel] || activePackages[0].gradeLevel}`
                      : packageLabels[activePackages[0].type]
                    : "Browse available courses"}
                </p>
              </div>

              {/* KPI 2: Available Exams */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Active Exams
                  </span>
                  <div className="rounded-2xl bg-teal-50 p-2 text-teal-700">
                    <FileQuestion className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {exams.length}
                  </span>
                  <span className="text-xs font-bold text-teal-700">Available</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  Filtered strictly to your paid courses
                </p>
              </div>

              {/* KPI 3: Mentorship Quota */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Mentorship Sessions
                  </span>
                  <div className="rounded-2xl bg-indigo-50 p-2 text-indigo-700">
                    <UserCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {activePackages.reduce(
                      (acc, en) => acc + (en.liveSessionsRemaining ?? 0),
                      0
                    )}
                  </span>
                  <span className="text-xs font-bold text-indigo-700">Available</span>
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  {primaryAssignedTutor
                    ? `Mentor: ${primaryAssignedTutor.fullName}`
                    : "1-on-1 Mentor guidance"}
                </p>
              </div>

              {/* KPI 4: Average Score */}
              <div className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-xs transition hover:shadow-md">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Average Score
                  </span>
                  <div className="rounded-2xl bg-amber-50 p-2 text-amber-700">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-900">
                    {averageScore !== null ? `${averageScore}%` : "N/A"}
                  </span>
                  <span className="text-xs font-bold text-amber-700">
                    {attemptHistory.length} attempts
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500 truncate">
                  Across all completed assessments
                </p>
              </div>
            </section>

            {/* PACKAGE ACCESS TIMELINE */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#013638]">
                    Learning Timeline
                  </span>
                  <h2 className="text-xl font-bold text-slate-900">
                    Package Access & Active Subscriptions
                  </h2>
                  <p className="text-xs text-slate-500">
                    Your practice and live mentorship access validity per enrolled course.
                  </p>
                </div>

                <Link
                  to="/student/packages"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#013638] hover:underline"
                >
                  <span>View Packages Catalog</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>

              {isAccessLoading ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Loading your package timeline...
                </div>
              ) : activePackages.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-3">
                  <CreditCard className="mx-auto h-8 w-8 text-slate-400" />
                  <p className="text-sm font-bold text-slate-800">
                    No active package enrollment found
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Subscribe to a Single Course, Full Grade, or Entrance Package to unlock full examination catalogs, practice questions, and dedicated 1-on-1 mentorship.
                  </p>
                  <Link
                    to="/student/packages"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#013638] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#024e51] transition shadow-xs"
                  >
                    Enroll in a Course Package →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePackages.map((en) => {
                    const title =
                      en.type === "SINGLE_COURSE"
                        ? `${en.course?.subject?.name || "Course"} · ${gradeLabels[en.gradeLevel] || en.gradeLevel}`
                        : en.type === "FULL_GRADE"
                        ? `${packageLabels[en.type]} · ${gradeLabels[en.gradeLevel] || en.gradeLevel}`
                        : packageLabels[en.type];

                    return (
                      <article
                        key={en.id}
                        className="flex flex-col justify-between rounded-2xl border border-slate-200 p-5 bg-gradient-to-br from-white to-slate-50/50 hover:border-slate-300 transition"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-0.5 text-xs font-bold text-emerald-800">
                              Active Access
                            </span>
                            <span className="text-xs font-semibold text-slate-500">
                              {packageLabels[en.type]}
                            </span>
                          </div>

                          <h3 className="mt-3 text-base font-extrabold text-slate-900">
                            {title}
                          </h3>

                          {en.assignedTutor ? (
                            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-slate-100/80 px-3 py-1.5 text-xs text-slate-700">
                              <span className="flex items-center gap-1.5">
                                <UserCheck className="h-4 w-4 text-[#013638]" />
                                <span>Mentor: <strong className="font-bold">{en.assignedTutor.fullName}</strong></span>
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-md">
                                <Lock className="h-2.5 w-2.5" />
                                <span>Locked</span>
                              </span>
                            </div>
                          ) : (
                            <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-amber-50 border border-amber-200/60 px-3 py-1.5 text-xs text-amber-900">
                              <span>No mentor assigned yet</span>
                              <button
                                type="button"
                                onClick={() => handleOpenMentorModal(en)}
                                className="font-bold text-[#013638] hover:underline"
                              >
                                Choose Mentor →
                              </button>
                            </div>
                          )}

                          <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-slate-100 pt-3 text-xs">
                            <div>
                              <dt className="text-slate-500 font-medium">Practice & Exam Access</dt>
                              <dd className="mt-0.5 font-bold text-[#013638]">
                                {formatCountdown(en.accessExpiresAt, now)}
                              </dd>
                            </div>
                            <div>
                              <dt className="text-slate-500 font-medium">Mentorship Access</dt>
                              <dd className="mt-0.5 font-bold text-[#013638]">
                                {en.mentorshipActive
                                  ? formatCountdown(en.mentorshipExpiresAt, now)
                                  : "Ended"}
                                {en.liveSessionCount
                                  ? ` (${en.liveSessionsRemaining} sessions left)`
                                  : ""}
                              </dd>
                            </div>
                          </dl>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-2 pt-3 border-t border-slate-100">
                          <Link
                            to="/quiz"
                            className="text-xs font-bold text-[#013638] hover:underline"
                          >
                            Start Quizzes for this Course →
                          </Link>
                          <button
                            type="button"
                            onClick={() => setActiveTab("mentorship")}
                            className="text-xs font-medium text-slate-600 hover:text-slate-900"
                          >
                            Go to Mentorship Chat →
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>

            {/* EXAMINATIONS & PROGRESSION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2 space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900">
                        Enrolled Course Examinations
                      </h2>
                      <p className="text-xs text-slate-500">
                        Formal timed exams matching your unlocked paid subjects.
                      </p>
                    </div>
                    <Link
                      to="/quiz"
                      className="text-xs font-bold text-[#013638] hover:underline shrink-0"
                    >
                      View All in Quiz Portal →
                    </Link>
                  </div>

                  {isLoadingExams ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Loading active examinations...
                    </div>
                  ) : exams.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-2">
                      <FileQuestion className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="text-sm font-bold text-slate-700">
                        No active examinations found for your active courses
                      </p>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        New formal exams prepared by instructors will appear here automatically for your unlocked subjects.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {exams.slice(0, 4).map((exam) => {
                        const qCount =
                          exam.questionsCount || (exam.questions ? exam.questions.length : 0);

                        return (
                          <div
                            key={exam.id}
                            className="flex flex-col justify-between rounded-2xl border border-slate-200 p-5 bg-white shadow-xs transition hover:shadow-md"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-2">
                                <span className="rounded-full bg-[#013638]/10 px-2.5 py-0.5 text-xs font-bold text-[#013638]">
                                  {gradeLabels[exam.gradeLevel] || exam.gradeLevel}
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800">
                                  <Unlock className="h-3 w-3 text-emerald-600" />
                                  <span>Active</span>
                                </span>
                              </div>

                              <h3 className="text-base font-bold text-slate-900 line-clamp-2">
                                {exam.title}
                              </h3>
                              <p className="text-xs text-slate-500 mt-1">
                                {exam.subjectName || "Curriculum Subject"}
                              </p>

                              <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-2.5 text-center text-[11px] border border-slate-100">
                                <div>
                                  <span className="text-slate-400 font-bold block">Qs</span>
                                  <span className="font-extrabold text-slate-800">{qCount}</span>
                                </div>
                                <div className="border-x border-slate-200/60">
                                  <span className="text-slate-400 font-bold block">Timer</span>
                                  <span className="font-extrabold text-slate-800">{exam.durationMinutes || 60}m</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 font-bold block">Pass</span>
                                  <span className="font-extrabold text-slate-800">{exam.passingScore || 60}%</span>
                                </div>
                              </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-slate-100">
                              <Button
                                type="button"
                                onClick={() => navigate("/quiz")}
                                className="w-full text-xs font-bold py-2 rounded-xl"
                              >
                                Take Exam →
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              {/* Progression Column */}
              <div>
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">
                      Core-Course Progression
                    </h3>
                    <p className="text-xs text-slate-500">
                      Curriculum completion milestones.
                    </p>
                  </div>

                  {access?.coreCourses && access.coreCourses.length > 0 ? (
                    <ul className="space-y-2">
                      {access.coreCourses.map((course) => (
                        <li
                          key={course.id}
                          className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50/80 p-3 text-xs border border-slate-100"
                        >
                          <span className="font-bold text-slate-800">
                            {gradeLabels[course.gradeLevel] || course.gradeLevel} · {course.subject?.name}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              course.isCompleted ? "text-emerald-700" : "text-amber-700"
                            }`}
                          >
                            {course.isCompleted ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Complete</span>
                              </>
                            ) : (
                              <span>In progress</span>
                            )}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">
                      Enrolled courses will track your progression here.
                    </p>
                  )}
                </section>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 2: CHAT & MENTORSHIP                                     */}
        {/* ============================================================ */}
        {activeTab === "mentorship" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Top Mentor Banner / Selection Status */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#013638] text-white text-xl font-bold shadow-md">
                    {primaryAssignedTutor?.fullName
                      ? primaryAssignedTutor.fullName.charAt(0).toUpperCase()
                      : "M"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-bold text-slate-900">
                        {primaryAssignedTutor?.fullName || "No Mentor Selected"}
                      </h2>
                      {primaryAssignedTutor && (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800 border border-emerald-200">
                          Active Mentor
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {primaryAssignedTutor
                        ? "Assigned 1-on-1 subject mentor for study questions, document review, and scheduled live sessions."
                        : "Select an approved tutor to begin 1-on-1 chat guidance and weekly video mentoring."}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {primaryAssignedTutor ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 rounded-2xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 border border-slate-200">
                        <Lock className="h-3.5 w-3.5 text-slate-500" />
                        <span>Mentor Assigned</span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setReportModalData({
                            tutorId:
                              primaryAssignedTutor.userId ||
                              primaryAssignedTutor.id,
                            tutorName: primaryAssignedTutor.fullName,
                            courseName:
                              primaryAssignedTutor.subject?.name ||
                              "Mentorship",
                          })
                        }
                        className="inline-flex items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs"
                        title="Report mentor to platform administration"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                        <span>Report Mentor</span>
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      onClick={() => handleOpenMentorModal()}
                      className="text-xs font-bold rounded-2xl"
                    >
                      <UserPlus className="h-4 w-4 mr-1.5" />
                      <span>Select Mentor</span>
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      loadSessions();
                      if (refreshAccess) refreshAccess();
                    }}
                    className="text-xs rounded-2xl"
                    title="Refresh status"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </section>

            {/* Split View: Live Mentorship Sessions + Inline Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column (5 cols): Scheduled Live Mentorship Sessions */}
              <div className="lg:col-span-5 space-y-6">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        Weekly Live Sessions
                      </h3>
                      <p className="text-xs text-slate-500">
                        Video sessions scheduled by your mentor.
                      </p>
                    </div>
                    <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-xs font-bold text-teal-800">
                      {sessions.filter((s) => s.status === "SCHEDULED").length} upcoming
                    </span>
                  </div>

                  {isLoadingSessions ? (
                    <div className="py-8 text-center text-xs text-slate-500">
                      Loading scheduled sessions...
                    </div>
                  ) : sessions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 p-6 text-center space-y-2">
                      <Video className="mx-auto h-8 w-8 text-slate-300" />
                      <p className="text-xs font-bold text-slate-700">
                        No mentorship sessions scheduled yet
                      </p>
                      <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                        Your assigned mentor will schedule weekly time slots for you. You will be able to join live video directly from here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {sessions.map((session) => {
                        const start = new Date(session.startsAt).getTime();
                        const end = new Date(session.endsAt).getTime();
                        const isPast = now > end;
                        const isCurrent = now >= start && now <= end;

                        return (
                          <div
                            key={session.id}
                            className={`rounded-2xl border p-4 transition ${
                              isCurrent
                                ? "border-emerald-300 bg-emerald-50/50 shadow-xs ring-2 ring-emerald-400/20"
                                : isPast
                                ? "border-slate-100 bg-slate-50/50 opacity-80"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                    isCurrent
                                      ? "bg-emerald-600 text-white animate-pulse"
                                      : isPast
                                      ? "bg-slate-200 text-slate-600"
                                      : "bg-[#013638]/10 text-[#013638]"
                                  }`}
                                >
                                  {isCurrent ? "Live Now" : isPast ? "Completed" : "Scheduled"}
                                </span>
                                <h4 className="mt-1.5 text-sm font-bold text-slate-900">
                                  {session.course?.subject?.name || "Mentorship Session"}
                                </h4>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {formatSessionDate(session.startsAt)}
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                {(session.googleMeetLink || session.meetUrl) && (
                                  <a
                                    href={session.googleMeetLink || session.meetUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition shadow-xs ${
                                      isCurrent
                                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                                        : "bg-[#013638] hover:bg-[#024e51] text-white"
                                    }`}
                                  >
                                    <Video className="h-3.5 w-3.5" />
                                    <span>Join Meeting</span>
                                  </a>
                                )}

                                {isPast && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => setRateModalSession(session)}
                                      className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition border shadow-xs ${
                                        session.conversation?.rating
                                          ? "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100"
                                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                      }`}
                                    >
                                      <Star
                                        className={`h-3 w-3 ${
                                          session.conversation?.rating
                                            ? "fill-amber-400 text-amber-500"
                                            : "text-amber-500"
                                        }`}
                                      />
                                      <span>
                                        {session.conversation?.rating
                                          ? `Rated ${session.conversation.rating.score}★`
                                          : "Rate Tutor"}
                                      </span>
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setReportModalData({
                                          tutorId:
                                            session.tutor?.userId ||
                                            session.tutor?.user?.id ||
                                            session.tutorId,
                                          tutorName:
                                            session.tutor?.user?.fullName ||
                                            "Tutor",
                                          courseName:
                                            session.course?.subject?.name ||
                                            "Mentorship Session",
                                          conversationId: session.conversationId,
                                        })
                                      }
                                      className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs"
                                      title="Report session or tutor to administration"
                                    >
                                      <ShieldAlert className="h-3 w-3 text-rose-600" />
                                      <span>Report</span>
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>
              </div>

              {/* Right Column (7 cols): Inline Student-Tutor Chat Feature */}
              <div className="lg:col-span-7">
                {primaryAssignedTutor ? (
                  <StudentInlineChat mentor={primaryAssignedTutor} />
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center space-y-4">
                    <MessageSquare className="mx-auto h-12 w-12 text-slate-300" />
                    <div>
                      <h3 className="text-base font-bold text-slate-800">
                        Select a Mentor to Activate Direct Chat
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
                        Once you link an approved mentor to your enrolled course, you can chat directly and share PDF study guides and exercise photos.
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => handleOpenMentorModal()}
                      className="text-xs font-bold"
                    >
                      Choose Your Mentor Now →
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* TAB 3: ATTEMPT HISTORY & ANALYTICS                           */}
        {/* ============================================================ */}
        {activeTab === "history" && (
          <div className="space-y-8 animate-fadeIn">
            {/* Summary Analytics Cards */}
            <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Assessments
                </span>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {attemptHistory.length}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Recorded across all curriculums
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Average Score
                </span>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {averageScore !== null ? `${averageScore}%` : "N/A"}
                </p>
                <p className="mt-1 text-xs text-emerald-600 font-semibold">
                  {passCount} passed assessments
                </p>
              </div>

              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Passing Rate
                </span>
                <p className="mt-2 text-3xl font-black text-slate-900">
                  {attemptHistory.length
                    ? `${Math.round((passCount / attemptHistory.length) * 100)}%`
                    : "0%"}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Passing threshold is 60%
                </p>
              </div>
            </section>

            {/* Detailed Attempts History List */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Complete Assessment History
                </h2>
                <p className="text-xs text-slate-500">
                  Review question answers, time taken, and score breakdowns for each quiz attempt.
                </p>
              </div>

              {isLoadingAttempts ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  Loading attempt records...
                </div>
              ) : attemptHistory.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center space-y-2">
                  <Award className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="text-sm font-bold text-slate-700">
                    No attempts recorded yet
                  </p>
                  <p className="text-xs text-slate-500">
                    Take your first practice exam to begin building your performance history!
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {attemptHistory.map((attempt) => {
                    const isPassed = (attempt.score || 0) >= 60;

                    return (
                      <div
                        key={attempt.id}
                        className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {attempt.subject?.name || "Assessment"}
                            </span>
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              {gradeLabels[attempt.gradeLevel] || attempt.gradeLevel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            Completed on {new Date(attempt.startedAt).toLocaleDateString()} at{" "}
                            {new Date(attempt.startedAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}{" "}
                            · {attempt.answers?.length || 0} questions answered
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              isPassed
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {attempt.score}% {isPassed ? "Passed" : "Needs Review"}
                          </span>
                          <Link
                            to="/quiz"
                            className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#013638] hover:bg-slate-50 transition"
                          >
                            Review Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      {/* Mentor Selection Modal */}
      <MentorSelectionModal
        isOpen={isMentorModalOpen}
        onClose={() => setIsMentorModalOpen(false)}
        enrollment={selectedEnrollmentForMentor}
        onMentorAssigned={handleMentorAssigned}
      />

      {/* Rate Tutor Modal */}
      {rateModalSession && (
        <RateTutorModal
          isOpen={Boolean(rateModalSession)}
          onClose={() => setRateModalSession(null)}
          conversationId={rateModalSession.conversationId}
          tutorName={
            rateModalSession.tutor?.user?.fullName ||
            primaryAssignedTutor?.fullName ||
            "Your Tutor"
          }
          courseName={
            rateModalSession.course?.subject?.name || "Mentorship Session"
          }
          initialRating={rateModalSession.conversation?.rating}
          onRatingSubmitted={handleRatingSubmitted}
        />
      )}

      {/* Report Tutor Modal */}
      {reportModalData && (
        <ReportTutorModal
          isOpen={Boolean(reportModalData)}
          onClose={() => setReportModalData(null)}
          tutorId={reportModalData.tutorId}
          tutorName={reportModalData.tutorName}
          courseName={reportModalData.courseName}
          conversationId={reportModalData.conversationId}
        />
      )}
    </main>
  );
}
