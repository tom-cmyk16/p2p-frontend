import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Eye,
  FileQuestion,
  FileSpreadsheet,
  Flag,
  HelpCircle,
  Lock,
  RotateCcw,
  Send,
  Sparkles,
  Unlock,
} from "lucide-react";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";
import LearningAccessPanel from "../../learning/components/LearningAccessPanel";
import { useProfile } from "../../profile/hooks/useProfile";
import { useQuiz } from "../hooks/useQuiz";
import { quizService } from "../services/quiz.service";

const gradeLabels = {
  GRADE_8: "Grade 8",
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
  GRADE_11: "Grade 11",
  GRADE_12: "Grade 12",
};

export default function QuizPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showPaymentSuccessBanner, setShowPaymentSuccessBanner] = useState(
    Boolean(location.state?.paymentSuccess)
  );
  const { profile, isLoading: isLoadingProfile, error: profileError } = useProfile();
  const {
    subjects,
    topics,
    weakTopics,
    attemptHistory,
    isLoading: isLoadingQuizHook,
    isLoadingSubjects,
    fetchTopics,
    fetchWeakTopics,
  } = useQuiz();

  // Learning access snapshot (from LearningAccessPanel)
  const [learningSnapshot, setLearningSnapshot] = useState(null);
  const learningAccess = learningSnapshot?.access;

  const onAccessLoaded = useCallback((access, now) => {
    setLearningSnapshot({ access, now });
  }, []);

  // Formal Exams state
  const [exams, setExams] = useState([]);
  const [isLoadingExams, setIsLoadingExams] = useState(false);
  const [examError, setExamError] = useState("");

  // ACTIVE EXAM STATE
  const [activeExam, setActiveExam] = useState(null);
  const [examQuestions, setExamQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { [questionId]: optionId }
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set()); // Set of questionIds
  const [examViewMode, setExamViewMode] = useState("question"); // "question" | "summary"
  const [isConfirmSubmitOpen, setIsConfirmSubmitOpen] = useState(false);
  const [isSubmittingAttempt, setIsSubmittingAttempt] = useState(false);

  // Live Timer State
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const timerRef = useRef(null);

  // Past attempt review accordion
  const [expandedAttemptId, setExpandedAttemptId] = useState("");

  // Load available formal exams
  const loadExams = useCallback(async () => {
    setIsLoadingExams(true);
    setExamError("");
    try {
      const data = await quizService.getExams({ isPublished: true });
      setExams(data);
    } catch (err) {
      setExamError(err.response?.data?.error?.message || "Failed to load formal exams.");
    } finally {
      setIsLoadingExams(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  // Check whether a grade/subject is unlocked based on Chapa verified payment
  const isSubjectUnlocked = useCallback(
    (subjectId, gradeLevel) => {
      if (!learningAccess?.packages?.length) return false;
      const now = learningSnapshot?.now || Date.now();

      return learningAccess.packages.some((en) => {
        const active =
          new Date(en.startedAt).getTime() <= now &&
          new Date(en.accessExpiresAt).getTime() > now;
        if (!active) return false;

        if (en.type === "ENTRANCE_GRADE_9_12") return true;
        if (en.type === "FULL_GRADE") return en.gradeLevel === gradeLevel;
        if (en.type === "SINGLE_COURSE") {
          return en.gradeLevel === gradeLevel && en.course?.subjectId === subjectId;
        }
        return false;
      });
    },
    [learningAccess, learningSnapshot]
  );

  // Timer countdown effect
  useEffect(() => {
    if (!activeExam || secondsRemaining <= 0) return;

    timerRef.current = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmitOnTimeOut();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeExam, secondsRemaining]);

  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(
        seconds
      ).padStart(2, "0")}`;
    }
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  // Start taking an Exam
  const handleStartExam = async (exam) => {
    setExamError("");
    try {
      const fullExam = await quizService.getExam(exam.id);
      if (!fullExam.questions || !fullExam.questions.length) {
        setExamError("This exam does not have any questions published yet.");
        return;
      }

      setActiveExam(fullExam);
      setExamQuestions(fullExam.questions);
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setFlaggedQuestions(new Set());
      setExamViewMode("question");

      // Initialize duration in seconds
      const durationSeconds = (fullExam.durationMinutes || 60) * 60;
      setSecondsRemaining(durationSeconds);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      setExamError(msg || "Could not start exam. Please ensure your package is paid and active.");
    }
  };

  // Answer selection
  const handleSelectOption = (questionId, optionId) => {
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionId]: optionId,
    }));
  };

  // Toggle Flag Question feature (Requirement 2)
  const handleToggleFlag = (questionId) => {
    setFlaggedQuestions((prev) => {
      const updated = new Set(prev);
      if (updated.has(questionId)) {
        updated.delete(questionId);
      } else {
        updated.add(questionId);
      }
      return updated;
    });
  };

  // Submit attempt (Requirement 2: Summary of attempt + confirmation)
  const handleAutoSubmitOnTimeOut = () => {
    alert("Time has expired! Your exam will now be submitted automatically.");
    executeSubmit();
  };

  const executeSubmit = async () => {
    if (!activeExam) return;
    setIsSubmittingAttempt(true);
    setExamError("");

    try {
      const formattedAnswers = Object.entries(selectedAnswers).map(
        ([questionId, selectedOptionId]) => ({
          questionId,
          selectedOptionId,
        })
      );

      const result = await quizService.submitExamAttempt(activeExam.id, formattedAnswers);
      const updatedWeakTopics = await fetchWeakTopics();

      // Navigate to results page with detailed review
      navigate("/quiz/results", {
        state: {
          result,
          questions: examQuestions,
          weakTopics: updatedWeakTopics,
          subjectName: activeExam.subjectName || "Examination",
          gradeLevel: activeExam.gradeLevel,
        },
      });
    } catch (err) {
      setExamError(
        err.response?.data?.error?.message || "Failed to submit exam attempt. Please retry."
      );
      setIsSubmittingAttempt(false);
      setIsConfirmSubmitOpen(false);
    }
  };

  const currentQ = examQuestions[currentQuestionIndex];
  const isCurrentFlagged = currentQ && flaggedQuestions.has(currentQ.id);
  const currentAnswered = currentQ && Boolean(selectedAnswers[currentQ.id]);

  const totalAnsweredCount = Object.keys(selectedAnswers).length;
  const unansweredCount = examQuestions.length - totalAnsweredCount;

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* ============================================================ */}
        {/* CASE A: ACTIVE EXAM IN PROGRESS (MOODLE UX INTERFACE)         */}
        {/* ============================================================ */}
        {activeExam ? (
          <div className="space-y-6">
            {/* Sticky Moodle Exam Header with Countdown Timer */}
            <header className="sticky top-2 z-40 flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-slate-200/90 bg-white/95 px-6 py-4 shadow-lg backdrop-blur-md">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#013638]">
                  {activeExam.subjectName} · {gradeLabels[activeExam.gradeLevel] || activeExam.gradeLevel}
                </span>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 truncate max-w-xl">
                  {activeExam.title}
                </h1>
              </div>

              {/* Countdown Timer Badge */}
              <div
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2 text-sm font-black transition ${
                  secondsRemaining <= 300
                    ? "border-rose-300 bg-rose-50 text-rose-700 animate-pulse"
                    : "border-slate-200 bg-slate-100 text-slate-800"
                }`}
              >
                <Clock className="h-4 w-4" />
                <span>Time left: {formatTimer(secondsRemaining)}</span>
              </div>
            </header>

            {examError && <ErrorMessage message={examError} />}

            {/* View Mode 1: Individual Question View with Moodle Navigation */}
            {examViewMode === "question" && currentQ && (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Left: Main Question Area (3 cols) */}
                <div className="lg:col-span-3 space-y-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
                    {/* Question Header Status Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4 mb-6">
                      <div className="flex items-center gap-3">
                        <span className="rounded-xl bg-[#013638]/10 px-3 py-1 text-xs font-extrabold text-[#013638]">
                          Question {currentQuestionIndex + 1} of {examQuestions.length}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            currentAnswered
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {currentAnswered ? "Answer saved" : "Not yet answered"}
                        </span>
                      </div>

                      {/* FLAG QUESTION FEATURE (Highlighted in Red - Requirement 3) */}
                      <button
                        type="button"
                        onClick={() => handleToggleFlag(currentQ.id)}
                        className={`flex items-center gap-2 rounded-2xl border px-3.5 py-1.5 text-xs font-bold transition-all duration-200 ${
                          isCurrentFlagged
                            ? "border-rose-400 bg-rose-50 text-rose-700 ring-2 ring-rose-200 shadow-xs"
                            : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                      >
                        <Flag
                          className={`h-4 w-4 ${
                            isCurrentFlagged ? "fill-rose-600 text-rose-600" : "text-slate-400"
                          }`}
                        />
                        <span>{isCurrentFlagged ? "Flagged for Review (Red)" : "Flag question"}</span>
                      </button>
                    </div>

                    {/* Question Text */}
                    <div className="prose max-w-none text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
                      {currentQ.questionText}
                    </div>

                    {/* Options Grid */}
                    <div className="mt-6 space-y-3">
                      {currentQ.options.map((option, optIdx) => {
                        const isSelected = selectedAnswers[currentQ.id] === option.id;

                        return (
                          <label
                            key={option.id || optIdx}
                            className={`flex cursor-pointer items-start gap-3.5 rounded-2xl border p-4 text-sm transition-all duration-200 ${
                              isSelected
                                ? "border-[#013638] bg-[#013638]/5 text-[#013638] ring-1 ring-[#013638]"
                                : "border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/50"
                            }`}
                          >
                            <input
                              type="radio"
                              name={`exam_q_${currentQ.id}`}
                              value={option.id}
                              checked={isSelected}
                              onChange={() => handleSelectOption(currentQ.id, option.id)}
                              className="mt-0.5 h-4 w-4 accent-[#013638]"
                            />
                            <span className="font-bold text-slate-400">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            <span className="flex-1 font-medium leading-relaxed">
                              {option.optionText}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Bottom Navigation Buttons ("Previous" and "Next") */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                      className="flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition disabled:opacity-40"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      <span>Previous Question</span>
                    </button>

                    {currentQuestionIndex < examQuestions.length - 1 ? (
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentQuestionIndex((prev) =>
                            Math.min(examQuestions.length - 1, prev + 1)
                          )
                        }
                        className="flex items-center gap-2 rounded-2xl bg-[#013638] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#024e51] transition shadow-xs"
                      >
                        <span>Next Question</span>
                        <ArrowRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => setExamViewMode("summary")}
                        className="text-xs px-5 py-2.5 font-bold"
                      >
                        Finish attempt...
                      </Button>
                    )}
                  </div>
                </div>

                {/* Right: Moodle-Style Question Navigation Panel (1 col) */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <h3 className="font-bold text-slate-900 text-sm">Quiz navigation</h3>

                  {/* Grid of Question Numbers */}
                  <div className="grid grid-cols-5 gap-2 pt-1">
                    {examQuestions.map((q, idx) => {
                      const isCurrent = currentQuestionIndex === idx;
                      const hasAnswer = Boolean(selectedAnswers[q.id]);
                      const isFlagged = flaggedQuestions.has(q.id);

                      return (
                        <button
                          key={q.id || idx}
                          type="button"
                          onClick={() => {
                            setCurrentQuestionIndex(idx);
                            setExamViewMode("question");
                          }}
                          className={`relative flex h-10 w-full items-center justify-center rounded-xl text-xs font-bold transition border ${
                            isCurrent
                              ? "ring-2 ring-[#013638] border-[#013638] font-black"
                              : ""
                          } ${
                            hasAnswer
                              ? "bg-slate-800 text-white border-slate-800"
                              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                          } ${
                            isFlagged
                              ? "border-rose-400 ring-1 ring-rose-300"
                              : ""
                          }`}
                          title={`Question ${idx + 1}: ${hasAnswer ? "Answer saved" : "Not yet answered"}${isFlagged ? " (Flagged for review)" : ""}`}
                        >
                          <span>{idx + 1}</span>

                          {/* Flag indicator on corner (highlighted in red) */}
                          {isFlagged && (
                            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-white border-2 border-white text-[9px] shadow-xs">
                              <Flag className="h-2.5 w-2.5 fill-white text-white" />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Legend */}
                  <div className="border-t border-slate-100 pt-3 space-y-2 text-[11px] text-slate-500">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-md bg-slate-800" />
                      <span>Answer saved ({totalAnsweredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-md bg-slate-50 border border-slate-300" />
                      <span>Not yet answered ({unansweredCount})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-600 text-white">
                        <Flag className="h-2 w-2 fill-white text-white" />
                      </span>
                      <span className="font-semibold text-rose-700">Flagged questions ({flaggedQuestions.size})</span>
                    </div>
                  </div>

                  {/* Finish Attempt Button in Navigation Panel */}
                  <div className="border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => setExamViewMode("summary")}
                      className="w-full text-center text-xs font-bold text-[#013638] hover:underline"
                    >
                      Finish attempt...
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* View Mode 2: SUMMARY OF ATTEMPT (Moodle UX standard) */}
            {examViewMode === "summary" && (
              <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Summary of Attempt</h2>
                  <p className="text-sm text-slate-500 mt-1">
                    Please review your saved answers before submitting your final attempt.
                  </p>
                </div>

                {/* Summary Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-5 py-3">Question</th>
                        <th className="px-5 py-3">Status</th>
                        <th className="px-5 py-3">Flag Status</th>
                        <th className="px-5 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {examQuestions.map((q, idx) => {
                        const hasAnswer = Boolean(selectedAnswers[q.id]);
                        const isFlagged = flaggedQuestions.has(q.id);

                        return (
                          <tr key={q.id || idx} className="hover:bg-slate-50/50">
                            <td className="px-5 py-3 font-bold text-slate-800">
                              Question {idx + 1}
                            </td>
                            <td className="px-5 py-3">
                              <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                                  hasAnswer
                                    ? "bg-emerald-50 text-emerald-800"
                                    : "bg-amber-50 text-amber-800"
                                }`}
                              >
                                {hasAnswer ? "Answer saved" : "Not yet answered"}
                              </span>
                            </td>
                            <td className="px-5 py-3">
                              {isFlagged ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-2.5 py-0.5 text-xs font-bold text-rose-700">
                                  <Flag className="h-3.5 w-3.5 fill-rose-600 text-rose-600" />
                                  <span>Flagged for Review</span>
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">Not flagged</span>
                              )}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setCurrentQuestionIndex(idx);
                                  setExamViewMode("question");
                                }}
                                className="text-xs font-bold text-[#013638] hover:underline"
                              >
                                Return to question
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Action Bar for Summary */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() => setExamViewMode("question")}
                    className="rounded-2xl border border-slate-300 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Return to attempt
                  </button>

                  <Button
                    type="button"
                    onClick={() => setIsConfirmSubmitOpen(true)}
                    className="px-6 py-2.5 text-xs font-bold rounded-2xl bg-[#013638] hover:bg-[#024e51] shadow-md"
                  >
                    Submit all and finish
                  </Button>
                </div>
              </div>
            )}

            {/* CONFIRMATION DIALOG: "Submit all and finish" (Requirement 2) */}
            {isConfirmSubmitOpen && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
                role="dialog"
                aria-modal="true"
              >
                <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-amber-100 p-2.5 text-amber-800">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900">
                        Submit all and finish?
                      </h3>
                      <p className="text-xs text-slate-500">
                        Confirmation of final exam attempt submission
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    Once you submit, you will no longer be able to change your answers for this attempt.
                  </p>

                  {unansweredCount > 0 && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 font-medium">
                      ⚠️ Note: You have {unansweredCount} unanswered question(s).
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsConfirmSubmitOpen(false)}
                      className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <Button
                      type="button"
                      disabled={isSubmittingAttempt}
                      onClick={executeSubmit}
                      className="text-xs px-5 py-2 font-bold"
                    >
                      {isSubmittingAttempt ? "Submitting..." : "Submit all and finish"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ============================================================ */
          /* CASE B: EXAM CATALOG & STUDENT CONTENT LOCKING VIEW         */
          /* ============================================================ */
          <div className="space-y-8">
            <header>
              <span className="text-xs font-bold uppercase tracking-wider text-[#013638]">
                Examinations & Practice
              </span>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
                Formal Exams & Practice Quizzes
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Take formal timed exams with step-by-step navigation, review attempt summaries, and track mastery.
              </p>
            </header>

            {/* Post-Payment Exam Flow: Celebratory Active Enrollment Banner */}
            {showPaymentSuccessBanner && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-3xl border border-emerald-300 bg-emerald-50/90 p-5 shadow-xs text-emerald-950">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white font-bold shadow-xs">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-emerald-950">
                      Payment Verified & Package Access Unlocked!
                    </p>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Your learning subscription is active. All examinations, quizzes, and course practice materials are unlocked for your grade level.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentSuccessBanner(false)}
                  className="self-end sm:self-auto rounded-xl border border-emerald-200 bg-white/90 px-3 py-1.5 text-xs font-bold text-emerald-800 hover:bg-white transition"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Package Access Timeline Component */}
            <LearningAccessPanel onAccessLoaded={onAccessLoaded} />

            {/* FORMAL EXAMS CARDS (Strictly Filtered to Active Paid Courses) */}
            <section className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Enrolled Course Examinations</h2>
                  <p className="text-xs text-slate-500">
                    Formal timed assessments strictly filtered to your active enrolled courses.
                  </p>
                </div>
                <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-extrabold text-emerald-800">
                  {exams.filter((exam) => exam.isLocked === false || isSubjectUnlocked(exam.subjectId, exam.gradeLevel)).length} Active Exams
                </span>
              </div>

              {isLoadingExams ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Loading examination catalog...
                </div>
              ) : exams.filter((exam) => exam.isLocked === false || isSubjectUnlocked(exam.subjectId, exam.gradeLevel)).length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-10 text-center space-y-3">
                  <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300" />
                  <p className="text-base font-bold text-slate-800">No active examinations for your enrolled courses</p>
                  <p className="mx-auto max-w-md text-xs text-slate-500">
                    Examinations will automatically appear here once you enroll in an active course package or once new formal exams are published for your enrolled subjects.
                  </p>
                  <Link
                    to="/student/packages"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#013638] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#024e51] transition shadow-xs"
                  >
                    Browse Packages & Courses →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {exams
                    .filter((exam) => exam.isLocked === false || isSubjectUnlocked(exam.subjectId, exam.gradeLevel))
                    .map((exam) => {
                      const qCount =
                        exam.questionsCount || (exam.questions ? exam.questions.length : 0);

                      return (
                        <div
                          key={exam.id}
                          className="flex flex-col justify-between rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-300 hover:border-[#013638]/40 hover:shadow-lg"
                        >
                          <div>
                            {/* Badges: Grade, Subject tag, and Active Status */}
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="rounded-full bg-[#013638]/10 px-2.5 py-0.5 text-xs font-bold text-[#013638]">
                                  {gradeLabels[exam.gradeLevel] || exam.gradeLevel}
                                </span>
                                {exam.subjectName && (
                                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
                                    {exam.subjectName}
                                  </span>
                                )}
                              </div>

                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-xs font-bold text-emerald-800 shrink-0">
                                <Unlock className="h-3 w-3 text-emerald-600" />
                                <span>Unlocked</span>
                              </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900 line-clamp-2">
                              {exam.title}
                            </h3>

                            {exam.instructions && (
                              <p className="mt-2 text-xs text-slate-600 line-clamp-2">
                                {exam.instructions}
                              </p>
                            )}

                            {/* Interactive 3-Stat Grid: Question count, Timer duration, Pass score */}
                            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-slate-50/80 p-3 text-center border border-slate-100">
                              <div>
                                <div className="flex items-center justify-center gap-1 text-slate-400">
                                  <FileQuestion className="h-3 w-3" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Questions
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-900 mt-1">
                                  {qCount} Qs
                                </p>
                              </div>
                              <div className="border-x border-slate-200/60">
                                <div className="flex items-center justify-center gap-1 text-slate-400">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Timer
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-900 mt-1">
                                  {exam.durationMinutes || 60} Mins
                                </p>
                              </div>
                              <div>
                                <div className="flex items-center justify-center gap-1 text-slate-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  <span className="text-[10px] font-bold uppercase tracking-wider">
                                    Pass Mark
                                  </span>
                                </div>
                                <p className="text-xs font-bold text-slate-900 mt-1">
                                  {exam.passingScore || 60}%
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Action CTA */}
                          <div className="mt-6 pt-3 border-t border-slate-100">
                            <Button
                              type="button"
                              onClick={() => handleStartExam(exam)}
                              className="w-full text-xs font-bold py-2.5 rounded-2xl shadow-xs hover:shadow-md transition"
                            >
                              Start Examination →
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </section>

            {/* PAST QUIZ & EXAM ATTEMPTS */}
            <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">Attempt History</h2>
                  <p className="text-xs text-slate-500">
                    Past attempts remain accessible even after course practice period ends.
                  </p>
                </div>
                <span className="text-xs font-semibold text-slate-400">
                  {attemptHistory.length} Recorded
                </span>
              </div>

              {attemptHistory.length === 0 ? (
                <p className="rounded-2xl bg-slate-50 p-6 text-center text-xs text-slate-500">
                  No completed attempts recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {attemptHistory.map((attempt) => (
                    <div key={attempt.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {attempt.subject?.name} · {gradeLabels[attempt.gradeLevel]}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(attempt.startedAt).toLocaleString()} · {attempt.answers?.length || 0} questions
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              attempt.score >= 60
                                ? "bg-emerald-50 text-emerald-800"
                                : "bg-rose-50 text-rose-800"
                            }`}
                          >
                            Score: {attempt.score}%
                          </span>

                          <button
                            type="button"
                            onClick={() =>
                              setExpandedAttemptId((prev) =>
                                prev === attempt.id ? "" : attempt.id
                              )
                            }
                            className="text-xs font-bold text-[#013638] hover:underline"
                          >
                            {expandedAttemptId === attempt.id ? "Hide Review" : "Review Answers"}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Question Review */}
                      {expandedAttemptId === attempt.id && (
                        <ol className="mt-4 space-y-3 border-t border-slate-100 pt-3">
                          {attempt.answers.map((answer, ansIdx) => (
                            <li
                              key={answer.questionId || ansIdx}
                              className="rounded-2xl bg-slate-50/70 p-4 text-xs space-y-1.5"
                            >
                              <p className="font-bold text-slate-900">
                                {ansIdx + 1}. {answer.question?.questionText}
                              </p>
                              <p
                                className={`font-semibold ${
                                  answer.isCorrect ? "text-emerald-700" : "text-rose-700"
                                }`}
                              >
                                Your answer: {answer.selectedOption?.optionText || answer.selectedOptionText}
                              </p>
                              {!answer.isCorrect && (
                                <p className="text-emerald-700 font-semibold">
                                  Correct answer:{" "}
                                  {answer.question?.options?.find((o) => o.isCorrect)?.optionText ||
                                    answer.correctOptionText}
                                </p>
                              )}
                              {answer.question?.explanation && (
                                <p className="text-slate-500 italic pt-1">
                                  {answer.question.explanation}
                                </p>
                              )}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </main>
  );
}
