import { useState } from "react";
import { reportService } from "../services/report.service";

export function useReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const submitReport = async (targetType, targetId, reason) => {
    setIsLoading(true);
    setError(null);
    try {
      await reportService.submitReport({ targetType, targetId, reason });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit report");
    } finally {
      setIsLoading(false);
    }
  };

  return { submitReport, isLoading, error, submitted };
}
