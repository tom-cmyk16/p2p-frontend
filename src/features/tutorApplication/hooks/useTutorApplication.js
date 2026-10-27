import { useState, useEffect, useCallback } from "react";
import { tutorApplicationService } from "../services/tutorApplication.service";

const getErrorMessage = (err, fallback) =>
  err.response?.data?.error?.message || err.response?.data?.message || err.message || fallback;

export function useTutorApplication() {
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);

  const fetchApplication = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await tutorApplicationService.getMyApplication();
      setApplication(data);
    } catch (err) {
      if (err.response?.status === 404) {
        setApplication(null);
      } else {
        setError(getErrorMessage(err, "Failed to load application status"));
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const submitApplication = async (payload) => {
    setIsSubmitting(true);
    setError(null);
    try {
      const created = await tutorApplicationService.submitApplication(payload);
      setApplication(created);
      return created;
    } catch (err) {
      setError(getErrorMessage(err, "Failed to submit tutor application"));
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadDocument = async (file, documentType) => {
    if (!application) {
      setError("Submit the application before uploading documents.");
      return null;
    }

    const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG, PNG, and PDF files are allowed.");
      return null;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Each file must be 5 MB or smaller.");
      return null;
    }

    setIsUploading(true);
    setError(null);
    try {
      const document = await tutorApplicationService.uploadDocument(application.id, file, documentType);
      setApplication((current) => ({
        ...current,
        documents: [...(current.documents || []), document],
      }));
      return document;
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upload document"));
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    application,
    isLoading,
    isSubmitting,
    isUploading,
    error,
    submitApplication,
    uploadDocument,
    refetch: fetchApplication,
  };
}
