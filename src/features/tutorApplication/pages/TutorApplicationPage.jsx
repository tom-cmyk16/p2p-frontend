import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTutorApplication } from "../hooks/useTutorApplication";
import { tutorApplicationService } from "../services/tutorApplication.service";
import { useAuthContext } from "../../../context/AuthContext";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";
import ErrorMessage from "../../../components/common/ErrorMessage";

const documentLabels = {
  STUDENT_ID_CARD: "School student ID",
  TRANSCRIPT: "Official transcript",
  CERTIFICATE: "Official qualification certificate",
  OTHER: "Other supporting document",
};

export default function TutorApplicationPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuthContext();
  const {
    application,
    isLoading,
    isSubmitting,
    isUploading,
    error,
    submitApplication,
    uploadDocument,
  } = useTutorApplication();
  const [isReapplying, setIsReapplying] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewError, setPreviewError] = useState(null);
  const [statusSyncError, setStatusSyncError] = useState(null);
  const [form, setForm] = useState({
    educationLevel: "HIGH_SCHOOL",
    institutionName: "",
    currentGradeLevel: "GRADE_12",
    fieldOfStudy: "",
    yearOfStudy: "",
    bio: "",
  });
  const [documentType, setDocumentType] = useState("CERTIFICATE");
  const [credentialFile, setCredentialFile] = useState(null);

  useEffect(() => () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
  }, [preview]);

  useEffect(() => {
    if (user?.role !== "TUTOR" || user.status !== "PENDING") return undefined;

    let isMounted = true;
    const synchronizeStatus = async () => {
      try {
        const updatedUser = await refreshUser();
        if (!isMounted) return;
        setStatusSyncError(null);
        if (updatedUser.status === "APPROVED") {
          navigate("/tutor-portal", { replace: true });
        }
      } catch (error) {
        if (isMounted) {
          setStatusSyncError(
            error.response?.data?.error?.message || "Unable to refresh tutor approval status.",
          );
        }
      }
    };

    synchronizeStatus();
    const intervalId = window.setInterval(synchronizeStatus, 15000);
    window.addEventListener("focus", synchronizeStatus);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", synchronizeStatus);
    };
  }, [user?.role, user?.status, refreshUser, navigate]);

  const handlePreview = async (document) => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
    setPreviewError(null);
    try {
      const blob = await tutorApplicationService.getDocument(application.id, document.id);
      setPreview({
        url: URL.createObjectURL(blob),
        name: document.fileName,
        type: blob.type,
      });
    } catch (previewRequestError) {
      setPreviewError(
        previewRequestError.response?.data?.error?.message || "Unable to open this document.",
      );
    }
  };

  if (isLoading) return <Loader label="Loading application status..." />;

  const showApplicationForm =
    !application || (application.status === "REJECTED" && isReapplying);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!credentialFile) return;
    const payload = {
      educationLevel: form.educationLevel,
      institutionName: form.institutionName.trim(),
      bio: form.bio.trim(),
      ...(form.educationLevel === "HIGH_SCHOOL"
        ? { currentGradeLevel: form.currentGradeLevel }
        : {
            fieldOfStudy: form.fieldOfStudy.trim(),
            ...(form.yearOfStudy.trim() && {
              yearOfStudy: Number(form.yearOfStudy),
            }),
          }),
    };
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    formData.append("documentType", documentType);
    formData.append("file", credentialFile);

    const createdApplication = await submitApplication(formData);
    if (createdApplication) {
      setDocumentType(
        form.educationLevel === "HIGH_SCHOOL"
          ? "CERTIFICATE"
          : "STUDENT_ID_CARD",
      );
      setIsReapplying(false);
    }
  };

  const tutorDocumentOptions = application?.educationLevel === "HIGH_SCHOOL"
    ? [
        ["CERTIFICATE", "Official school report card"],
        ["STUDENT_ID_CARD", "School student ID"],
      ]
    : [
        ["STUDENT_ID_CARD", "University ID"],
        ["TRANSCRIPT", "Official transcript"],
        ["CERTIFICATE", "Degree / graduation certificate"],
      ];

  return (
    <main className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-2xl space-y-6">
        {application && (
          <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-[#013638]">Tutor Application</h1>
              <p className="text-sm text-slate-600">
                Application status:{" "}
                <span className="font-semibold text-[#013638]">{application.status}</span>
              </p>
            </div>

            {application.status === "REJECTED" && application.rejectionReason && (
              <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                Rejection reason: {application.rejectionReason}
              </p>
            )}

            {error && <ErrorMessage message={error} />}
            {statusSyncError && <ErrorMessage message={statusSyncError} />}

            {application.status === "REJECTED" && !isReapplying && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  Update your information and credentials to submit a new application.
                </p>
                <Button onClick={() => setIsReapplying(true)} className="w-full justify-center">
                  Submit a new application
                </Button>
              </div>
            )}

            {["SUBMITTED", "UNDER_REVIEW"].includes(application.status) && (
              <div className="space-y-4 rounded-xl bg-slate-50 p-4">
                <div>
                  <h2 className="text-base font-semibold text-[#013638]">
                    Upload supporting documents
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    Approval requires a school student ID or official report card for high-school
                    tutors, or a university ID, official transcript, or degree/GC document for
                    university students, lecturers, and graduates.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[1fr_1.5fr]">
                  <select
                    aria-label="Document type"
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                  >
                    {tutorDocumentOptions.map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                    <option value="OTHER">Other supporting document</option>
                  </select>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    disabled={isUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) uploadDocument(file, documentType);
                      event.target.value = "";
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#013638] file:px-3 file:py-2 file:text-white"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  JPG, PNG, or PDF files up to 5 MB. Files are visible only to you and authorized administrators.
                </p>
                {isUploading && (
                  <p role="status" className="text-sm text-slate-600">Uploading document...</p>
                )}
                {application.documents?.length > 0 && (
                  <ul className="space-y-2">
                    {application.documents.map((document) => (
                      <li
                        key={document.id}
                        className="flex flex-wrap items-center justify-between gap-2 text-sm"
                      >
                        <span className="text-slate-700">
                          {document.documentType === "CERTIFICATE"
                            ? application.educationLevel === "HIGH_SCHOOL"
                              ? "Official school report card"
                              : "Degree / graduation certificate"
                            : document.documentType === "STUDENT_ID_CARD"
                              ? application.educationLevel === "HIGH_SCHOOL"
                                ? "School student ID"
                                : "University ID"
                              : documentLabels[document.documentType] || document.documentType}
                          : {document.fileName}
                        </span>
                        <Button variant="secondary" onClick={() => handlePreview(document)}>
                          View
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {error && <ErrorMessage message={error} />}
                {previewError && <ErrorMessage message={previewError} />}
                {preview && (
                  <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="break-all text-sm font-medium text-slate-700">
                        {preview.name}
                      </span>
                      <Button
                        variant="secondary"
                        onClick={() => {
                          URL.revokeObjectURL(preview.url);
                          setPreview(null);
                        }}
                      >
                        Close
                      </Button>
                    </div>
                    {preview.type === "application/pdf" && (
                      <iframe
                        title={preview.name}
                        src={preview.url}
                        className="h-[60vh] w-full rounded border"
                      />
                    )}
                    {preview.type.startsWith("image/") && (
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="mx-auto max-h-[60vh] max-w-full object-contain"
                      />
                    )}
                  </div>
                )}
              </div>
            )}

            {application.status === "APPROVED" && (
              <p className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
                Your tutor application has been approved. Tutor privileges are now enabled.
              </p>
            )}
          </section>
        )}

        {showApplicationForm && (
          <section className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="space-y-2 text-center">
              <h1 className="text-2xl font-bold text-[#013638]">Apply to Become a Tutor</h1>
              <p className="text-sm text-slate-600">
                Your tutor account remains unverified until an administrator approves your credentials.
              </p>
            </div>

            {error && <ErrorMessage message={error} />}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="educationLevel" className="block text-sm font-medium text-slate-700">
                  Education category
                </label>
                <select
                  id="educationLevel"
                  value={form.educationLevel}
                  onChange={(event) => {
                    const educationLevel = event.target.value;
                    setForm({ ...form, educationLevel });
                    setDocumentType(
                      educationLevel === "HIGH_SCHOOL"
                        ? "CERTIFICATE"
                        : "STUDENT_ID_CARD",
                    );
                    setCredentialFile(null);
                  }}
                  className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                >
                  <option value="HIGH_SCHOOL">High-school tutor (Grade 8 or above)</option>
                  <option value="UNIVERSITY">University student, lecturer, or graduate</option>
                </select>
              </div>

              <div>
                <label htmlFor="institutionName" className="block text-sm font-medium text-slate-700">
                  Institution name
                </label>
                <input
                  id="institutionName"
                  type="text"
                  value={form.institutionName}
                  onChange={(event) => setForm({ ...form, institutionName: event.target.value })}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                />
              </div>

              {form.educationLevel === "HIGH_SCHOOL" ? (
                <div>
                  <label htmlFor="currentGradeLevel" className="block text-sm font-medium text-slate-700">
                    Current grade level
                  </label>
                  <select
                    id="currentGradeLevel"
                    value={form.currentGradeLevel}
                    onChange={(event) => setForm({ ...form, currentGradeLevel: event.target.value })}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                  >
                    <option value="GRADE_8">Grade 8</option>
                    <option value="GRADE_9">Grade 9</option>
                    <option value="GRADE_10">Grade 10</option>
                    <option value="GRADE_11">Grade 11</option>
                    <option value="GRADE_12">Grade 12</option>
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="fieldOfStudy" className="block text-sm font-medium text-slate-700">
                      Field of study
                    </label>
                    <input
                      id="fieldOfStudy"
                      type="text"
                      value={form.fieldOfStudy}
                      onChange={(event) => setForm({ ...form, fieldOfStudy: event.target.value })}
                      required
                      className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                    />
                  </div>
                  {form.educationLevel === "UNIVERSITY" && (
                    <div>
                      <label htmlFor="yearOfStudy" className="block text-sm font-medium text-slate-700">
                        Year of study
                      </label>
                      <input
                        id="yearOfStudy"
                        type="number"
                        min="1"
                        step="1"
                        value={form.yearOfStudy}
                        onChange={(event) => setForm({ ...form, yearOfStudy: event.target.value })}
                        required
                        className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                      />
                    </div>
                  )}
                </>
              )}

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-slate-700">
                  Short bio
                </label>
                <textarea
                  id="bio"
                  rows="4"
                  value={form.bio}
                  onChange={(event) => setForm({ ...form, bio: event.target.value })}
                  required
                  className="mt-2 w-full resize-y rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                />
              </div>

              <p className="text-sm text-slate-600">
                Upload a credential with this application. High-school tutors need an official report card or school
                student ID; university students, lecturers, and graduates need a university ID, official transcript,
                or degree/GC certificate.
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700">
                  Required credential type
                  <select
                    value={documentType}
                    onChange={(event) => setDocumentType(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
                  >
                    {form.educationLevel === "HIGH_SCHOOL" ? (
                      <>
                        <option value="CERTIFICATE">Official school report card</option>
                        <option value="STUDENT_ID_CARD">School student ID</option>
                      </>
                    ) : (
                      <>
                        <option value="STUDENT_ID_CARD">University ID</option>
                        <option value="TRANSCRIPT">Official transcript</option>
                        <option value="CERTIFICATE">Degree / graduation certificate</option>
                      </>
                    )}
                  </select>
                </label>
                <label className="block text-sm font-medium text-slate-700">
                  Credential file
                  <input
                    type="file"
                    required
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(event) => setCredentialFile(event.target.files?.[0] || null)}
                    className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-md file:border-0 file:bg-[#013638] file:px-3 file:py-2 file:text-white"
                  />
                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    JPG, PNG, or PDF up to 5 MB.
                  </span>
                </label>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full justify-center py-3 text-sm">
                {isSubmitting ? "Submitting..." : "Submit application"}
              </Button>
            </form>
          </section>
        )}
      </div>
    </main>
  );
}
