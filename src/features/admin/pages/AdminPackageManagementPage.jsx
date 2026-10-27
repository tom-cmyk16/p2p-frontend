import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  GraduationCap,
  Layers,
  Package,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { adminService } from "../services/admin.service";
import { paymentService } from "../../payments/services/payment.service";

const gradeLevels = [
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
];

const packageRules = {
  SINGLE_COURSE: "1 week live mentorship · 3 sessions · 1 month practice & exam access",
  FULL_GRADE: "2 months live mentorship · 4 months practice & exam access",
  ENTRANCE_GRADE_9_12: "6 months live mentorship · 12 months practice & exam access",
};

const formatMoney = (amountMinor, currency = "ETB") =>
  new Intl.NumberFormat(undefined, { style: "currency", currency }).format(amountMinor / 100);

const getErrorMessage = (error, fallback) =>
  error.response?.data?.error?.message ||
  error.response?.data?.message ||
  error.message ||
  fallback;

export default function AdminPackageManagementPage() {
  const [subjects, setSubjects] = useState([]);
  const [courses, setCourses] = useState([]);
  const [packageOffers, setPackageOffers] = useState([]);

  // Course Form State
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseSubjectId, setCourseSubjectId] = useState("");
  const [courseGradeLevel, setCourseGradeLevel] = useState("GRADE_9");
  const [isCore, setIsCore] = useState(true);
  // Dual Duration Settings for Course
  const [contentAccessDays, setContentAccessDays] = useState(30);
  const [mentorshipDurationDays, setMentorshipDurationDays] = useState(7);

  // Bundle / Package Pricing Form State
  const [offerType, setOfferType] = useState("SINGLE_COURSE");
  const [offerCourseId, setOfferCourseId] = useState("");
  const [offerGradeLevel, setOfferGradeLevel] = useState("GRADE_9");
  const [standardPrice, setStandardPrice] = useState("");
  const [pricingMode, setPricingMode] = useState("STANDARD");
  const [customPrice, setCustomPrice] = useState("");
  const [offerActive, setOfferActive] = useState(true);
  // Package Dual Durations
  const [packageContentDays, setPackageContentDays] = useState(120);
  const [packageMentorshipDays, setPackageMentorshipDays] = useState(60);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [subjectList, courseList, offerList] = await Promise.all([
          adminService.getSubjects(),
          adminService.getLearningCourses(),
          paymentService.getManagedOffers(),
        ]);
        setSubjects(subjectList);
        setCourses(courseList);
        setCourseSubjectId(subjectList[0]?.id || "");
        setOfferCourseId(courseList[0]?.id || "");
        setPackageOffers(offerList);
      } catch (requestError) {
        setError(getErrorMessage(requestError, "Unable to load course catalog"));
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const offerId =
    offerType === "SINGLE_COURSE"
      ? `${offerType}:${offerCourseId}`
      : offerType === "FULL_GRADE"
      ? `${offerType}:${offerGradeLevel}`
      : `${offerType}:all`;

  const matchingOffer = packageOffers.find((offer) => offer.id === offerId);

  useEffect(() => {
    setStandardPrice(matchingOffer ? (matchingOffer.standardAmountMinor / 100).toFixed(2) : "");
    setPricingMode(matchingOffer?.pricingMode || "STANDARD");
    setCustomPrice(
      matchingOffer?.customAmountMinor != null
        ? (matchingOffer.customAmountMinor / 100).toFixed(2)
        : ""
    );
    setOfferActive(matchingOffer?.active ?? true);

    if (offerType === "SINGLE_COURSE") {
      setPackageContentDays(30);
      setPackageMentorshipDays(7);
    } else if (offerType === "FULL_GRADE") {
      setPackageContentDays(120);
      setPackageMentorshipDays(60);
    } else {
      setPackageContentDays(365);
      setPackageMentorshipDays(180);
    }
  }, [matchingOffer, offerType]);

  const runAction = async (action, message) => {
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(message);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "The operation failed"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCourse = async (event) => {
    event.preventDefault();
    await runAction(async () => {
      const payload = {
        subjectId: courseSubjectId,
        gradeLevel: courseGradeLevel,
        isCore,
        contentAccessDays: Number(contentAccessDays) || 30,
        mentorshipDurationDays: Number(mentorshipDurationDays) || 7,
      };
      const course = editingCourseId
        ? await adminService.updateLearningCourse(editingCourseId, payload)
        : await adminService.createLearningCourse(payload);

      setCourses((current) => {
        const refreshed = editingCourseId
          ? current.map((item) => (item.id === course.id ? course : item))
          : [...current, course];
        return refreshed.sort(
          (first, second) =>
            first.gradeLevel.localeCompare(second.gradeLevel) ||
            first.subject.name.localeCompare(second.subject.name)
        );
      });
      setEditingCourseId(null);
      setContentAccessDays(30);
      setMentorshipDurationDays(7);
    }, editingCourseId ? "Course and dual durations updated." : "New course added with dual durations.");
  };

  const handleEditCourse = (course) => {
    setEditingCourseId(course.id);
    setCourseSubjectId(course.subject.id);
    setCourseGradeLevel(course.gradeLevel);
    setIsCore(course.isCore);
    setContentAccessDays(course.contentAccessDays || 30);
    setMentorshipDurationDays(course.mentorshipDurationDays || 7);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDeleteCourse = async (course) => {
    if (
      !window.confirm(
        `Delete ${course.subject.name} · ${course.gradeLevel.replace(
          "_",
          " "
        )}? Courses already in use cannot be deleted.`
      )
    )
      return;
    await runAction(async () => {
      await adminService.deleteLearningCourse(course.id);
      setCourses((current) => current.filter((item) => item.id !== course.id));
    }, "Course removed.");
  };

  const handleSaveOffer = async (event) => {
    event.preventDefault();
    if (offerType === "SINGLE_COURSE" && !offerCourseId) {
      setError("Please select a course before setting pricing.");
      return;
    }
    await runAction(async () => {
      const offer = await paymentService.saveOffer({
        packageType: offerType,
        ...(offerType === "SINGLE_COURSE" ? { courseId: offerCourseId } : {}),
        ...(offerType === "FULL_GRADE" ? { gradeLevel: offerGradeLevel } : {}),
        pricingMode,
        standardAmount: Number(standardPrice),
        ...(pricingMode === "CUSTOM" ? { customAmount: Number(customPrice) } : {}),
        contentAccessDays: Number(packageContentDays),
        mentorshipDurationDays: Number(packageMentorshipDays),
        active: offerActive,
      });
      setPackageOffers((current) => [
        ...current.filter((item) => item.id !== offer.id),
        offer,
      ]);
    }, "Package offer & bundle pricing saved.");
  };

  // Grouped courses for bundles preview
  const coursesByGrade = gradeLevels.map((g) => ({
    ...g,
    courses: courses.filter((c) => c.gradeLevel === g.value),
  }));

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        {/* Header */}
        <div>
          <Link
            to="/admin"
            className="text-xs font-bold uppercase tracking-wider text-[#013638] hover:underline"
          >
            ← Admin Dashboard
          </Link>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
            Course Bundles & Dual Duration Pricing
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Configure single courses and Full Grade Bundles with separate Content Access and Tutor Mentorship durations.
          </p>
        </div>

        {error && <ErrorMessage message={error} />}
        {success && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
            {success}
          </div>
        )}

        {/* SECTION 1: Course Bundles Overview */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#013638]">
                Course Bundling
              </span>
              <h2 className="text-xl font-bold text-slate-900">
                Full Grade Bundles & Entrance Packages
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Single courses automatically roll up into their respective Full Grade & Entrance Bundles
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {coursesByGrade.map((bundle) => (
              <div
                key={bundle.value}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900">{bundle.label} Bundle</h3>
                  <span className="rounded-full bg-[#013638]/10 px-2 py-0.5 text-[10px] font-bold text-[#013638]">
                    {bundle.courses.length} Courses
                  </span>
                </div>

                <ul className="space-y-1 text-xs text-slate-600 min-h-16">
                  {bundle.courses.length ? (
                    bundle.courses.map((c) => (
                      <li key={c.id} className="flex items-center gap-1.5 truncate">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#013638]" />
                        <span className="truncate">{c.subject.name}</span>
                        {c.isCore && (
                          <span className="text-[10px] text-amber-700 font-semibold">(Core)</span>
                        )}
                      </li>
                    ))
                  ) : (
                    <li className="text-slate-400 italic">No courses added yet.</li>
                  )}
                </ul>

                <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500 space-y-0.5">
                  <p>📚 Content Access: 120 Days</p>
                  <p>👨‍🏫 Mentorship: 60 Days</p>
                </div>
              </div>
            ))}
          </div>

          {/* Master Entrance Package Banner */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-600 p-2 text-white">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h4 className="font-bold text-purple-950">
                  Grades 9–12 Master Entrance Exam Package
                </h4>
                <p className="text-xs text-purple-700 mt-0.5">
                  Includes all {courses.length} courses across Grade 9 through Grade 12 for Ethiopian National Entrance Exam prep.
                </p>
              </div>
            </div>
            <div className="text-right text-xs font-semibold text-purple-900 bg-white/80 rounded-xl px-3.5 py-2 border border-purple-200">
              <span>Dual Durations: 365 Days Content · 180 Days Mentorship</span>
            </div>
          </div>
        </section>

        {/* SECTION 2: Course Creator with Dual Duration Settings */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold text-slate-900">
              {editingCourseId ? "Edit Course & Durations" : "Create Course with Dual Durations"}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Specify separate validity periods for Course Content Access and Tutor Mentorship.
            </p>
          </div>

          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Subject *
                </label>
                <select
                  required
                  value={courseSubjectId}
                  onChange={(e) => setCourseSubjectId(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#013638]"
                >
                  <option value="">Select subject</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Grade Level *
                </label>
                <select
                  value={courseGradeLevel}
                  onChange={(e) => setCourseGradeLevel(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-[#013638]"
                >
                  {gradeLevels.map((g) => (
                    <option key={g.value} value={g.value}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* DUAL DURATION 1: Content Access Duration */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  a) Content Access Duration *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={contentAccessDays}
                    onChange={(e) => setContentAccessDays(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm pr-14 outline-none focus:border-[#013638]"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                    DAYS
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  For notes, materials, videos & quizzes
                </p>
              </div>

              {/* DUAL DURATION 2: Tutor Mentorship Duration */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  b) Tutor Mentorship Duration *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={mentorshipDurationDays}
                    onChange={(e) => setMentorshipDurationDays(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm pr-14 outline-none focus:border-[#013638]"
                  />
                  <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">
                    DAYS
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  For live sessions, chat & schedule booking
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={isCore}
                  onChange={(e) => setIsCore(e.target.checked)}
                  className="accent-[#013638] h-4 w-4"
                />
                <span className="font-medium">
                  Core curriculum course (Required for sequential grade progression)
                </span>
              </label>

              <div className="flex items-center gap-2">
                {editingCourseId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCourseId(null);
                      setContentAccessDays(30);
                      setMentorshipDurationDays(7);
                    }}
                    className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
                <Button type="submit" disabled={isSaving || !courseSubjectId}>
                  {isSaving ? "Saving..." : editingCourseId ? "Update Course" : "Save Course"}
                </Button>
              </div>
            </div>
          </form>

          {/* Existing Courses Table */}
          <div className="mt-4 border-t border-slate-100 pt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Course</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Content Duration</th>
                  <th className="px-4 py-2.5">Mentorship Duration</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {c.subject.name} · {c.gradeLevel.replace("_", " ")}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                          c.isCore
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {c.isCore ? "Core Course" : "Elective"}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">
                      {c.contentAccessDays || 30} Days
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-slate-700">
                      {c.mentorshipDurationDays || 7} Days
                    </td>
                    <td className="px-4 py-2.5 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => handleEditCourse(c)}
                        className="font-bold text-[#013638] hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCourse(c)}
                        className="font-bold text-rose-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SECTION 3: Package Pricing & Dual Durations */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-xl font-bold text-slate-900">Package Pricing & Settings</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Set standard or custom override pricing and verify package dual durations.
            </p>
          </div>

          <form onSubmit={handleSaveOffer} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Package Type
                </label>
                <select
                  value={offerType}
                  onChange={(e) => setOfferType(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none"
                >
                  <option value="SINGLE_COURSE">Single Course</option>
                  <option value="FULL_GRADE">Full Grade Bundle</option>
                  <option value="ENTRANCE_GRADE_9_12">Grade 9–12 Entrance</option>
                </select>
              </div>

              {offerType === "SINGLE_COURSE" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Select Course
                  </label>
                  <select
                    required
                    value={offerCourseId}
                    onChange={(e) => setOfferCourseId(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none"
                  >
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.subject.name} · {c.gradeLevel.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {offerType === "FULL_GRADE" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Select Grade Bundle
                  </label>
                  <select
                    value={offerGradeLevel}
                    onChange={(e) => setOfferGradeLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none"
                  >
                    {gradeLevels.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label} Full Bundle
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Standard Price (ETB) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  required
                  value={standardPrice}
                  onChange={(e) => setStandardPrice(e.target.value)}
                  placeholder="300.00"
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none focus:border-[#013638]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Pricing Mode
                </label>
                <select
                  value={pricingMode}
                  onChange={(e) => setPricingMode(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none"
                >
                  <option value="STANDARD">Standard Price</option>
                  <option value="CUSTOM">Custom Price Override</option>
                </select>
              </div>

              {pricingMode === "CUSTOM" && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Custom Override (ETB) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={customPrice}
                    onChange={(e) => setCustomPrice(e.target.value)}
                    placeholder="250.00"
                    className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-sm outline-none"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={offerActive}
                  onChange={(e) => setOfferActive(e.target.checked)}
                  className="accent-[#013638] h-4 w-4"
                />
                <span className="font-medium">Active for student purchase via Chapa</span>
              </label>

              <Button type="submit" disabled={isSaving || !standardPrice}>
                {isSaving ? "Saving..." : "Save Package Offer"}
              </Button>
            </div>
          </form>

          {/* Configured Offers Table */}
          <div className="mt-4 border-t border-slate-100 pt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-2.5">Package</th>
                  <th className="px-4 py-2.5">Pricing Mode</th>
                  <th className="px-4 py-2.5">Effective Price</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {packageOffers.map((offer) => {
                  const title =
                    offer.packageType === "SINGLE_COURSE"
                      ? `${offer.course?.subject?.name || "Course"} · ${offer.course?.gradeLevel?.replace(
                          "_",
                          " "
                        )}`
                      : offer.packageType === "FULL_GRADE"
                      ? `${offer.gradeLevel?.replace("_", " ")} Full Grade Bundle`
                      : "Grade 9–12 Entrance Package";

                  return (
                    <tr key={offer.id}>
                      <td className="px-4 py-2.5 font-bold text-slate-900">{title}</td>
                      <td className="px-4 py-2.5 text-slate-600">
                        {offer.pricingMode === "CUSTOM" ? "Custom Override" : "Standard"}
                      </td>
                      <td className="px-4 py-2.5 font-bold text-slate-900">
                        {formatMoney(offer.amountMinor, offer.currency)}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            offer.active
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {offer.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </main>
  );
}
