import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShieldAlert, Star, Video } from "lucide-react";
import { schedulingService } from "../services/scheduling.service";
import ErrorMessage from "../../../components/common/ErrorMessage";
import RateTutorModal from "../../ratings/components/RateTutorModal";
import ReportTutorModal from "../../reports/components/ReportTutorModal";

const formatDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(date));

const timeUntil = (start, now) => {
  const milliseconds = new Date(start).getTime() - now;
  if (milliseconds <= 0) return "In progress";
  const minutes = Math.ceil(milliseconds / 60000);
  if (minutes < 60) return `Starts in ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) return `Starts in ${hours}h ${remainingMinutes}m`;
  return `Starts in ${Math.floor(hours / 24)}d ${hours % 24}h`;
};

export default function UpcomingSessions({ userId, role }) {
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [rateSession, setRateSession] = useState(null);
  const [reportSession, setReportSession] = useState(null);

  useEffect(() => {
    let active = true;
    schedulingService.getSessions()
      .then((items) => {
        if (active) setSessions(items);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError.response?.data?.error?.message || "Unable to load scheduled sessions.",
          );
        }
      });
    return () => {
      active = false;
    };
  }, [userId]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const upcoming = sessions.filter(
    (session) => session.status === "SCHEDULED" && new Date(session.endsAt).getTime() > now,
  );
  const history = sessions
    .filter((session) => session.status !== "SCHEDULED" || new Date(session.endsAt).getTime() <= now)
    .sort((first, second) => new Date(second.startsAt) - new Date(first.startsAt))
    .slice(0, 5);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <h2 className="text-xl font-semibold text-[#013638]">Upcoming mentorship sessions</h2>
        <p className="mt-1 text-sm text-slate-600">
          Your scheduled course sessions and Google Meet access.
        </p>
      </div>
      {error && <div className="mt-4"><ErrorMessage message={error} /></div>}
      {upcoming.length === 0 ? (
        <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          No upcoming sessions are scheduled.
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-slate-100">
          {upcoming.map((session) => {
            const start = new Date(session.startsAt).getTime();
            const end = new Date(session.endsAt).getTime();
            const isCurrent = now >= start && now <= end;
            const meetLink = session.googleMeetLink || session.meetUrl;
            const otherName = role === "TUTOR"
              ? session.student?.user?.fullName
              : session.tutor?.user?.fullName;

            return (
              <li key={session.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        isCurrent
                          ? "bg-emerald-600 text-white animate-pulse"
                          : "bg-[#013638]/10 text-[#013638]"
                      }`}
                    >
                      {isCurrent ? "Live Now" : "Scheduled"}
                    </span>
                    <p className="font-semibold text-slate-900">
                      {session.course?.subject?.name} · {session.course?.gradeLevel?.replace("_", " ")}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">
                    {formatDate(session.startsAt)} · {otherName || "Mentorship partner"}
                  </p>
                  <p className="mt-1 text-xs font-medium text-[#013638]">
                    {timeUntil(session.startsAt, now)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/sessions/${encodeURIComponent(session.id)}`}
                    className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-[#013638] hover:bg-slate-50"
                  >
                    Session chat
                  </Link>
                  {meetLink && (
                    <a
                      href={meetLink}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                        isCurrent
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                          : "bg-[#013638] hover:bg-[#024e51] text-white"
                      }`}
                    >
                      <Video className="h-4 w-4" />
                      <span>Join Meeting</span>
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {history.length > 0 && (
        <div className="mt-6 border-t border-slate-200 pt-5">
          <h3 className="text-sm font-semibold text-slate-700">Recent session history</h3>
          <ul className="mt-3 divide-y divide-slate-100">
            {history.map((session) => {
              const otherName = role === "TUTOR"
                ? session.student?.user?.fullName
                : session.tutor?.user?.fullName;
              return (
                <li key={session.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {session.course?.subject?.name} · {session.course?.gradeLevel?.replace("_", " ")}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDate(session.startsAt)} · {otherName || "Mentorship partner"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/sessions/${encodeURIComponent(session.id)}`}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-[#013638] hover:bg-slate-50 transition"
                    >
                      Session chat
                    </Link>
                    {role === "STUDENT" && (
                      <>
                        <button
                          type="button"
                          onClick={() => setRateSession(session)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50/70 px-2.5 py-1.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition shadow-xs"
                        >
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                          <span>
                            {session.conversation?.rating
                              ? `${session.conversation.rating.score}★ Rated`
                              : "Rate Tutor"}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReportSession(session)}
                          className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50/60 px-2 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs"
                          title="Report tutor to admin"
                        >
                          <ShieldAlert className="h-3.5 w-3.5 text-rose-600" />
                          <span>Report</span>
                        </button>
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Rate Tutor Modal */}
      {rateSession && (
        <RateTutorModal
          isOpen={Boolean(rateSession)}
          onClose={() => setRateSession(null)}
          conversationId={rateSession.conversationId || rateSession.conversation?.id}
          tutorName={rateSession.tutor?.user?.fullName}
          courseName={rateSession.course?.subject?.name}
          sessionDate={formatDate(rateSession.startsAt)}
          existingRating={rateSession.conversation?.rating}
          onRatingSubmitted={(newRating) => {
            setSessions((current) =>
              current.map((s) =>
                s.id === rateSession.id || s.conversationId === rateSession.conversationId
                  ? {
                      ...s,
                      conversation: {
                        ...(s.conversation || {}),
                        rating: newRating,
                      },
                    }
                  : s
              )
            );
          }}
        />
      )}

      {/* Report Tutor Modal */}
      {reportSession && (
        <ReportTutorModal
          isOpen={Boolean(reportSession)}
          onClose={() => setReportSession(null)}
          tutorId={reportSession.tutorId || reportSession.tutor?.userId}
          tutorName={reportSession.tutor?.user?.fullName}
          courseName={reportSession.course?.subject?.name}
          conversationId={reportSession.conversationId || reportSession.conversation?.id}
          sessionId={reportSession.id}
        />
      )}
    </section>
  );
}
