import { useState, useEffect, useCallback } from "react";
import { adminService } from "../services/admin.service";

export function useAdmin() {
  const [dashboard, setDashboard] = useState(null);
  const [applications, setApplications] = useState([]);
  const [reports, setReports] = useState([]);
  const [applicationStatus, setApplicationStatus] = useState("SUBMITTED");
  const [reportStatus, setReportStatus] = useState("PENDING");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [overview, apps, reps] = await Promise.all([
        adminService.getDashboardOverview(),
        adminService.getPendingApplications(applicationStatus),
        adminService.getOpenReports(reportStatus),
      ]);

      setDashboard(overview);
      setApplications(apps);
      setReports(reps);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to load admin data",
      );
    } finally {
      setIsLoading(false);
    }
  }, [applicationStatus, reportStatus]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const approveApplication = async (id) => {
    try {
      await adminService.approveApplication(id);
      setApplications((prev) => prev.filter((app) => app.id !== id));
      setError(null);
      await fetchAll();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to approve application",
      );
      throw err;
    }
  };

  const rejectApplication = async (id, reason) => {
    try {
      await adminService.rejectApplication(id, reason);
      setApplications((prev) => prev.filter((app) => app.id !== id));
      setError(null);
      await fetchAll();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to reject application",
      );
      throw err;
    }
  };

  const resolveReport = async (id, status) => {
    try {
      await adminService.resolveReport(id, status);
      setReports((prev) => prev.filter((report) => report.id !== id));
      setError(null);
      await fetchAll();
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to resolve report",
      );
      throw err;
    }
  };

  const updateTutorStatus = async (id, status) => {
    try {
      const updatedTutor = await adminService.updateUserStatus(id, status);
      setDashboard((current) => current && ({
        ...current,
        metrics: {
          ...current.metrics,
          tutors: current.metrics.tutors + (status === "APPROVED" ? 1 : -1),
        },
        tutors: current.tutors.map((tutor) =>
          tutor.id === id ? { ...tutor, status: updatedTutor.status } : tutor
        ),
      }));
      setError(null);
      return updatedTutor;
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to update tutor status",
      );
      throw err;
    }
  };

  return {
    dashboard,
    applications,
    reports,
    applicationStatus,
    setApplicationStatus,
    reportStatus,
    setReportStatus,
    isLoading,
    error,
    fetchAll,
    approveApplication,
    rejectApplication,
    resolveReport,
    updateTutorStatus,
  };
}