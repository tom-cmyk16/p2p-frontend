import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  ExternalLink,
  GraduationCap,
  Info,
  Lock,
  Package,
  ShieldCheck,
  Sparkles,
  Unlock,
  UserCheck,
  UserRound,
  X,
} from "lucide-react";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { paymentService } from "../services/payment.service";

const durations = {
  SINGLE_COURSE: {
    content: "30 Days Access",
    contentDetail: "Practice questions, quizzes, notes & materials",
    mentorship: "7 Days Live Mentorship",
    mentorshipDetail: "3 one-on-one live tutor sessions & chat",
  },
  FULL_GRADE: {
    content: "120 Days (4 Months)",
    contentDetail: "Full curriculum access for all subjects in grade",
    mentorship: "60 Days (2 Months)",
    mentorshipDetail: "Live tutor mentorship & progress check-ins",
  },
  ENTRANCE_GRADE_9_12: {
    content: "365 Days (1 Year)",
    contentDetail: "Complete Grade 9–12 national entrance exam archive",
    mentorship: "180 Days (6 Months)",
    mentorshipDetail: "Continuous entrance exam mentor guidance",
  },
};

const formatMoney = (amountMinor, currency = "ETB") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);

const offerName = (offer) => {
  if (offer.packageType === "SINGLE_COURSE") {
    return `${offer.course?.subject?.name || "Course"} · ${offer.course?.gradeLevel?.replace(
      "_",
      " "
    )}`;
  }
  if (offer.packageType === "FULL_GRADE") {
    return `${offer.gradeLevel?.replace("_", " ")} Full Grade Bundle`;
  }
  return "Grade 9–12 Master Entrance Exam Package";
};

export default function StudentPackagesPage() {
  const navigate = useNavigate();
  const [offers, setOffers] = useState([]);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  // Checkout form
  const [tutors, setTutors] = useState([]);
  const [selectedTutorId, setSelectedTutorId] = useState("");
  const [previewTutor, setPreviewTutor] = useState(null);
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const [payments, setPayments] = useState([]);
  const [access, setAccess] = useState(null);

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTutors, setIsLoadingTutors] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [error, setError] = useState(null);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [offerList, paymentList, learningAccess] = await Promise.all([
        paymentService.getOffers(),
        paymentService.getMyPayments(),
        paymentService.getMyAccess(),
      ]);
      setOffers(offerList);
      setPayments(paymentList);
      setAccess(learningAccess);
    } catch (loadError) {
      setError(
        loadError.response?.data?.error?.message ||
          loadError.message ||
          "Unable to load package catalog."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Load tutors when an offer is selected for checkout
  useEffect(() => {
    let active = true;
    if (!selectedOffer) {
      setTutors([]);
      setSelectedTutorId("");
      return undefined;
    }
    setIsLoadingTutors(true);
    setError(null);
    paymentService
      .getEligibleTutors({
        packageType: selectedOffer.packageType,
        ...(selectedOffer.courseId ? { courseId: selectedOffer.courseId } : {}),
        ...(selectedOffer.gradeLevel ? { gradeLevel: selectedOffer.gradeLevel } : {}),
      })
      .then((items) => {
        if (!active) return;
        setTutors(items);
        setSelectedTutorId(items[0]?.userId || "");
      })
      .catch((loadError) => {
        if (!active) return;
        setError(loadError.response?.data?.error?.message || "Unable to load eligible tutors.");
        setTutors([]);
        setSelectedTutorId("");
      })
      .finally(() => {
        if (active) setIsLoadingTutors(false);
      });
    return () => {
      active = false;
    };
  }, [selectedOffer]);

  // Check if student has an active mentor for a course
  const getOfferMentorStatus = (offer) => {
    if (!access?.packages?.length) {
      return { hasActiveMentor: false };
    }
    const matchingEnrollment = access.packages.find((en) => {
      if (offer.packageType === "SINGLE_COURSE") {
        return (
          en.course?.id === offer.courseId &&
          en.mentorshipActive &&
          Boolean(en.assignedTutor)
        );
      }
      return false;
    });

    if (matchingEnrollment) {
      return {
        hasActiveMentor: true,
        mentorName: matchingEnrollment.assignedTutor?.fullName || "Assigned Mentor",
        expiresAt: matchingEnrollment.mentorshipExpiresAt,
      };
    }
    return { hasActiveMentor: false };
  };

  const handleOpenCheckout = (offer) => {
    const mentorStatus = getOfferMentorStatus(offer);
    if (mentorStatus.hasActiveMentor) {
      setError(
        `You already have an active mentor (${mentorStatus.mentorName}) for this course. Only one active mentor per course is permitted.`
      );
      return;
    }
    setSelectedOffer(offer);
    setIsCheckoutModalOpen(true);
  };

  const handleStartChapaCheckout = async (e) => {
    e.preventDefault();
    if (!selectedOffer || !selectedTutorId) {
      setError("Please select a verified tutor before proceeding.");
      return;
    }
    setIsCheckingOut(true);
    setError(null);
    try {
      const result = await paymentService.createCheckout({
        offerId: selectedOffer.id,
        tutorId: selectedTutorId,
        email: email.trim(),
        ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
      });
      window.location.assign(result.checkoutUrl);
    } catch (checkoutError) {
      setError(
        checkoutError.response?.data?.error?.message ||
          "Unable to initiate Chapa payment."
      );
      setIsCheckingOut(false);
    }
  };

  const getOfferLockStatus = (offer) => {
    if (!access?.packages?.length) {
      return { isUnlocked: false };
    }
    const matchingEnrollment = access.packages.find((en) => {
      if (en.type === "ENTRANCE_GRADE_9_12") return true;
      if (offer.packageType === "ENTRANCE_GRADE_9_12") {
        return en.type === "ENTRANCE_GRADE_9_12";
      }
      if (offer.packageType === "FULL_GRADE") {
        return en.type === "FULL_GRADE" && en.gradeLevel === offer.gradeLevel;
      }
      if (offer.packageType === "SINGLE_COURSE") {
        if (en.type === "FULL_GRADE" && en.gradeLevel === offer.course?.gradeLevel) {
          return true;
        }
        return en.type === "SINGLE_COURSE" && en.course?.id === offer.courseId;
      }
      return false;
    });

    if (matchingEnrollment && matchingEnrollment.accessActive) {
      return {
        isUnlocked: true,
        enrollment: matchingEnrollment,
      };
    }
    return { isUnlocked: false };
  };

  const filteredOffers = offers.filter((o) => {
    if (activeCategory === "ALL") return true;
    return o.packageType === activeCategory;
  });

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <Link
              to="/student"
              className="text-xs font-bold uppercase tracking-wider text-[#013638] hover:underline"
            >
              ← Student Dashboard
            </Link>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
              Courses & Learning Packages
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Unlock comprehensive exams, practice questions, and 1-on-1 tutor mentorship. Strictly one mentor per course.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/quiz"
              className="flex items-center gap-2 rounded-2xl border border-[#013638] bg-white px-4 py-2.5 text-xs font-bold text-[#013638] hover:bg-slate-50 transition"
            >
              <BookOpen className="h-4 w-4" />
              <span>Go to Exams & Quizzes</span>
            </Link>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-4">
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
              activeCategory === "ALL"
                ? "bg-[#013638] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            All Packages ({offers.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("SINGLE_COURSE")}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
              activeCategory === "SINGLE_COURSE"
                ? "bg-[#013638] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            Single Courses
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("FULL_GRADE")}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
              activeCategory === "FULL_GRADE"
                ? "bg-[#013638] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            Full Grade Bundles
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("ENTRANCE_GRADE_9_12")}
            className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
              activeCategory === "ENTRANCE_GRADE_9_12"
                ? "bg-[#013638] text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            }`}
          >
            Entrance Exam Package
          </button>
        </div>

        {/* PACKAGE CARDS GRID */}
        {isLoading ? (
          <div className="py-16 text-center text-sm text-slate-500">
            Loading courses and packages...
          </div>
        ) : filteredOffers.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">No packages in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredOffers.map((offer) => {
              const { isUnlocked, enrollment } = getOfferLockStatus(offer);
              const mentorStatus = getOfferMentorStatus(offer);
              const durationInfo = durations[offer.packageType] || durations.SINGLE_COURSE;

              return (
                <div
                  key={offer.id}
                  className={`relative flex flex-col justify-between rounded-3xl border bg-white p-6 shadow-xs transition-all duration-300 ${
                    isUnlocked
                      ? "border-emerald-300 ring-2 ring-emerald-500/10 hover:shadow-lg"
                      : "border-slate-200/90 hover:border-[#013638]/40 hover:shadow-xl"
                  }`}
                >
                  {/* Top Status Header */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                        {offer.packageType === "SINGLE_COURSE"
                          ? "Single Course"
                          : offer.packageType === "FULL_GRADE"
                          ? "Full Grade Bundle"
                          : "Master Entrance"}
                      </span>

                      {/* Lock / Unlock Status Pill */}
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-800">
                          <Unlock className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Unlocked & Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600">
                          <Lock className="h-3.5 w-3.5 text-slate-400" />
                          <span>Content Locked</span>
                        </span>
                      )}
                    </div>

                    {/* Card Title */}
                    <h3 className="text-xl font-bold text-slate-900 line-clamp-2">
                      {offerName(offer)}
                    </h3>

                    {/* Active Mentor Badge */}
                    {mentorStatus.hasActiveMentor && (
                      <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-teal-50 border border-teal-200/80 px-3 py-2 text-xs font-semibold text-[#013638]">
                        <UserCheck className="h-4 w-4 text-teal-700 shrink-0" />
                        <div>
                          <p className="font-bold">Active Mentor: {mentorStatus.mentorName}</p>
                          <p className="text-[10px] text-teal-800">
                            Valid until {new Date(mentorStatus.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Price in ETB */}
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[#013638]">
                        {formatMoney(offer.amountMinor, offer.currency)}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">/ package</span>
                    </div>

                    {/* Dual Duration Badges */}
                    <div className="mt-5 space-y-2 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5 text-xs">
                      <div className="flex items-start gap-2">
                        <BookOpen className="h-4 w-4 text-[#013638] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">{durationInfo.content}</p>
                          <p className="text-slate-500 text-[11px]">{durationInfo.contentDetail}</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 border-t border-slate-200/60 pt-2">
                        <GraduationCap className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-slate-900">{durationInfo.mentorship}</p>
                          <p className="text-slate-500 text-[11px]">{durationInfo.mentorshipDetail}</p>
                        </div>
                      </div>
                    </div>

                    {/* Feature bullet list */}
                    <ul className="mt-4 space-y-1.5 text-xs text-slate-600">
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Practice quizzes and timed mock exams</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Downloadable lecture notes & video materials</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Live mentor scheduling with top Ethiopian tutors</span>
                      </li>
                    </ul>
                  </div>

                  {/* Card Bottom Action */}
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {isUnlocked ? (
                      <div className="space-y-2">
                        <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>
                            Access expires: {new Date(enrollment.accessExpiresAt).toLocaleDateString()}
                          </span>
                        </p>
                        <Button
                          type="button"
                          onClick={() => navigate("/quiz")}
                          className="w-full flex items-center justify-center gap-1.5 py-3 text-xs font-bold rounded-2xl bg-emerald-700 hover:bg-emerald-800"
                        >
                          <span>Open Quizzes & Exams</span>
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : mentorStatus.hasActiveMentor ? (
                      <div className="space-y-2">
                        <button
                          type="button"
                          disabled
                          className="w-full rounded-2xl border border-slate-300 bg-slate-100 py-3 text-xs font-bold text-slate-500 cursor-not-allowed"
                        >
                          Active Mentor Already Chosen
                        </button>
                        <p className="text-[10px] text-slate-400 text-center">
                          One active mentor per course rule is enforced.
                        </p>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        onClick={() => handleOpenCheckout(offer)}
                        className="w-full flex items-center justify-center gap-2 py-3 text-xs font-bold rounded-2xl bg-[#013638] hover:bg-[#024e51] shadow-md hover:shadow-lg transition"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Unlock with Chapa ({formatMoney(offer.amountMinor, offer.currency)})</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CHECKOUT MODAL: SUBJECT-SPECIFIC MENTOR SELECTION */}
        {isCheckoutModalOpen && selectedOffer && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="rounded-xl bg-[#013638]/10 p-2 text-[#013638]">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">Unlock Course Access</h3>
                    <p className="text-xs text-slate-500">Pay securely via Chapa</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Order Summary */}
              <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-800">{offerName(selectedOffer)}</span>
                  <span className="font-black text-[#013638]">
                    {formatMoney(selectedOffer.amountMinor, selectedOffer.currency)}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Includes full question bank, timed mock exams, study materials, and 1-on-1 mentorship.
                </p>
              </div>

              {/* Strict One-Mentor-Per-Course Notice */}
              <div className="flex items-start gap-2 rounded-2xl bg-blue-50/70 border border-blue-200 p-3 text-xs text-blue-900">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <span>
                  <strong>One Mentor Policy:</strong> You can select only one active mentor per course. Review mentor profiles and select your preferred guide.
                </span>
              </div>

              <form onSubmit={handleStartChapaCheckout} className="space-y-4">
                {/* SELECT MENTOR / TUTOR CARDS */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Select Specialized Mentor *
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {tutors.length} specialized {tutors.length === 1 ? "mentor" : "mentors"} available
                    </span>
                  </div>

                  {isLoadingTutors ? (
                    <div className="rounded-2xl border border-slate-200 p-6 text-center text-xs text-slate-500">
                      Loading subject-specialized mentors...
                    </div>
                  ) : tutors.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 p-6 text-center text-xs text-amber-800">
                      No verified tutors are currently specialized in this subject. Please check back shortly.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {tutors.map((t) => {
                        const isSelected = selectedTutorId === t.userId;
                        return (
                          <div
                            key={t.userId}
                            onClick={() => setSelectedTutorId(t.userId)}
                            className={`cursor-pointer rounded-2xl border p-3 transition flex items-center justify-between ${
                              isSelected
                                ? "border-[#013638] bg-[#013638]/5 ring-1 ring-[#013638]"
                                : "border-slate-200 bg-white hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#013638] to-[#0ea5a7] text-xs font-bold text-white">
                                {t.user.fullName?.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-900 truncate">
                                  {t.user.fullName}
                                </p>
                                <p className="text-[10px] text-slate-500 truncate">
                                  {t.institutionName ? `${t.institutionName} • ` : ""}
                                  {t.educationLevel}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {t.subjects?.slice(0, 2).map((s) => (
                                    <span
                                      key={`${s.subject.name}-${s.gradeLevel}`}
                                      className="rounded bg-teal-50 px-1.5 py-0.5 text-[9px] font-bold text-[#013638]"
                                    >
                                      {s.subject.name}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewTutor(t);
                                }}
                                className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold text-[#013638] hover:bg-slate-100 transition"
                              >
                                View Profile
                              </button>
                              {isSelected ? (
                                <CheckCircle2 className="h-5 w-5 text-[#013638]" />
                              ) : (
                                <div className="h-5 w-5 rounded-full border border-slate-300" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Email Address for Chapa Receipt *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@example.com"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#013638]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Phone Number (Optional for Telebirr / CBEBirr)
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0911223344"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:border-[#013638]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="flex-1 rounded-xl border border-slate-300 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <Button
                    type="submit"
                    disabled={isCheckingOut || !selectedTutorId || !email.trim() || tutors.length === 0}
                    className="flex-2 py-3 text-xs font-bold rounded-xl bg-[#013638]"
                  >
                    {isCheckingOut
                      ? "Redirecting to Chapa..."
                      : `Pay ${formatMoney(selectedOffer.amountMinor, selectedOffer.currency)} with Chapa`}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MENTOR PROFILE PREVIEW MODAL */}
        {previewTutor && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#013638] to-[#0ea5a7] font-bold text-white text-base">
                    {previewTutor.user.fullName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{previewTutor.user.fullName}</h4>
                    <p className="text-[11px] text-teal-700 font-semibold">Verified Subject Mentor</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewTutor(null)}
                  className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Education</span>
                  <p className="font-bold text-slate-800">{previewTutor.educationLevel}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-2.5">
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">Institution</span>
                  <p className="font-bold text-slate-800 truncate">{previewTutor.institutionName || "Academic"}</p>
                </div>
                {previewTutor.fieldOfStudy && (
                  <div className="col-span-2 rounded-xl bg-slate-50 p-2.5">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Field of Study</span>
                    <p className="font-bold text-slate-800">{previewTutor.fieldOfStudy}</p>
                  </div>
                )}
              </div>

              {previewTutor.bio && (
                <div className="text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">About the Mentor</span>
                  <p className="rounded-xl bg-slate-50/80 p-3 italic text-slate-700 leading-relaxed">
                    "{previewTutor.bio}"
                  </p>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">Specialized Subjects</span>
                <div className="flex flex-wrap gap-1.5">
                  {previewTutor.subjects?.map((s) => (
                    <span
                      key={`${s.subject.name}-${s.gradeLevel}`}
                      className="rounded-lg bg-teal-100 px-2 py-1 text-[10px] font-bold text-[#013638]"
                    >
                      {s.subject.name} ({s.gradeLevel.replace("_", " ")})
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  onClick={() => {
                    setSelectedTutorId(previewTutor.userId);
                    setPreviewTutor(null);
                  }}
                  className="w-full text-xs font-bold py-2.5 rounded-xl bg-[#013638]"
                >
                  Select {previewTutor.user.fullName} as My Mentor
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
