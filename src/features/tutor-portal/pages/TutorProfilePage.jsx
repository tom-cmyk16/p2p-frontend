import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuthContext } from "../../../context/AuthContext";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { useTutorProfile } from "../hooks/useTutorProfile";

const gradeLevels = [
  { value: "GRADE_8", label: "Grade 8" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
];

const makeSubjectKey = (subjectId, gradeLevel) => `${subjectId}:${gradeLevel}`;

export default function TutorProfilePage() {
  const { user } = useAuthContext();
  const {
    profile,
    subjects,
    isLoading,
    isSaving,
    error,
    fetchProfile,
    updateProfile,
  } = useTutorProfile();
  const [bio, setBio] = useState("");
  const [institutionName, setInstitutionName] = useState("");
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!profile) {
      return;
    }

    setBio(profile.bio || "");
    setInstitutionName(profile.institutionName || "");
    setSelectedSubjects(
      (profile.subjects || []).map(({ subjectId, gradeLevel }) => ({
        subjectId,
        gradeLevel,
      }))
    );
  }, [profile]);

  if (user?.role !== "TUTOR") {
    return <Navigate to="/" replace />;
  }

  const isSubjectSelected = (subjectId, gradeLevel) =>
    selectedSubjects.some(
      (item) =>
        item.subjectId === subjectId && item.gradeLevel === gradeLevel
    );

  const toggleSubject = (subjectId, gradeLevel) => {
    setSelectedSubjects((currentSelection) =>
      isSubjectSelected(subjectId, gradeLevel)
        ? currentSelection.filter(
            (item) =>
              item.subjectId !== subjectId || item.gradeLevel !== gradeLevel
          )
        : [...currentSelection, { subjectId, gradeLevel }]
    );
    setSuccessMessage("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccessMessage("");

    const updated = await updateProfile({
      bio: bio.trim(),
      institutionName: institutionName.trim(),
      subjects: selectedSubjects,
    });

    if (updated) {
      setSuccessMessage("Your tutor profile has been updated.");
    }
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#013638]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-10 text-left sm:px-6">
      <div className="mx-auto max-w-3xl space-y-7">
        <header>
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
            Manage your profile
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Keep your tutor information and teaching subjects up to date.
          </p>
        </header>

        {error && (
          <div className="space-y-3">
            <ErrorMessage message={error} />
            {!profile && (
              <button
                type="button"
                onClick={fetchProfile}
                className="text-sm font-semibold text-[#013638] hover:underline"
              >
                Try again
              </button>
            )}
          </div>
        )}
        {successMessage && (
          <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {successMessage}
          </p>
        )}

        {profile && (
          <form
            onSubmit={handleSubmit}
            className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="tutorName" className="mb-2 block text-sm font-medium text-slate-700">
                  Name
                </label>
                <input
                  id="tutorName"
                  value={profile.user?.fullName || user.fullName || ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                />
              </div>
              <div>
                <label htmlFor="institutionName" className="mb-2 block text-sm font-medium text-slate-700">
                  Institute name
                </label>
                <input
                  id="institutionName"
                  required
                  maxLength={200}
                  value={institutionName}
                  onChange={(event) => setInstitutionName(event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                />
              </div>
            </div>

            <div>
              <label htmlFor="tutorBio" className="mb-2 block text-sm font-medium text-slate-700">
                Short bio
              </label>
              <textarea
                id="tutorBio"
                required
                maxLength={5000}
                rows={5}
                value={bio}
                onChange={(event) => setBio(event.target.value)}
                className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm leading-6 outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                placeholder="Tell students about your teaching experience"
              />
              <p className="mt-1 text-right text-xs text-slate-500">{bio.length}/5000</p>
            </div>

            <fieldset className="border-t border-slate-200 pt-6">
              <legend className="text-lg font-semibold text-[#013638]">
                Subjects and grade levels
              </legend>
              <p className="mt-1 text-sm text-slate-600">
                Select each subject and grade combination you teach.
              </p>

              {subjects.length ? (
                <div className="mt-4 space-y-3">
                  {subjects.map((subject) => (
                    <section
                      key={subject.id}
                      className="rounded-xl border border-slate-200 p-4"
                    >
                      <h2 className="font-medium text-slate-900">{subject.name}</h2>
                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-3">
                        {gradeLevels.map((grade) => {
                          const inputId = `subject-${makeSubjectKey(subject.id, grade.value)}`;

                          return (
                            <label
                              key={grade.value}
                              htmlFor={inputId}
                              className="inline-flex items-center gap-2 text-sm text-slate-700"
                            >
                              <input
                                id={inputId}
                                type="checkbox"
                                checked={isSubjectSelected(subject.id, grade.value)}
                                onChange={() => toggleSubject(subject.id, grade.value)}
                                className="h-4 w-4 rounded border-slate-300 accent-[#013638]"
                              />
                              {grade.label}
                            </label>
                          );
                        })}
                      </div>
                    </section>
                  ))}
                </div>
              ) : (
                <p className="mt-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  No subjects are available. Contact an administrator to add subjects.
                </p>
              )}
            </fieldset>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
              <p className="text-sm text-slate-500">
                {selectedSubjects.length} subject and grade combinations selected
              </p>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-lg bg-[#013638] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#01494b] focus:outline-none focus:ring-2 focus:ring-[#013638]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Saving..." : "Save profile"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
