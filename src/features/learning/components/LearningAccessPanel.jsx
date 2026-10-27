import { useEffect, useState } from "react";
import { learningService } from "../services/learning.service";
import { useLearningAccess } from "../hooks/useLearningAccess";

const gradeLabels = {
  GRADE_9: "Grade 9",
  GRADE_10: "Grade 10",
  GRADE_11: "Grade 11",
  GRADE_12: "Grade 12",
};

const packageLabels = {
  SINGLE_COURSE: "Single Course",
  FULL_GRADE: "Full Grade",
  ENTRANCE_GRADE_9_12: "Grade 9–12 Entrance",
};

const formatCountdown = (expiry, now) => {
  const remaining = Math.max(0, new Date(expiry).getTime() - now);
  if (remaining === 0) {
    return "Expired";
  }
  const seconds = Math.floor(remaining / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  return `${days}d ${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}m ${String(rest).padStart(2, "0")}s`;
};

const formatPackage = (enrollment) => {
  if (enrollment.type === "SINGLE_COURSE") {
    return `${enrollment.course?.subject?.name || "Course"} · ${gradeLabels[enrollment.gradeLevel] || enrollment.gradeLevel}`;
  }
  if (enrollment.type === "FULL_GRADE") {
    return `${packageLabels[enrollment.type]} · ${gradeLabels[enrollment.gradeLevel] || enrollment.gradeLevel}`;
  }
  return packageLabels[enrollment.type];
};

export default function LearningAccessPanel({ onAccessLoaded }) {
  const { access, now, isLoading, error } = useLearningAccess();
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [materialsError, setMaterialsError] = useState("");
  const availableCourses = access?.availableCourses || [];

  useEffect(() => {
    if (!availableCourses.some((course) => course.id === selectedCourseId)) {
      setSelectedCourseId(availableCourses[0]?.id || "");
    }
  }, [availableCourses, selectedCourseId]);

  useEffect(() => {
    if (!selectedCourseId) {
      setMaterials([]);
      setMaterialsError("");
      return undefined;
    }

    let isCurrent = true;
    setMaterialsLoading(true);
    setMaterialsError("");
    learningService.getCourseMaterials(selectedCourseId)
      .then((result) => {
        if (isCurrent) setMaterials(result);
      })
      .catch((requestError) => {
        if (!isCurrent) return;
        setMaterials([]);
        setMaterialsError(
          requestError.response?.data?.error?.message ||
          requestError.response?.data?.message ||
          "Unable to load learning resources.",
        );
      })
      .finally(() => {
        if (isCurrent) setMaterialsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [selectedCourseId]);

  useEffect(() => {
    if (access) {
      onAccessLoaded?.(access, now);
    }
  }, [access, now, onAccessLoaded]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#013638]">
            Package access
          </p>
          <h2 className="mt-1 text-xl font-semibold text-[#013638]">
            Your learning timeline
          </h2>
        </div>
        {access && (
          <p className="text-xs text-slate-500">
            Live access and practice access expire independently
          </p>
        )}
      </div>

      {isLoading && <p className="mt-4 text-sm text-slate-500">Loading package access…</p>}
      {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
      {access && access.packages.length === 0 && (
        <p className="mt-4 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          No package is currently active. Enroll in a package to unlock course access.
          Previous quiz results remain available below.
        </p>
      )}
      {access?.packages.length > 0 && (
        <div className="mt-4 grid gap-3">
          {access.packages.map((enrollment) => {
            const accessActive =
              new Date(enrollment.accessExpiresAt).getTime() > now &&
              new Date(enrollment.startedAt).getTime() <= now;
            const mentorshipActive =
              new Date(enrollment.mentorshipExpiresAt).getTime() > now &&
              new Date(enrollment.startedAt).getTime() <= now;

            return (
              <article
                key={enrollment.id}
                className="rounded-xl border border-slate-200 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-semibold text-slate-900">{formatPackage(enrollment)}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${accessActive ? "bg-emerald-50 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>
                    {accessActive ? "Practice active" : "Practice expired"}
                  </span>
                </div>
                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Practice & exam access
                    </dt>
                    <dd className="mt-1 font-semibold tabular-nums text-[#013638]">
                      {formatCountdown(enrollment.accessExpiresAt, now)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
                      Live mentorship
                    </dt>
                    <dd className="mt-1 font-semibold tabular-nums text-[#013638]">
                      {mentorshipActive
                        ? formatCountdown(enrollment.mentorshipExpiresAt, now)
                        : "Ended"}
                      {enrollment.liveSessionCount
                        ? ` · ${enrollment.liveSessionsRemaining} of ${enrollment.liveSessionCount} sessions left`
                        : ""}
                    </dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}

      {access && access.coreCourses.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-800">Core-course progression</h3>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2">
            {access.coreCourses.map((course) => (
              <li key={course.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                <span>{gradeLabels[course.gradeLevel]} · {course.subject.name}</span>
                <span className={course.isCompleted ? "font-semibold text-emerald-700" : "text-slate-500"}>
                  {course.isCompleted ? "Complete" : "In progress"}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {availableCourses.length > 0 && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Learning resources</h3>
              <p className="mt-1 text-xs text-slate-500">Supplementary links for your active courses.</p>
            </div>
            <label className="w-full text-xs font-medium text-slate-600 sm:max-w-xs">
              Course
              <select
                value={selectedCourseId}
                onChange={(event) => setSelectedCourseId(event.target.value)}
                className="mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
              >
                {availableCourses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {gradeLabels[course.gradeLevel] || course.gradeLevel} · {course.subject.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {materialsLoading && <p className="mt-3 text-sm text-slate-500">Loading resources…</p>}
          {materialsError && <p role="alert" className="mt-3 text-sm text-red-700">{materialsError}</p>}
          {!materialsLoading && !materialsError && (
            materials.length ? (
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {materials.map((material) => (
                  <li key={material.id} className="rounded-lg border border-slate-200 p-3">
                    <a
                      href={material.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#013638] underline-offset-2 hover:underline"
                    >
                      {material.title}
                    </a>
                    {material.topic && <p className="mt-1 text-xs font-medium text-slate-500">{material.topic.name}</p>}
                    {material.description && <p className="mt-1 text-sm text-slate-600">{material.description}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-500">No resources have been published for this course yet.</p>
            )
          )}
        </div>
      )}
    </section>
  );
}
