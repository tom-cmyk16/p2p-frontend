import { useState, useEffect } from "react";
import { useProfile } from "../hooks/useProfile";
import NotificationAlert from "../../../components/common/NotificationAlert";

export default function ProfilePage() {
  const { profile, isLoading, isSaving, error, updateProfile, refetch } = useProfile();
  const [fullName, setFullName] = useState("");
  const [regionId, setRegionId] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || "");
      setRegionId(profile.region?.id || "");
    }
  }, [profile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage("");

    const updated = await updateProfile({
      fullName: fullName.trim(),
      regionId: regionId.trim() || null,
    });

    if (updated) {
      setSuccessMessage("Profile updated successfully!");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-[#013638]" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white px-4 py-12 sm:px-6">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm sm:p-8">
        <div className="mb-8">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#013638] text-2xl font-bold text-white">
            {fullName.trim().charAt(0).toUpperCase() || "S"}
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">
            {profile.role || "Account"}
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#013638]">
            My profile
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            View and update your account details.
          </p>
        </div>

        {error && (
          <NotificationAlert
            type="error"
            message={error}
            duration={5000}
            className="mb-5"
          />
        )}

        {successMessage && (
          <NotificationAlert
            type="success"
            message={successMessage}
            duration={5000}
            onDismiss={() => setSuccessMessage("")}
            className="mb-5"
          />
        )}

        {!profile && error && (
          <button
            type="button"
            onClick={refetch}
            className="rounded-lg bg-[#013638] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#01494b] focus:outline-none focus:ring-2 focus:ring-[#013638]/30 focus:ring-offset-2"
          >
            Try again
          </button>
        )}

        {profile && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="profileFullName" className="mb-2 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="profileFullName"
                type="text"
                autoComplete="name"
                minLength={1}
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="profileContact" className="mb-2 block text-sm font-medium text-slate-700">
                Phone or email
              </label>
              <input
                id="profileContact"
                type="text"
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                value={profile.phoneOrEmail || ""}
              />
            </div>

            <div>
              <label htmlFor="profileGradeLevel" className="mb-2 block text-sm font-medium text-slate-700">
                {profile.role === "STUDENT" ? "Grade level" : "Account status"}
              </label>
              <input
                id="profileGradeLevel"
                type="text"
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-500"
                value={profile.role === "STUDENT"
                  ? profile.studentProfile?.gradeLevel?.replace("GRADE_", "Grade ") || ""
                  : profile.status || ""}
              />
            </div>

            <div>
              <label htmlFor="profileRegionId" className="mb-2 block text-sm font-medium text-slate-700">
                Region ID
              </label>
              <input
                id="profileRegionId"
                type="text"
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                value={regionId}
                onChange={(e) => setRegionId(e.target.value)}
                placeholder="Enter a region ID or leave blank"
              />
              {profile.region?.name && (
                <p className="mt-2 text-xs text-slate-500">Current region: {profile.region.name}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="w-full rounded-lg bg-[#013638] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#01494b] focus:outline-none focus:ring-2 focus:ring-[#013638]/30 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Saving..." : "Save changes"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}