import { Navigate, Link } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { useTutorRatings } from "../hooks/useTutorRatings";

export default function TutorRatingsPage() {
  const { user } = useAuthContext();
  const {
    ratings,
    distribution,
    averageRating,
    totalRatings,
    writtenReviewCount,
    isLoading,
    error,
    fetchRatings,
  } = useTutorRatings(user?.role === "TUTOR" ? user.id : null);

  if (user?.role !== "TUTOR") {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-left sm:px-6">
      <div className="mx-auto max-w-5xl space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link
              to="/tutor-portal"
              className="text-sm font-semibold text-[#013638] hover:underline"
            >
              ← Tutor dashboard
            </Link>
            <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
              Tutor portal
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#013638]">
              Ratings and feedback
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review student ratings and written feedback from your sessions.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchRatings}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#013638] transition hover:bg-slate-50 disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && <ErrorMessage message={error} />}

        {isLoading && !ratings.length ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-8 text-sm text-slate-500 shadow-sm">
            Loading student feedback...
          </section>
        ) : (
          <>
            <section className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-600">Average rating</p>
                <p className="mt-3 text-3xl font-bold text-[#013638]">
                  {averageRating == null ? "—" : `${averageRating} / 5`}
                </p>
                <p className="mt-2 text-xs text-slate-500">From submitted student ratings</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-600">Total ratings</p>
                <p className="mt-3 text-3xl font-bold text-[#013638]">{totalRatings}</p>
                <p className="mt-2 text-xs text-slate-500">Across all tutoring sessions</p>
              </article>
              <article className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-sm font-medium text-slate-600">Written reviews</p>
                <p className="mt-3 text-3xl font-bold text-[#013638]">{writtenReviewCount}</p>
                <p className="mt-2 text-xs text-slate-500">Ratings that include comments</p>
              </article>
            </section>

            <section className="grid gap-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] sm:p-8">
              <div>
                <h2 className="text-xl font-semibold text-[#013638]">Rating breakdown</h2>
                <div className="mt-5 space-y-3">
                  {distribution.map(({ score, count }) => (
                    <div key={score} className="grid grid-cols-[3.5rem_1fr_2rem] items-center gap-3">
                      <span className="text-sm font-medium text-slate-700">{score} stars</span>
                      <div
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                        role="progressbar"
                        aria-label={`${score} star ratings`}
                        aria-valuemin={0}
                        aria-valuemax={totalRatings}
                        aria-valuenow={count}
                      >
                        <div
                          className="h-full rounded-full bg-[#013638]"
                          style={{
                            width: totalRatings ? `${(count / totalRatings) * 100}%` : "0%",
                          }}
                        />
                      </div>
                      <span className="text-right text-sm text-slate-600">{count}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-semibold text-[#013638]">Student reviews</h2>
                {ratings.length ? (
                  <ul className="mt-4 divide-y divide-slate-100">
                    {ratings.map((rating) => (
                      <li key={rating.id} className="py-4 first:pt-0 last:pb-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-[#013638]">
                            {"★".repeat(rating.score)}
                            <span className="ml-2 text-sm text-slate-600">
                              {rating.score} / 5
                            </span>
                          </span>
                          <time className="text-xs text-slate-500">
                            {new Date(rating.createdAt).toLocaleDateString()}
                          </time>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-700">
                          {rating.comment?.trim() || "No written feedback was provided."}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    You have not received any ratings yet.
                  </p>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
