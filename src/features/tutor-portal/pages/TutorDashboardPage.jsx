import { Navigate, Link } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { useTutorPortal } from "../hooks/useTutorPortal";
import UpcomingSessions from "../../scheduling/components/UpcomingSessions";

function MetricCard({ label, value, description }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-medium text-slate-600">{label}</p>
      <p className="mt-3 text-3xl font-bold tracking-tight text-[#013638]">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{description}</p>
    </article>
  );
}

export default function TutorDashboardPage() {
  const { user } = useAuthContext();
  const {
    summary,
    isLoadingSummary,
    error,
    fetchSummary,
  } = useTutorPortal(user?.role === "TUTOR" ? user.id : null);

  if (user?.role !== "TUTOR") {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-left sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
              Tutor portal
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#013638]">
              Welcome, {user.fullName}
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review your sessions, student inquiries, and learner feedback.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/tutor-portal/chat"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#013638] transition hover:bg-slate-50"
            >
              Open inbox
            </Link>
            <Link
              to="/tutor-portal/schedule"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#013638] transition hover:bg-slate-50"
            >
              Manage availability
            </Link>
            <Link
              to="/tutor-portal/ratings"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#013638] transition hover:bg-slate-50"
            >
              Ratings and feedback
            </Link>
            <Link
              to="/tutor-portal/profile"
              className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#013638] transition hover:bg-slate-50"
            >
              Manage profile
            </Link>
            <button
              type="button"
              onClick={fetchSummary}
              disabled={isLoadingSummary}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#013638] transition hover:bg-slate-50 disabled:opacity-50"
            >
              {isLoadingSummary ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </header>

        {error && (
          <div className="space-y-3">
            <ErrorMessage message={error} />
            <button
              type="button"
              onClick={fetchSummary}
              className="text-sm font-semibold text-[#013638] hover:underline"
            >
              Try loading dashboard again
            </button>
          </div>
        )}

        <UpcomingSessions userId={user.id} role="TUTOR" />

        {isLoadingSummary && !summary ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading your dashboard...
          </section>
        ) : summary ? (
          <>
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MetricCard
                label="Active student sessions"
                value={summary.activeSessions}
                description="Conversations currently marked active"
              />
              <MetricCard
                label="Student text inquiries"
                value={summary.studentQuestionsHandled}
                description="Text messages received from students across your sessions"
              />
              <MetricCard
                label="Average rating"
                value={summary.averageRating == null ? "—" : `${summary.averageRating} / 5`}
                description={`${summary.totalRatings} student ratings`}
              />
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-[#013638]">Student feedback</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {summary.feedbackCount} written feedback {summary.feedbackCount === 1 ? "response" : "responses"}
                    {" · "}
                    {summary.totalRatings} total ratings
                  </p>
                </div>
              </div>
              {summary.feedback.length ? (
                <ul className="mt-5 divide-y divide-slate-100">
                  {summary.feedback.map((rating) => (
                    <li key={rating.id} className="py-4 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-semibold text-[#013638]">
                          {"★".repeat(rating.score)}
                          <span className="ml-2 text-sm text-slate-600">{rating.score} / 5</span>
                        </span>
                        <time className="text-xs text-slate-500">
                          {new Date(rating.createdAt).toLocaleDateString()}
                        </time>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-700">{rating.comment}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No written feedback yet.
                </p>
              )}
            </section>
          </>
        ) : (
          !error && (
            <section className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
              Dashboard statistics are not available.
            </section>
          )
        )}
      </div>
    </main>
  );
}
