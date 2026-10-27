import { Link } from "react-router-dom";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";
import Loader from "../../../components/common/Loader";
import { useAuthContext } from "../../../context/AuthContext";
import UpcomingSessions from "../../scheduling/components/UpcomingSessions";
import { useTutors } from "../hooks/useTutors";

export default function TutorListPage() {
  const { user } = useAuthContext();
  const {
    tutors,
    subjects,
    filters,
    setFilters,
    search,
    setSearch,
    isLoading,
    isLoadingSubjects,
    error,
    fetchTutors,
  } = useTutors();

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-left sm:px-6">
      <div className="mx-auto max-w-5xl space-y-7">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
            P2P Exam Prep
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#013638]">
            Find a tutor
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Browse tutors by subject and expertise, then request a session.
          </p>
        </header>

        <UpcomingSessions userId={user?.id} role="STUDENT" />

        <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div>
            <label htmlFor="tutorSearch" className="mb-2 block text-sm font-medium text-slate-700">
              Name or expertise
            </label>
            <input
              id="tutorSearch"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search tutors, subjects, or expertise"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
            />
          </div>
          <div>
            <label htmlFor="tutorSubject" className="mb-2 block text-sm font-medium text-slate-700">
              Subject
            </label>
            <select
              id="tutorSubject"
              value={filters.subjectId || ""}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  ...(event.target.value
                    ? { subjectId: event.target.value }
                    : { subjectId: undefined }),
                }))
              }
              disabled={isLoadingSubjects}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15 disabled:bg-slate-50"
            >
              <option value="">All subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="button" onClick={fetchTutors} disabled={isLoading} className="py-2.5 text-sm">
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </section>

        {error && <ErrorMessage message={error} />}

        {isLoading ? (
          <Loader label="Loading tutors..." />
        ) : tutors.length ? (
          <section className="grid gap-4 sm:grid-cols-2">
            {tutors.map((tutor) => {
              const name = tutor.user?.fullName || "Tutor";
              const tutorSubjects = (tutor.subjects || [])
                .map((item) => subjects.find((subject) => subject.id === item.subjectId)?.name)
                .filter(Boolean);

              return (
                <article
                  key={tutor.userId}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#013638]/30"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#013638] text-lg font-bold text-white">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-[#013638]">{name}</h2>
                      <p className="mt-1 text-sm text-slate-600">
                        {tutor.fieldOfStudy || tutor.educationLevel?.replaceAll("_", " ") || "Tutor"}
                      </p>
                    </div>
                  </div>
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                    {tutor.bio || "Connect with this tutor to learn more."}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {tutorSubjects.map((subject) => (
                      <span
                        key={subject}
                        className="rounded-full bg-[#013638]/5 px-3 py-1 text-xs font-medium text-[#013638]"
                      >
                        {subject}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    {tutor.institutionName || "Institution not listed"}
                    {tutor.avgRating != null ? ` · ★ ${tutor.avgRating}` : ""}
                  </p>
                  <Link
                    to={`/student/${tutor.userId}`}
                    className="mt-5 inline-flex items-center justify-center rounded-lg bg-[#013638] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#01494b] focus:outline-none focus:ring-2 focus:ring-[#013638]/30 focus:ring-offset-2"
                  >
                    View tutor
                  </Link>
                </article>
              );
            })}
          </section>
        ) : (
          <section className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-[#013638]">No tutors found</h2>
            <p className="mt-2 text-sm text-slate-600">
              Try a different subject or expertise search.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
