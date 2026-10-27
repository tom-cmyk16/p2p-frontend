import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { useLearningAccess } from "../../learning/hooks/useLearningAccess";
import { useTutors } from "../hooks/useTutors";

export default function TutorDetailPage() {
  const { tutorId } = useParams();
  const navigate = useNavigate();
  const { subjects, getTutor, requestSession, isBooking, error } = useTutors();
  const {
    access: learningAccess,
    now: accessNow,
    isLoading: isLoadingAccess,
    error: accessError,
  } = useLearningAccess();
  const [tutor, setTutor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getTutor(tutorId).then((data) => {
      if (active) {
        setTutor(data);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [getTutor, tutorId]);

  const handleRequestSession = async () => {
    const conversation = await requestSession(tutorId);
    if (conversation) {
      navigate(`/chat/${conversation.id}`);
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#013638]" />
      </main>
    );
  }

  if (!tutor) {
    return (
      <main className="min-h-screen bg-white px-4 py-10 text-left">
        <div className="mx-auto max-w-2xl space-y-5">
          <ErrorMessage message={error || "Tutor not found"} />
          <Link to="/student" className="text-sm font-semibold text-[#013638] hover:underline">
            Back to tutors
          </Link>
        </div>
      </main>
    );
  }

  const name = tutor.user?.fullName || "Tutor";
  const canRequestSession = tutor.subjects?.some((tutorSubject) =>
    learningAccess?.availableGrades.includes(tutorSubject.gradeLevel) &&
    learningAccess?.packages.some((enrollment) => {
      const mentorshipActive =
        new Date(enrollment.startedAt).getTime() <= accessNow &&
        new Date(enrollment.mentorshipExpiresAt).getTime() > accessNow;
      if (!mentorshipActive) {
        return false;
      }
      if (enrollment.type === "SINGLE_COURSE") {
        return (
          enrollment.course?.subject?.id === tutorSubject.subjectId &&
          enrollment.gradeLevel === tutorSubject.gradeLevel &&
          enrollment.liveSessionsRemaining > 0
        );
      }
      if (enrollment.type === "FULL_GRADE") {
        return enrollment.gradeLevel === tutorSubject.gradeLevel;
      }
      return (
        enrollment.type === "ENTRANCE_GRADE_9_12" &&
        ["GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"].includes(
          tutorSubject.gradeLevel,
        )
      );
    }),
  );

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-left sm:px-6">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-9">
        <Link to="/student" className="text-sm font-semibold text-[#013638] hover:underline">
          ← Browse tutors
        </Link>
        {error && <div className="mt-5"><ErrorMessage message={error} /></div>}
        {accessError && <div className="mt-5"><ErrorMessage message={accessError} /></div>}
        <header className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#013638] text-3xl font-bold text-white">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
              Tutor profile
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#013638]">{name}</h1>
            <p className="mt-2 text-sm text-slate-600">
              {tutor.fieldOfStudy || tutor.educationLevel?.replaceAll("_", " ")}
              {tutor.institutionName ? ` · ${tutor.institutionName}` : ""}
            </p>
            {tutor.avgRating != null && (
              <p className="mt-2 text-sm font-medium text-[#013638]">
                ★ {tutor.avgRating} average rating
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={handleRequestSession}
            disabled={isBooking || isLoadingAccess || !canRequestSession}
            className="rounded-lg bg-[#013638] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#01494b] focus:outline-none focus:ring-2 focus:ring-[#013638]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBooking
              ? "Requesting..."
              : isLoadingAccess
                ? "Checking mentorship access..."
                : canRequestSession
                  ? "Request a session"
                  : "Active mentorship package required"}
          </button>
        </header>

        <section className="mt-8 border-t border-slate-200 pt-7">
          <h2 className="text-lg font-semibold text-[#013638]">About</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-700">
            {tutor.bio || "This tutor has not added a profile description yet."}
          </p>
        </section>

        <section className="mt-7 border-t border-slate-200 pt-7">
          <h2 className="text-lg font-semibold text-[#013638]">Subjects and grade levels</h2>
          {tutor.subjects?.length ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {tutor.subjects.map((item) => {
                const subject = subjects.find((entry) => entry.id === item.subjectId);
                return (
                  <li
                    key={`${item.subjectId}-${item.gradeLevel}`}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <p className="font-medium text-slate-900">{subject?.name || item.subjectId}</p>
                    <p className="mt-1 text-sm text-slate-600">
                      {item.gradeLevel?.replace("GRADE_", "Grade ")}
                    </p>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No subjects are listed.</p>
          )}
        </section>

        {tutor.ratingsReceived?.length > 0 && (
          <section className="mt-7 border-t border-slate-200 pt-7">
            <h2 className="text-lg font-semibold text-[#013638]">Student feedback</h2>
            <ul className="mt-4 space-y-3">
              {tutor.ratingsReceived.map((rating) => (
                <li key={rating.id} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-[#013638]">
                    {"★".repeat(rating.score)}{" "}
                    <span className="text-sm text-slate-600">{rating.score} out of 5</span>
                  </p>
                  {rating.comment && (
                    <p className="mt-2 text-sm leading-6 text-slate-700">{rating.comment}</p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}
      </article>
    </main>
  );
}
