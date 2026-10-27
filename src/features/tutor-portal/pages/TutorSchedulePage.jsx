import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useSearchParams } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  GraduationCap,
  Plus,
  Trash2,
  UserCheck,
  Video,
  X,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { useAuthContext } from "../../../context/AuthContext";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { schedulingService } from "../../scheduling/services/scheduling.service";
import UpcomingSessions from "../../scheduling/components/UpcomingSessions";
import Button from "../../../components/common/Button";

const toLocalInput = (date) => {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

const getAvailabilityErrorMessage = (error) => {
  const responseError = error.response?.data?.error;
  const details = responseError?.details;
  if (Array.isArray(details) && details.length > 0) {
    return details
      .map(({ field, message }) => `${field ? `${field}: ` : ""}${message}`)
      .join(" ");
  }
  return responseError?.message || error.message || "Unable to save availability.";
};

export default function TutorSchedulePage() {
  const { user } = useAuthContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [startsAt, setStartsAt] = useState(() => toLocalInput(new Date(Date.now() + 86400000)));
  const [endsAt, setEndsAt] = useState(() => toLocalInput(new Date(Date.now() + 86400000 + 3600000)));
  const [availability, setAvailability] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  // Weekly Mentorship Scheduling Modal State
  const [selectedStudentForSchedule, setSelectedStudentForSchedule] = useState(null);
  const [slot1Start, setSlot1Start] = useState(() => toLocalInput(new Date(Date.now() + 86400000)));
  const [slot1End, setSlot1End] = useState(() => toLocalInput(new Date(Date.now() + 86400000 + 3600000)));
  const [slot2Start, setSlot2Start] = useState(() => toLocalInput(new Date(Date.now() + 3 * 86400000)));
  const [slot2End, setSlot2End] = useState(() => toLocalInput(new Date(Date.now() + 3 * 86400000 + 3600000)));
  const [slot3Start, setSlot3Start] = useState(() => toLocalInput(new Date(Date.now() + 5 * 86400000)));
  const [slot3End, setSlot3End] = useState(() => toLocalInput(new Date(Date.now() + 5 * 86400000 + 3600000)));
  const [isBookingWeekly, setIsBookingWeekly] = useState(false);
  const [bookingError, setBookingError] = useState(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [slots, googleStatus, students] = await Promise.all([
        schedulingService.getAvailability({
          tutorId: user.id,
          from: new Date().toISOString(),
          to: new Date(Date.now() + 30 * 86400000).toISOString(),
        }),
        schedulingService.getGoogleStatus(),
        schedulingService.getAssignedStudents().catch(() => []),
      ]);
      setAvailability(slots);
      setGoogleConnected(googleStatus.connected);
      setAssignedStudents(Array.isArray(students) ? students : []);
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          "Unable to load tutor availability and assigned students.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const calendar = searchParams.get("calendar");
    if (calendar === "connected") {
      setNotice("Google Calendar is connected. New bookings will receive Google Meet links.");
      setSearchParams({}, { replace: true });
    } else if (calendar === "denied") {
      setError("Google Calendar access was not granted. Connect Google Calendar before students book sessions.");
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  if (user?.role !== "TUTOR") return <Navigate to="/" replace />;

  const addAvailability = async (event) => {
    event.preventDefault();
    const start = new Date(startsAt);
    const end = new Date(endsAt);
    const duration = end.getTime() - start.getTime();
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
      setError("Enter valid start and end date-times.");
      return;
    }
    if (start <= new Date()) {
      setError("Availability must start in the future.");
      return;
    }
    if (duration < 30 * 60 * 1000 || duration > 180 * 60 * 1000) {
      setError("Availability must last between 30 and 180 minutes.");
      return;
    }

    setIsSaving(true);
    setError(null);
    setNotice(null);
    try {
      await schedulingService.createAvailability({
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
      });
      setNotice("Availability saved successfully.");
      await refresh();
    } catch (saveError) {
      setError(getAvailabilityErrorMessage(saveError));
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSlot = async (id) => {
    setError(null);
    try {
      await schedulingService.deleteAvailability(id);
      setAvailability((current) => current.filter((slot) => slot.id !== id));
    } catch (deleteError) {
      setError(deleteError.response?.data?.error?.message || "Unable to remove this time slot.");
    }
  };

  const connectCalendar = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const result = await schedulingService.connectGoogleCalendar();
      window.location.assign(result.authorizationUrl);
    } catch (connectError) {
      setError(
        connectError.response?.data?.error?.message ||
          "Unable to connect Google Calendar. Contact the platform administrator if setup is incomplete.",
      );
      setIsConnecting(false);
    }
  };

  const handleOpenScheduleModal = (student) => {
    setSelectedStudentForSchedule(student);
    setBookingError(null);
    // Prefill 3 upcoming dates (e.g. tomorrow, 3 days later, 5 days later)
    setSlot1Start(toLocalInput(new Date(Date.now() + 86400000)));
    setSlot1End(toLocalInput(new Date(Date.now() + 86400000 + 3600000)));
    setSlot2Start(toLocalInput(new Date(Date.now() + 3 * 86400000)));
    setSlot2End(toLocalInput(new Date(Date.now() + 3 * 86400000 + 3600000)));
    setSlot3Start(toLocalInput(new Date(Date.now() + 5 * 86400000)));
    setSlot3End(toLocalInput(new Date(Date.now() + 5 * 86400000 + 3600000)));
  };

  const handleConfirmWeeklySchedule = async (e) => {
    e.preventDefault();
    if (!selectedStudentForSchedule) return;

    setIsBookingWeekly(true);
    setBookingError(null);

    const slots = [
      { startsAt: new Date(slot1Start).toISOString(), endsAt: new Date(slot1End).toISOString() },
      { startsAt: new Date(slot2Start).toISOString(), endsAt: new Date(slot2End).toISOString() },
      { startsAt: new Date(slot3Start).toISOString(), endsAt: new Date(slot3End).toISOString() },
    ];

    try {
      await schedulingService.mentorScheduleSessions({
        studentId: selectedStudentForSchedule.studentId,
        enrollmentId: selectedStudentForSchedule.enrollmentId,
        courseId: selectedStudentForSchedule.courseId,
        slots,
      });

      setNotice(
        `Successfully scheduled 3 weekly mentorship sessions for ${selectedStudentForSchedule.studentName}! Video meet links are generated and visible to both you and the student.`
      );
      setSelectedStudentForSchedule(null);
      await refresh();
    } catch (err) {
      setBookingError(
        err.response?.data?.error?.message ||
          err.message ||
          "Unable to schedule weekly sessions for student."
      );
    } finally {
      setIsBookingWeekly(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 text-left sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <Link to="/tutor-portal" className="text-sm font-semibold text-[#013638] hover:underline">
            ← Tutor dashboard
          </Link>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
            Tutor Portal
          </p>
          <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Availability & Mentorship Scheduling
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            View assigned students, schedule weekly 3-session mentorship blocks with video links, and manage open calendar availability.
          </p>
        </header>

        {error && <ErrorMessage message={error} />}
        {notice && (
          <p role="status" className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
            {notice}
          </p>
        )}

        {/* ============================================================ */}
        {/* ASSIGNED STUDENTS & WEEKLY SCHEDULING PANEL                  */}
        {/* ============================================================ */}
        <section className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-[#013638]/10 px-3 py-0.5 text-xs font-bold text-[#013638]">
                <UserCheck className="h-3.5 w-3.5" />
                <span>Assigned Mentees</span>
              </div>
              <h2 className="mt-1 text-xl font-bold text-slate-900">
                Your Assigned Students
              </h2>
              <p className="text-xs text-slate-500">
                Students linked to your mentorship profile for enrolled curriculum subjects.
              </p>
            </div>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
              {assignedStudents.length} Students
            </span>
          </div>

          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Loading assigned students...
            </div>
          ) : assignedStudents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-8 text-center space-y-2">
              <GraduationCap className="mx-auto h-8 w-8 text-slate-300" />
              <p className="text-sm font-bold text-slate-700">No students assigned yet</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                When students subscribe to a package and select you as their mentor, they will appear here for weekly scheduling and live chat.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assignedStudents.map((st) => (
                <div
                  key={st.enrollmentId}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:shadow-md hover:border-slate-300"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded-md bg-teal-50 px-2 py-0.5 text-[10px] font-bold text-teal-800">
                        {st.gradeLevel || "Grade"}
                      </span>
                      <span className="text-[11px] font-bold text-slate-500">
                        {st.liveSessionsRemaining !== null
                          ? `${st.liveSessionsRemaining} sessions left`
                          : "Unlimited"}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-slate-900 text-base">
                      {st.studentName}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">
                      {st.courseName || "Curriculum Subject"}
                    </p>
                    {st.studentEmail && (
                      <p className="text-[11px] text-slate-400 truncate">
                        {st.studentEmail}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Button
                      type="button"
                      onClick={() => handleOpenScheduleModal(st)}
                      className="w-full text-xs font-bold py-2 rounded-xl"
                    >
                      <CalendarDays className="h-3.5 w-3.5 mr-1.5" />
                      <span>Schedule 3 Weekly Sessions</span>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Google Calendar Banner */}
        <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-bold text-[#013638]">Google Calendar and Meet Integration</h2>
            <p className="mt-1 text-xs text-slate-600">
              {googleConnected
                ? "Connected. Scheduled sessions automatically receive Google Meet links and calendar reminders."
                : "Connect your Google account for automated Google Meet video links, or default Jitsi video rooms will be provided."}
            </p>
          </div>
          <button
            type="button"
            onClick={connectCalendar}
            disabled={isConnecting}
            className="rounded-xl bg-[#013638] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#024e51] disabled:opacity-50 shrink-0"
          >
            {isConnecting ? "Connecting..." : googleConnected ? "Reconnect Google Calendar" : "Connect Google Calendar"}
          </button>
        </section>

        {/* Upcoming Sessions Component */}
        <UpcomingSessions userId={user.id} role="TUTOR" />

        {/* Availability Management Grid */}
        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <form onSubmit={addAvailability} className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
            <div>
              <h2 className="text-lg font-bold text-[#013638]">Publish a single time slot</h2>
              <p className="mt-1 text-xs text-slate-600">Publish general future open hours for students.</p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                Start Time
              </label>
              <input
                type="datetime-local"
                required
                value={startsAt}
                onChange={(event) => setStartsAt(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700">
                End Time
              </label>
              <input
                type="datetime-local"
                required
                value={endsAt}
                onChange={(event) => setEndsAt(event.target.value)}
                className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2 text-xs"
              />
            </div>
            <p className="text-[11px] text-slate-500">Slots must be 30–180 minutes.</p>
            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-xl bg-[#013638] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#024e51] disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Publish availability"}
            </button>
          </form>

          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-[#013638]">Current Published Open Slots</h2>
              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
                {availability.length}
              </span>
            </div>
            {availability.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500">
                No published open slots right now.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                {availability.map((slot) => (
                  <li key={slot.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{formatDate(slot.startsAt)}</p>
                      <span className="text-[10px] text-emerald-700 font-semibold">{slot.status}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => deleteSlot(slot.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      title="Delete slot"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </section>
      </div>

      {/* ============================================================ */}
      {/* MODAL: MENTOR SCHEDULES 3x WEEKLY SESSIONS FOR STUDENT       */}
      {/* ============================================================ */}
      {selectedStudentForSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl bg-white shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <span className="rounded-full bg-[#013638]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#013638]">
                  Weekly Mentorship
                </span>
                <h3 className="mt-1 text-lg font-bold text-slate-900">
                  Schedule 3 Sessions for {selectedStudentForSchedule.studentName}
                </h3>
                <p className="text-xs text-slate-500">
                  Course: {selectedStudentForSchedule.courseName} · Select 3 days and time slots.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentForSchedule(null)}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmWeeklySchedule} className="flex-1 overflow-y-auto p-6 space-y-4">
              {bookingError && <ErrorMessage message={bookingError} />}

              {/* Slot 1 */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-slate-50/50">
                <span className="text-xs font-bold text-[#013638] uppercase">Session 1 (Day 1)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Start</label>
                    <input
                      type="datetime-local"
                      required
                      value={slot1Start}
                      onChange={(e) => setSlot1Start(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">End</label>
                    <input
                      type="datetime-local"
                      required
                      value={slot1End}
                      onChange={(e) => setSlot1End(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Slot 2 */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-slate-50/50">
                <span className="text-xs font-bold text-[#013638] uppercase">Session 2 (Day 2)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Start</label>
                    <input
                      type="datetime-local"
                      required
                      value={slot2Start}
                      onChange={(e) => setSlot2Start(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">End</label>
                    <input
                      type="datetime-local"
                      required
                      value={slot2End}
                      onChange={(e) => setSlot2End(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Slot 3 */}
              <div className="rounded-2xl border border-slate-200 p-4 space-y-2 bg-slate-50/50">
                <span className="text-xs font-bold text-[#013638] uppercase">Session 3 (Day 3)</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">Start</label>
                    <input
                      type="datetime-local"
                      required
                      value={slot3Start}
                      onChange={(e) => setSlot3Start(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600">End</label>
                    <input
                      type="datetime-local"
                      required
                      value={slot3End}
                      onChange={(e) => setSlot3End(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-300 p-2 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setSelectedStudentForSchedule(null)}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isBookingWeekly}
                  className="text-xs font-bold"
                >
                  {isBookingWeekly ? "Scheduling Sessions..." : "Confirm & Book 3 Sessions"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
