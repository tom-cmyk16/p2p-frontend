import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { useAuthContext } from "../../../context/AuthContext";
import { schedulingService } from "../services/scheduling.service";
import UpcomingSessions from "../components/UpcomingSessions";

const weekStart = (value) => {
  const date = new Date(value);
  date.setUTCHours(0, 0, 0, 0);
  const day = date.getUTCDay();
  date.setUTCDate(date.getUTCDate() - (day === 0 ? 6 : day - 1));
  return date.toISOString();
};

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));

export default function StudentSchedulePage() {
  const { user } = useAuthContext();
  const [availability, setAvailability] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [courseId, setCourseId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const slots = await schedulingService.getAvailability();
      setAvailability(slots);
    } catch (requestError) {
      setError(requestError.response?.data?.error?.message || "Unable to load scheduling information.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedSlots = useMemo(
    () => availability.filter((slot) => selectedIds.includes(slot.id)),
    [availability, selectedIds],
  );
  const selectionTutorId = selectedSlots[0]?.tutorId;
  const selectionWeek = selectedSlots[0] ? weekStart(selectedSlots[0].startsAt) : null;
  const courseOptions = selectedSlots[0]?.tutor.subjects || [];
  const eligibleSlots = availability.filter((slot) => {
    if (!selectionTutorId) return true;
    return slot.tutorId === selectionTutorId && weekStart(slot.startsAt) === selectionWeek;
  });

  const toggleSlot = (slot) => {
    setError(null);
    setNotice(null);
    if (selectedIds.includes(slot.id)) {
      setSelectedIds((current) => current.filter((id) => id !== slot.id));
      if (selectedIds.length === 1) setCourseId("");
      return;
    }
    if (selectedIds.length === 3) {
      setError("A weekly course schedule must contain exactly three sessions.");
      return;
    }
    if (selectionTutorId && slot.tutorId !== selectionTutorId) {
      setError("Choose all three sessions with the same tutor.");
      return;
    }
    if (selectionWeek && weekStart(slot.startsAt) !== selectionWeek) {
      setError("Choose all three sessions in the same calendar week.");
      return;
    }
    setSelectedIds((current) => [...current, slot.id]);
    const availableCourses = slot.tutor.subjects.filter((subject) => subject.courseId);
    if (!courseId && availableCourses.length) {
      const subject = availableCourses[0];
      setCourseId(subject.courseId || "");
    }
  };

  const bookSessions = async (event) => {
    event.preventDefault();
    if (selectedIds.length !== 3 || !selectionTutorId || !courseId) {
      setError("Select a course and exactly three available times in one week.");
      return;
    }
    setIsBooking(true);
    setError(null);
    setNotice(null);
    try {
      await schedulingService.bookWeeklySessions({
        tutorId: selectionTutorId,
        courseId,
        availabilityIds: selectedIds,
      });
      setSelectedIds([]);
      setCourseId("");
      setNotice(`Scheduled all three sessions with Google Meet links for this course week.`);
      await refresh();
    } catch (bookingError) {
      setError(
        bookingError.response?.data?.error?.message ||
          "Unable to book the three weekly sessions.",
      );
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-left sm:px-6">
      <div className="mx-auto max-w-6xl space-y-7">
        <header>
          <Link to="/student" className="text-sm font-semibold text-[#013638] hover:underline">
            ← Student dashboard
          </Link>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
            Student schedule
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#013638]">
            Book your weekly mentorship
          </h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            Pick exactly three available sessions with the same mentor, for the same course, in one
            calendar week. Each booking creates a unique Google Meet event and a private session chat.
          </p>
        </header>

        {error && <ErrorMessage message={error} />}
        {notice && (
          <p role="status" className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
            {notice}
          </p>
        )}

        <UpcomingSessions userId={user?.id} role="STUDENT" />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#013638]">Available mentor time slots</h2>
              <p className="mt-1 text-sm text-slate-600">Select three slots in the same UTC calendar week.</p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={isLoading}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-[#013638] disabled:opacity-50"
            >
              Refresh
            </button>
          </div>

          {isLoading ? (
            <p className="mt-5 text-sm text-slate-500">Loading available slots...</p>
          ) : eligibleSlots.length ? (
            <form onSubmit={bookSessions} className="mt-5 space-y-5">
              {selectionTutorId && (
                <label className="block max-w-md text-sm font-medium text-slate-700">
                  Course
                  <select
                    value={courseId}
                    onChange={(event) => setCourseId(event.target.value)}
                    required
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5"
                  >
                    <option value="">Select a course</option>
                    {courseOptions.filter((subject) => subject.courseId).map((subject) => (
                      <option key={`${subject.subjectId}-${subject.gradeLevel}`} value={subject.courseId}>
                        {subject.subject.name} · {subject.gradeLevel.replace("_", " ")}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <ul className="grid gap-3 md:grid-cols-2">
                {eligibleSlots.map((slot) => {
                  const checked = selectedIds.includes(slot.id);
                  return (
                    <li key={slot.id}>
                      <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                        checked ? "border-[#013638] bg-[#013638]/5" : "border-slate-200 hover:border-slate-400"
                      }`}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleSlot(slot)}
                          className="mt-1 accent-[#013638]"
                        />
                        <span>
                          <span className="block font-semibold text-slate-900">
                            {formatDate(slot.startsAt)}
                          </span>
                          <span className="mt-1 block text-sm text-slate-600">
                            {slot.tutor.user.fullName}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500">
                            {slot.tutor.subjects.map((subject) =>
                              `${subject.subject.name} ${subject.gradeLevel.replace("_", " ")}`
                            ).join(" · ")}
                          </span>
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-600">
                  {selectedIds.length} of 3 weekly sessions selected
                </p>
                <button
                  type="submit"
                  disabled={isBooking || selectedIds.length !== 3 || !courseId}
                  className="rounded-lg bg-[#013638] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isBooking ? "Creating Meet links..." : "Book three sessions"}
                </button>
              </div>
            </form>
          ) : (
            <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
              No mentor availability is currently published for the next 30 days.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
