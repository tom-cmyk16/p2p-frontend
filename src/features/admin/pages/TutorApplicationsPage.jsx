import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAdmin } from "../hooks/useAdmin";
import { adminService } from "../services/admin.service";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";
import Loader from "../../../components/common/Loader";

const filters = ["SUBMITTED", "UNDER_REVIEW"];
const documentLabels = {
  STUDENT_ID_CARD: "Student / university ID",
  TRANSCRIPT: "Official transcript",
  CERTIFICATE: "Certificate",
  NATIONAL_ID: "National ID",
  RECOMMENDATION_LETTER: "Recommendation letter",
  OTHER: "Other supporting document",
};

const hasRequiredCredential = (application) => {
  const documentTypes = application.documents?.map((document) => document.documentType) || [];
  const acceptedTypes = application.educationLevel === "HIGH_SCHOOL"
    ? ["STUDENT_ID_CARD", "CERTIFICATE"]
    : ["STUDENT_ID_CARD", "TRANSCRIPT", "CERTIFICATE"];
  return documentTypes.some((type) => acceptedTypes.includes(type));
};

export default function TutorApplicationsPage() {
  const { applications, isLoading, error, fetchAll, approveApplication, rejectApplication, applicationStatus, setApplicationStatus } = useAdmin();
  const [selectedStatus, setSelectedStatus] = useState(applicationStatus);
  const [preview, setPreview] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  const loadStatus = async (status) => {
    setSelectedStatus(status);
    setApplicationStatus(status);
    await fetchAll();
  };

  const handleAction = async (action) => {
    try {
      await action();
    } catch {
      return;
    }
  };

  const handlePreview = async (application, document) => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setPreviewError(null);
    setIsPreviewLoading(true);
    try {
      const blob = await adminService.getTutorDocument(application.id, document.id);
      const url = URL.createObjectURL(blob);
      setPreview({
        url,
        name: document.fileName,
        type: blob.type,
      });
    } catch (previewRequestError) {
      setPreviewError(
        previewRequestError.response?.data?.error?.message ||
          "Unable to load this qualification document.",
      );
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Link to="/admin" className="text-sm font-semibold text-[#013638] hover:underline">
              ← Dashboard
            </Link>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-[#013638]">
              Tutor applications
            </h1>
          </div>
          <Button onClick={fetchAll} disabled={isLoading}>
            {isLoading ? "Refreshing..." : "Refresh"}
          </Button>
        </div>

        <div className="flex flex-col gap-6">
          <section className="flex-1 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-5 flex flex-wrap gap-2">
              {filters.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => loadStatus(status)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                    selectedStatus === status
                      ? "border-[#013638] bg-[#013638] text-white"
                      : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>

            {error && <ErrorMessage message={error} />}

            {isLoading ? (
              <Loader label="Loading tutor applications..." />
            ) : applications.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-5 py-10 text-center">
                <p className="text-lg font-semibold text-slate-700">No applications found</p>
                <p className="mt-2 text-sm text-slate-500">There are no tutor applications in this status.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map((app) => (
                  <article key={app.id} className="rounded-2xl border border-slate-200 p-5">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="min-w-0">
                        <h2 className="text-lg font-semibold text-slate-900">
                          {app.applicant?.fullName || "Unknown applicant"}
                        </h2>
                        <p className="mt-1 text-sm text-slate-600">
                          {app.institutionName || "Institution not provided"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {app.applicant?.phoneOrEmail || "Contact not provided"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {{
                            HIGH_SCHOOL: "High school tutor",
                              UNIVERSITY: "University student / lecturer / graduate",
                          }[app.educationLevel] || "Education not provided"}
                        </p>
                        {app.currentGradeLevel && (
                          <p className="mt-1 text-sm text-slate-500">
                            Current grade: {app.currentGradeLevel.replace("_", " ")}
                          </p>
                        )}
                        {app.yearOfStudy && (
                          <p className="mt-1 text-sm text-slate-500">
                            Year of study: {app.yearOfStudy}
                          </p>
                        )}
                        <p className="mt-1 text-sm text-slate-500">
                          {app.fieldOfStudy || "Field of study not provided"}
                        </p>
                        <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{app.bio}</p>
                      </div>

                      <div className="flex flex-wrap gap-2 md:justify-end">
                        <Button
                          disabled={!hasRequiredCredential(app)}
                          onClick={() => handleAction(() => approveApplication(app.id))}
                        >
                          Approve
                        </Button>
                        <Button variant="secondary" onClick={() => handleAction(() => rejectApplication(app.id, "Application rejected by admin."))}>
                          Reject
                        </Button>
                      </div>
                    </div>
                    <div className="mt-5 border-t border-slate-100 pt-4">
                      <h3 className="text-sm font-semibold text-slate-800">Verification documents</h3>
                      {app.documents?.length ? (
                        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                          {app.documents.map((document) => (
                            <li
                              key={document.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 p-3 text-sm"
                            >
                              <span className="min-w-0 break-words text-slate-700">
                                <span className="block font-medium">
                                  {document.documentType === "CERTIFICATE"
                                    ? app.educationLevel === "HIGH_SCHOOL"
                                      ? "Official school report card"
                                      : "Degree / graduation certificate"
                                    : document.documentType === "STUDENT_ID_CARD"
                                      ? app.educationLevel === "HIGH_SCHOOL"
                                        ? "School student ID"
                                        : "University ID"
                                      : documentLabels[document.documentType] || document.documentType}
                                </span>
                                <span className="text-xs text-slate-500">{document.fileName}</span>
                              </span>
                              <Button
                                variant="secondary"
                                onClick={() => handlePreview(app, document)}
                                disabled={isPreviewLoading}
                              >
                                Preview
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-2 text-sm text-amber-700">
                          No documents uploaded. The application cannot be approved yet.
                        </p>
                      )}
                      {!hasRequiredCredential(app) && app.documents?.length > 0 && (
                        <p className="mt-2 text-sm text-amber-700">
                          Upload a required {app.educationLevel === "HIGH_SCHOOL"
                            ? "school ID or official report card"
                            : "university ID, transcript, or degree/GC document"} before approval.
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
        {(isPreviewLoading || previewError || preview) && (
          <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="font-semibold text-[#013638]">
                {preview?.name || "Qualification document"}
              </h2>
              <Button
                variant="secondary"
                onClick={() => {
                  if (preview?.url) URL.revokeObjectURL(preview.url);
                  setPreview(null);
                  setPreviewError(null);
                }}
              >
                Close preview
              </Button>
            </div>
            {isPreviewLoading && <p role="status" className="text-sm text-slate-600">Loading document…</p>}
            {previewError && <ErrorMessage message={previewError} />}
            {preview?.type === "application/pdf" && (
              <iframe title={preview.name} src={preview.url} className="h-[70vh] w-full rounded-lg border border-slate-200" />
            )}
            {preview?.type.startsWith("image/") && (
              <img src={preview.url} alt={preview.name} className="mx-auto max-h-[70vh] max-w-full rounded-lg object-contain" />
            )}
            {preview && !preview.type.startsWith("image/") && preview.type !== "application/pdf" && (
              <p className="text-sm text-slate-600">This document format cannot be previewed.</p>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
