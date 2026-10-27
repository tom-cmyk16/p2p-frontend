import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  FileText,
  GraduationCap,
  Mail,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { adminService } from "../services/admin.service";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";
import Loader from "../../../components/common/Loader";

const reportStatuses = [
  { value: "ALL", label: "All Reports" },
  { value: "PENDING", label: "Pending Review" },
  { value: "REVIEWED", label: "Reviewed" },
  { value: "ACTION_TAKEN", label: "Action Taken" },
  { value: "DISMISSED", label: "Dismissed" },
];

export default function AdminReportsPage() {
  const [reports, setReports] = useState([]);
  const [reportStatus, setReportStatus] = useState("PENDING");
  const [searchReportId, setSearchReportId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  // Reassignment modal state
  const [activeReport, setActiveReport] = useState(null);
  const [replacementData, setReplacementData] = useState(null);
  const [selectedReplacementTutorId, setSelectedReplacementTutorId] = useState("");
  const [reassignmentNotes, setReassignmentNotes] = useState("");
  const [isLoadingReplacements, setIsLoadingReplacements] = useState(false);
  const [isSubmittingReassignment, setIsSubmittingReassignment] = useState(false);

  const fetchReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      if (searchReportId.trim()) {
        const singleReport = await adminService.getReportById(searchReportId.trim());
        setReports(singleReport ? [singleReport] : []);
      } else {
        const statusParam = reportStatus === "ALL" ? "" : reportStatus;
        const result = await adminService.getOpenReports(statusParam);
        setReports(result);
      }
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          requestError.response?.data?.message ||
          "Failed to load reports"
      );
    } finally {
      setIsLoading(false);
    }
  }, [reportStatus, searchReportId]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const changeStatus = async (reportId, status) => {
    setError(null);
    setSuccessMessage("");
    try {
      await adminService.resolveReport(reportId, status);
      setReports((currentReports) =>
        currentReports.map((r) => (r.id === reportId ? { ...r, status } : r))
      );
      setSuccessMessage(`Report ${reportId.slice(0, 8)}... marked as ${status.replaceAll("_", " ")}.`);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          requestError.response?.data?.message ||
          "Failed to update report status"
      );
    }
  };

  const handleOpenReassignModal = async (report) => {
    setActiveReport(report);
    setSelectedReplacementTutorId("");
    setReassignmentNotes("");
    setIsLoadingReplacements(true);
    setError(null);

    try {
      const data = await adminService.getReplacementTutors(report.id);
      setReplacementData(data);
      if (data.tutors?.length > 0) {
        setSelectedReplacementTutorId(data.tutors[0].userId);
      }
    } catch (loadError) {
      setError(
        loadError.response?.data?.error?.message ||
          "Unable to load replacement tutors for this course."
      );
    } finally {
      setIsLoadingReplacements(false);
    }
  };

  const handleCloseReassignModal = () => {
    setActiveReport(null);
    setReplacementData(null);
    setSelectedReplacementTutorId("");
  };

  const handleConfirmReassign = async () => {
    if (!activeReport || !selectedReplacementTutorId) return;
    setIsSubmittingReassignment(true);
    setError(null);
    setSuccessMessage("");

    try {
      const result = await adminService.reassignReportTutor(
        activeReport.id,
        selectedReplacementTutorId,
        reassignmentNotes
      );
      setSuccessMessage(
        `Offending mentor removed and new verified mentor (${result.reassignedTo?.fullName}) successfully assigned to student!`
      );
      handleCloseReassignModal();
      fetchReports();
    } catch (submitError) {
      setError(
        submitError.response?.data?.error?.message ||
          "Failed to reassign mentor."
      );
    } finally {
      setIsSubmittingReassignment(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/admin" className="text-xs font-bold uppercase tracking-wider text-[#013638] hover:underline">
              ← Admin Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              Report Management & Mentor Reassignment
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Review misconduct & harassment reports, inspect offending tutors, and reassign students to verified mentors.
            </p>
          </div>
          <Button onClick={fetchReports} disabled={isLoading} className="text-xs font-bold py-2.5 px-4 rounded-2xl">
            {isLoading ? "Refreshing..." : "Refresh Reports"}
          </Button>
        </header>

        {error && <ErrorMessage message={error} />}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
              {reportStatuses.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSearchReportId("");
                    setReportStatus(value);
                  }}
                  className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                    reportStatus === value && !searchReportId
                      ? "bg-[#013638] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Direct ID Search */}
            <div className="relative min-w-[280px]">
              <Search className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchReportId}
                onChange={(e) => setSearchReportId(e.target.value)}
                placeholder="View report by exact ID..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 outline-none focus:border-[#013638] focus:bg-white focus:ring-2 focus:ring-[#013638]/15"
              />
            </div>
          </div>
        </div>

        {/* Reports List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              <Loader label="Loading reports..." />
            </div>
          ) : reports.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-slate-300" />
              <h3 className="mt-3 text-sm font-bold text-slate-800">No reports found</h3>
              <p className="mt-1 text-xs text-slate-500">
                There are no {reportStatus !== "ALL" ? reportStatus.toLowerCase() : ""} reports to display.
              </p>
            </div>
          ) : (
            reports.map((report) => {
              const isTutorReport =
                report.reportedUser?.role === "TUTOR" ||
                report.reportedConversation?.tutorId;

              return (
                <article
                  key={report.id}
                  className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xs hover:border-[#013638]/30 transition space-y-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1.5 rounded-xl bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-900">
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                          <span>{report.reason || "Misconduct / Harassment Report"}</span>
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                            report.status === "ACTION_TAKEN"
                              ? "bg-emerald-100 text-emerald-800"
                              : report.status === "DISMISSED"
                              ? "bg-slate-100 text-slate-700"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {report.status.replaceAll("_", " ")}
                        </span>

                        <span className="text-[11px] text-slate-400">
                          Target: {report.targetType}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                        <div>
                          <span className="text-slate-400 font-medium">Reporting Student:</span>
                          <p className="font-bold text-slate-900">
                            {report.reporter?.fullName || "Student"}
                            {report.reporter?.phoneOrEmail && (
                              <span className="ml-1 text-slate-500 font-normal">
                                ({report.reporter.phoneOrEmail})
                              </span>
                            )}
                          </p>
                        </div>

                        {report.reportedUser && (
                          <div>
                            <span className="text-slate-400 font-medium">Reported Tutor:</span>
                            <p className="font-bold text-red-700">
                              {report.reportedUser.fullName}
                              <span className="ml-1 text-slate-500 font-normal">
                                ({report.reportedUser.phoneOrEmail})
                              </span>
                            </p>
                          </div>
                        )}
                      </div>

                      {report.reportedMessage?.textContent && (
                        <div className="rounded-2xl bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-700 space-y-1">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            Reported Content / Snippet:
                          </span>
                          <p className="italic">"{report.reportedMessage.textContent}"</p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                        <span>Report ID:</span>
                        <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-700">
                          {report.id}
                        </code>
                        <span>•</span>
                        <span>{new Date(report.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                      {isTutorReport && report.status !== "ACTION_TAKEN" && (
                        <Button
                          type="button"
                          onClick={() => handleOpenReassignModal(report)}
                          className="flex items-center gap-1.5 rounded-2xl bg-red-700 hover:bg-red-800 text-xs font-bold py-2 px-3.5 shadow-sm text-white"
                        >
                          <UserMinus className="h-3.5 w-3.5" />
                          <span>Remove & Reassign Mentor</span>
                        </Button>
                      )}

                      {report.status === "PENDING" && (
                        <button
                          type="button"
                          onClick={() => changeStatus(report.id, "REVIEWED")}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                        >
                          Mark Reviewed
                        </button>
                      )}

                      {report.status !== "DISMISSED" && report.status !== "ACTION_TAKEN" && (
                        <button
                          type="button"
                          onClick={() => changeStatus(report.id, "DISMISSED")}
                          className="rounded-2xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                        >
                          Dismiss
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* REMOVE & REASSIGN MENTOR MODAL */}
        {activeReport && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-5">
              <div className="flex items-start justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="rounded-2xl bg-red-100 p-2 text-red-700">
                    <ShieldAlert className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900">Remove & Reassign Mentor</h3>
                    <p className="text-xs text-slate-500">
                      Unassign offending tutor and assign a new verified mentor
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseReassignModal}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Case Summary */}
              <div className="rounded-2xl bg-amber-50/70 border border-amber-200 p-4 space-y-2 text-xs">
                <p className="font-bold text-amber-950">Reported Misconduct Overview</p>
                <p className="text-amber-900">
                  Student: <strong>{activeReport.reporter?.fullName}</strong>
                </p>
                <p className="text-amber-900">
                  Offending Mentor:{" "}
                  <strong>{activeReport.reportedUser?.fullName || "Assigned Tutor"}</strong>
                </p>
                <p className="text-amber-900">
                  Reason: <em>{activeReport.reason || "Misconduct reported"}</em>
                </p>
              </div>

              {/* Course Affected */}
              {replacementData?.targetEnrollment && (
                <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 text-xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Affected Subject / Course
                  </span>
                  <p className="font-black text-slate-900">
                    {replacementData.targetEnrollment.course?.subject?.name || "Subject"}{" "}
                    · {replacementData.targetEnrollment.gradeLevel?.replace("_", " ")}
                  </p>
                </div>
              )}

              {/* Select Replacement Mentor */}
              <div className="space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Select New Verified Replacement Mentor *
                </label>

                {isLoadingReplacements ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    Loading verified tutors specialized in this subject...
                  </div>
                ) : !replacementData?.tutors?.length ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-500">
                    No alternative approved mentors found for this subject.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {replacementData.tutors.map((tutor) => {
                      const isSelected = selectedReplacementTutorId === tutor.userId;
                      return (
                        <div
                          key={tutor.userId}
                          onClick={() => setSelectedReplacementTutorId(tutor.userId)}
                          className={`cursor-pointer rounded-2xl border p-3.5 transition flex items-center justify-between ${
                            isSelected
                              ? "border-[#013638] bg-[#013638]/5 ring-1 ring-[#013638]"
                              : "border-slate-200 hover:border-slate-300 bg-white"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-700 font-bold text-white text-xs">
                              {tutor.user.fullName?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-bold text-xs text-slate-900">
                                {tutor.user.fullName}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                {tutor.institutionName} · {tutor.educationLevel}
                              </p>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className="h-5 w-5 text-[#013638]" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Reassignment Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Resolution Notes (Optional)
                </label>
                <textarea
                  rows={2}
                  value={reassignmentNotes}
                  onChange={(e) => setReassignmentNotes(e.target.value)}
                  placeholder="Record administrative decision notes..."
                  className="w-full rounded-2xl border border-slate-300 p-3 text-xs outline-none focus:border-[#013638]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleCloseReassignModal}
                  className="flex-1 rounded-2xl border border-slate-200 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <Button
                  type="button"
                  disabled={
                    isSubmittingReassignment ||
                    !selectedReplacementTutorId ||
                    isLoadingReplacements
                  }
                  onClick={handleConfirmReassign}
                  className="flex-2 rounded-2xl bg-[#013638] py-3 text-xs font-bold"
                >
                  {isSubmittingReassignment
                    ? "Reassigning Mentor..."
                    : "Confirm & Assign New Mentor"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
