import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, ShieldAlert, X } from "lucide-react";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { reportService } from "../services/report.service";

const REPORT_REASONS = [
  "Tutor was absent / missed scheduled live session",
  "Unprofessional conduct or inappropriate communication",
  "Inadequate subject mastery or incorrect explanations",
  "Repeated technical or audio/video issues by tutor",
  "Safety, harassment, or policy violation",
  "Other issue with mentorship",
];

export default function ReportTutorModal({
  isOpen,
  onClose,
  tutorId,
  tutorName,
  courseName,
  conversationId,
  sessionId,
  onReportSubmitted,
}) {
  const [reasonCategory, setReasonCategory] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");
  const [confirmAccurate, setConfirmAccurate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReasonCategory(REPORT_REASONS[0]);
      setDetails("");
      setConfirmAccurate(false);
      setError(null);
      setIsSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tutorId && !conversationId) {
      setError("Cannot identify tutor or conversation for this report.");
      return;
    }
    if (!details.trim() || details.trim().length < 10) {
      setError("Please provide at least 10 characters detailing what occurred.");
      return;
    }
    if (!confirmAccurate) {
      setError("Please verify the confirmation checkbox before submitting.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const fullReason = `[${reasonCategory}] ${details.trim()}${
      courseName ? ` (Course: ${courseName})` : ""
    }${sessionId ? ` (Session ID: ${sessionId})` : ""}`;

    try {
      const payload = tutorId
        ? {
            targetType: "USER_PROFILE",
            targetId: tutorId,
            reason: fullReason,
          }
        : {
            targetType: "CONVERSATION",
            targetId: conversationId,
            reason: fullReason,
          };

      const result = await reportService.submitReport(payload);
      setIsSuccess(true);
      if (onReportSubmitted) {
        onReportSubmitted(result);
      }
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to file report to administrators. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-lg rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-rose-100 p-6 bg-gradient-to-r from-rose-50/60 via-white to-amber-50/40">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-100/80 px-3 py-0.5 text-xs font-bold text-rose-800">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-700" />
              <span>Admin Report</span>
            </div>
            <h3 className="mt-2 text-xl font-extrabold text-slate-900">
              Report Tutor to Administrator
            </h3>
            <p className="mt-0.5 text-xs text-slate-500 font-medium">
              Tutor: <span className="font-bold text-slate-800">{tutorName || "Assigned Tutor"}</span>
              {courseName ? ` · ${courseName}` : ""}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-8 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h4 className="text-lg font-bold text-slate-900">Report Successfully Submitted</h4>
            <p className="text-sm text-slate-600">
              Your report has been received by platform administrators. Our team will review the session records and take appropriate action.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {error && <ErrorMessage message={error} />}

            {/* Confidential notice banner */}
            <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
              <span>
                Reports are treated confidentially and reviewed directly by the admin team in the platform Report Management center.
              </span>
            </div>

            {/* Category selection */}
            <div className="space-y-1.5">
              <label htmlFor="report-category" className="block text-xs font-bold text-slate-700">
                Primary Reason for Report *
              </label>
              <select
                id="report-category"
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/10"
              >
                {REPORT_REASONS.map((reason) => (
                  <option key={reason} value={reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>

            {/* Detailed text */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="report-details" className="block text-xs font-bold text-slate-700">
                  Detailed Explanation *
                </label>
                <span className="text-[11px] text-slate-400">{details.length}/1000</span>
              </div>
              <textarea
                id="report-details"
                required
                rows={4}
                maxLength={1000}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Please describe what happened, any relevant times or dates, and any specific concerns..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/40 p-3 text-xs outline-none transition placeholder:text-slate-400 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-500/10"
              />
            </div>

            {/* Confirmation checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                checked={confirmAccurate}
                onChange={(e) => setConfirmAccurate(e.target.checked)}
                className="accent-rose-600 h-4 w-4 rounded-md mt-0.5"
              />
              <span>
                I confirm that this report is accurate and submitted in good faith for administrative review.
              </span>
            </label>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !confirmAccurate || details.trim().length < 10}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-5 py-2.5 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Submitting..." : "Submit Report to Admin"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
