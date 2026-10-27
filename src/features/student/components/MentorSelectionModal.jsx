import { useCallback, useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Check,
  GraduationCap,
  Loader2,
  RefreshCw,
  Sparkles,
  Star,
  User,
  Users,
  X,
} from "lucide-react";
import { tutorService } from "../../tutors/services/tutor.service";
import { schedulingService } from "../../scheduling/services/scheduling.service";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";

export default function MentorSelectionModal({
  isOpen,
  onClose,
  enrollment,
  onMentorAssigned,
}) {
  const [tutors, setTutors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTutorId, setSelectedTutorId] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState(null);

  const fetchMentors = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(
              new Error("Request timed out. Please check your connection and try again.")
            ),
          7000
        )
      );

      const data = await Promise.race([tutorService.getTutors(), timeoutPromise]);
      const list = Array.isArray(data) ? data : [];
      setTutors(list);

      if (enrollment?.assignedTutorId) {
        setSelectedTutorId(enrollment.assignedTutorId);
      } else if (list.length > 0) {
        setSelectedTutorId(list[0].userId || list[0].id);
      }
    } catch (err) {
      console.error("[MentorSelectionModal] Failed to load mentors:", err);
      const msg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        "Unable to load available mentors. Please check your network connection.";
      setError(msg);
      setTutors([]);
    } finally {
      setIsLoading(false);
    }
  }, [enrollment?.assignedTutorId]);

  useEffect(() => {
    if (isOpen) {
      fetchMentors();
    } else {
      setTutors([]);
      setIsLoading(false);
      setError(null);
      setSelectedTutorId(null);
    }
  }, [isOpen, fetchMentors]);

  if (!isOpen) return null;

  const isLocked = Boolean(enrollment?.assignedTutorId);

  const handleConfirmAssignment = async () => {
    if (!selectedTutorId || !enrollment?.id || isLocked) return;

    setIsAssigning(true);
    setError(null);

    try {
      const result = await schedulingService.assignMentor({
        enrollmentId: enrollment.id,
        tutorId: selectedTutorId,
      });

      if (onMentorAssigned) {
        onMentorAssigned(result);
      }
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.message ||
          "Failed to assign mentor. Please try again."
      );
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden text-left">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-800">
              <Sparkles className="h-3 w-3 text-emerald-600" />
              <span>Mentor Match</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              {isLocked ? "Your Assigned Mentor" : "Select Your 1-on-1 Mentor"}
            </h2>
            <p className="text-xs text-slate-500">
              {isLocked
                ? "Your mentor choice is locked and active for this course package."
                : "Choose an approved subject expert to guide your studies and schedule weekly live sessions."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="flex flex-col py-16 items-center justify-center gap-3 text-xs text-slate-500">
              <Loader2 className="h-7 w-7 animate-spin text-[#013638]" />
              <span className="font-semibold text-slate-700">Finding available mentors...</span>
              <span className="text-[11px] text-slate-400">Loading verified subject experts</span>
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center space-y-3">
              <ErrorMessage message={error} />
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchMentors}
                  className="text-xs font-bold gap-1.5 mx-auto"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Retry Fetching Mentors</span>
                </Button>
              </div>
            </div>
          ) : tutors.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-200 p-10 text-center space-y-3 bg-slate-50/50">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs border border-slate-200 text-slate-400">
                <Users className="h-6 w-6 text-slate-500" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-800">No Mentors Currently Available</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  There are no verified mentors active at the moment. Please check back shortly or click refresh.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={fetchMentors}
                className="text-xs font-bold gap-1.5"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Refresh Mentors</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {!enrollment?.id && !isLocked && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-3.5 text-xs text-amber-800 flex items-center gap-2">
                  <span className="font-semibold">Notice:</span>
                  <span>An active course package enrollment is required to assign a mentor. You can still review available mentors below.</span>
                </div>
              )}
              <div className="grid grid-cols-1 gap-3">
              {tutors.map((tutor) => {
                const tutorId = tutor.userId || tutor.id;
                const isSelected = selectedTutorId === tutorId;
                const tutorName = tutor.user?.fullName || "Instructor";

                return (
                  <div
                    key={tutorId}
                    onClick={() => !isLocked && setSelectedTutorId(tutorId)}
                    className={`cursor-pointer rounded-2xl border p-4 transition ${
                      isSelected
                        ? "border-[#013638] bg-[#013638]/5 ring-2 ring-[#013638]/20"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#013638] text-white font-bold text-base shadow-xs">
                          {tutorName.charAt(0).toUpperCase()}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-slate-900 text-sm">
                              {tutorName}
                            </h3>
                            {tutor.institutionName && (
                              <span className="text-[11px] text-slate-500 font-medium">
                                • {tutor.institutionName}
                              </span>
                            )}
                            {tutor.avgRating && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                <span>{tutor.avgRating}</span>
                              </span>
                            )}
                          </div>
                          {tutor.bio && (
                            <p className="text-xs text-slate-600 line-clamp-2">
                              {tutor.bio}
                            </p>
                          )}
                          {tutor.subjects && tutor.subjects.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 pt-1">
                              {tutor.subjects.map((sub, i) => (
                                <span
                                  key={i}
                                  className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700"
                                >
                                  {sub.subject?.name || sub.gradeLevel || "Mentorship Subject"}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div
                        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition ${
                          isSelected
                            ? "border-[#013638] bg-[#013638] text-white"
                            : "border-slate-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="h-3.5 w-3.5" />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>
          {isLocked ? (
            <Button
              type="button"
              onClick={onClose}
              className="text-xs font-bold"
            >
              Close (Mentor Locked)
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleConfirmAssignment}
              disabled={
                !selectedTutorId ||
                isAssigning ||
                isLoading ||
                tutors.length === 0 ||
                !enrollment?.id
              }
              className="text-xs font-bold"
            >
              {isAssigning
                ? "Assigning Mentor..."
                : !enrollment?.id
                ? "Select Package First"
                : "Confirm & Assign Mentor"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
