import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  Mail,
  Phone,
  PhoneCall,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { adminService } from "../services/admin.service";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";

const userStatuses = [
  { value: "APPROVED", label: "Active / Approved" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "BANNED", label: "Banned" },
];

export default function AdminUserManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentRoleParam = searchParams.get("role") || "";

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [activeTab, setActiveTab] = useState(
    currentRoleParam === "TUTOR" ? "TUTOR" : currentRoleParam === "STUDENT" ? "STUDENT" : "ALL"
  );

  // Modal state
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalStatus, setModalStatus] = useState("APPROVED");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isVerifyingCall, setIsVerifyingCall] = useState(false);
  const [callVerifiedCheck, setCallVerifiedCheck] = useState(false);

  // Sync tab with URL
  useEffect(() => {
    if (currentRoleParam === "TUTOR") {
      setActiveTab("TUTOR");
    } else if (currentRoleParam === "STUDENT") {
      setActiveTab("STUDENT");
    }
  }, [currentRoleParam]);

  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (activeTab !== "ALL") params.role = activeTab;
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const data = await adminService.getUsers(params);
      // Filter out users with role 'ADMIN' so only regular users appear
      const regularUsers = Array.isArray(data)
        ? data.filter((user) => user.role !== "ADMIN")
        : [];
      setUsers(regularUsers);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Unable to load users."
      );
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, statusFilter, searchQuery]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (newTab === "ALL") {
      searchParams.delete("role");
    } else {
      searchParams.set("role", newTab);
    }
    setSearchParams(searchParams);
  };

  const handleOpenUserModal = (user) => {
    setSelectedUser(user);
    setModalStatus(user.status);
    setCallVerifiedCheck(user.status === "APPROVED");
    setError(null);
    setSuccessMessage("");
  };

  const handleCloseModal = () => {
    setSelectedUser(null);
    setError(null);
  };

  const handleUpdateStatus = async () => {
    if (!selectedUser) return;
    setIsUpdatingStatus(true);
    setError(null);
    setSuccessMessage("");
    try {
      const updated = await adminService.updateUserStatus(selectedUser.id, modalStatus);
      setSelectedUser((prev) => ({ ...prev, status: updated.status }));
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, status: updated.status } : u))
      );
      setSuccessMessage(`Account status updated to ${updated.status}.`);
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to update status."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleVerifyCall = async () => {
    if (!selectedUser) return;
    setIsVerifyingCall(true);
    setError(null);
    setSuccessMessage("");
    try {
      const updated = await adminService.verifyTutorCall(selectedUser.id);
      setSelectedUser((prev) => ({ ...prev, status: updated.status }));
      setUsers((prev) =>
        prev.map((u) => (u.id === selectedUser.id ? { ...u, status: updated.status } : u))
      );
      setSuccessMessage(
        "Tutor verified via phone call successfully! Ready for student assignment."
      );
    } catch (err) {
      setError(
        err.response?.data?.error?.message ||
          err.response?.data?.message ||
          "Failed to verify tutor via call."
      );
    } finally {
      setIsVerifyingCall(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              to="/admin"
              className="text-xs font-bold uppercase tracking-wider text-[#013638] hover:underline"
            >
              ← Admin Dashboard
            </Link>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
              {activeTab === "TUTOR" ? "Tutor User Management" : "User Management"}
            </h1>
            <p className="text-xs text-slate-500 sm:text-sm">
              Review and manage platform users, inspect contact credentials, and verify tutors before student assignment.
            </p>
          </div>
        </div>

        {error && <ErrorMessage message={error} />}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Filters and Search Bar */}
        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
          {/* Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
            <button
              type="button"
              onClick={() => handleTabChange("ALL")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "ALL"
                  ? "bg-[#013638] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <Users className="h-3.5 w-3.5" />
              <span>All Users</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("TUTOR")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "TUTOR"
                  ? "bg-[#013638] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              <span>Tutor User Management</span>
            </button>
            <button
              type="button"
              onClick={() => handleTabChange("STUDENT")}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 text-xs font-bold transition ${
                activeTab === "STUDENT"
                  ? "bg-[#013638] text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>Students</span>
            </button>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, phone number, or email..."
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 outline-none transition focus:border-[#013638] focus:bg-white focus:ring-2 focus:ring-[#013638]/15"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 outline-none focus:border-[#013638] focus:bg-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Active / Approved</option>
              <option value="PENDING">Pending Approval</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BANNED">Banned</option>
            </select>

            <Button
              type="button"
              variant="secondary"
              onClick={loadUsers}
              className="text-xs font-bold py-2.5 px-4 rounded-2xl"
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Users Table */}
        <div className="overflow-hidden rounded-3xl border border-slate-200/90 bg-white shadow-xs">
          {isLoading ? (
            <div className="py-16 text-center text-xs text-slate-500">
              Loading user directory...
            </div>
          ) : users.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">
              No matching users found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-100 bg-slate-50/70 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-5 py-3.5">User</th>
                    <th className="px-5 py-3.5">Contact (Phone / Email)</th>
                    <th className="px-5 py-3.5">Role</th>
                    <th className="px-5 py-3.5">Specialization / Grade</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {users
                    .filter((user) => user.role !== "ADMIN")
                    .map((user) => {
                    const isTutor = user.role === "TUTOR";
                    const isPhone = user.phoneOrEmail?.startsWith("+") || /^\d+$/.test(user.phoneOrEmail?.replace(/\D/g, ""));
                    const subjects = user.tutorProfile?.subjects || [];

                    return (
                      <tr
                        key={user.id}
                        onClick={() => handleOpenUserModal(user)}
                        className="cursor-pointer transition hover:bg-slate-50/80"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#013638] to-[#0ea5a7] font-bold text-white shadow-xs">
                              {user.fullName?.charAt(0).toUpperCase() || "U"}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900">{user.fullName}</p>
                              <p className="text-[10px] text-slate-400">ID: {user.id.slice(0, 12)}...</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5 font-medium text-slate-800">
                            {isPhone ? (
                              <Phone className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <Mail className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                            )}
                            <span className="font-semibold">{user.phoneOrEmail}</span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center rounded-lg px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${
                              user.role === "ADMIN"
                                ? "bg-purple-100 text-purple-800"
                                : isTutor
                                ? "bg-teal-100 text-[#013638]"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {user.role}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {isTutor ? (
                            <div>
                              <p className="font-semibold text-slate-800 truncate max-w-xs">
                                {subjects.length > 0
                                  ? subjects.map((s) => s.subject.name).join(", ")
                                  : "General Tutor"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                {user.tutorProfile?.institutionName || "Academic Mentor"}
                              </p>
                            </div>
                          ) : (
                            <span className="text-slate-500 font-medium">
                              {user.studentProfile?.gradeLevel?.replace("_", " ") || "Student"}
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                              user.status === "APPROVED"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                : user.status === "PENDING"
                                ? "bg-amber-50 text-amber-700 border border-amber-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                user.status === "APPROVED"
                                  ? "bg-emerald-500"
                                  : user.status === "PENDING"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            />
                            {user.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUserModal(user);
                            }}
                            className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-[#013638] shadow-2xs hover:bg-slate-50 hover:border-[#013638] transition"
                          >
                            <span>Inspect</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* USER DETAIL & PHONE VERIFICATION MODAL */}
        {selectedUser && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs"
            role="dialog"
            aria-modal="true"
          >
            <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#013638] text-lg font-black text-white shadow-md">
                    {selectedUser.fullName?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-slate-900">{selectedUser.fullName}</h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-bold text-teal-700">{selectedUser.role}</span>
                      <span className="text-slate-300">•</span>
                      <span className="text-[11px] text-slate-500">ID: {selectedUser.id}</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Contact Information Banner */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                    Direct Contact Credentials
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-700">Verified identity</span>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 border border-emerald-100 shadow-2xs">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Phone Number</p>
                      <a
                        href={`tel:${selectedUser.phoneOrEmail}`}
                        className="text-xs font-black text-emerald-950 hover:underline"
                      >
                        {selectedUser.phoneOrEmail}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 border border-emerald-100 shadow-2xs">
                    <Mail className="h-4 w-4 text-sky-600" />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Email or Login</p>
                      <span className="text-xs font-semibold text-slate-800">{selectedUser.phoneOrEmail}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tutor Profile Details (if tutor) */}
              {selectedUser.role === "TUTOR" && selectedUser.tutorProfile && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#013638] flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span>Tutor Academic Profile & Specializations</span>
                  </h3>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400">Education:</span>
                      <p className="font-semibold text-slate-800">
                        {selectedUser.tutorProfile.educationLevel}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Institution:</span>
                      <p className="font-semibold text-slate-800">
                        {selectedUser.tutorProfile.institutionName || "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Field / Major:</span>
                      <p className="font-semibold text-slate-800">
                        {selectedUser.tutorProfile.fieldOfStudy || "General Studies"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400">Year of Study:</span>
                      <p className="font-semibold text-slate-800">
                        {selectedUser.tutorProfile.yearOfStudy ? `Year ${selectedUser.tutorProfile.yearOfStudy}` : "Completed"}
                      </p>
                    </div>
                  </div>

                  {selectedUser.tutorProfile.bio && (
                    <div className="pt-2 border-t border-slate-200 text-xs">
                      <span className="text-slate-400 block mb-1">Bio / Overview:</span>
                      <p className="text-slate-700 leading-relaxed italic">
                        "{selectedUser.tutorProfile.bio}"
                      </p>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-400 text-xs block mb-1.5">Approved Subjects:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedUser.tutorProfile.subjects?.map((s) => (
                        <span
                          key={`${s.subject.id}-${s.gradeLevel}`}
                          className="rounded-lg bg-teal-100 px-2.5 py-1 text-[11px] font-bold text-[#013638]"
                        >
                          {s.subject.name} · {s.gradeLevel.replace("_", " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* WORKFLOW: Admin Call & Verify Tutor before formal assignment */}
              {selectedUser.role === "TUTOR" && (
                <div className="rounded-2xl border-2 border-teal-600/30 bg-teal-50/50 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#013638]">
                    <PhoneCall className="h-4 w-4 text-teal-700" />
                    <span className="uppercase tracking-wider">
                      Tutor Verification & Call Workflow
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Admins must call and verify the tutor at{" "}
                    <strong className="text-slate-900">{selectedUser.phoneOrEmail}</strong> before assigning
                    them to student mentorship courses.
                  </p>

                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={callVerifiedCheck}
                      onChange={(e) => setCallVerifiedCheck(e.target.checked)}
                      className="h-4 w-4 rounded-md border-slate-300 text-[#013638] focus:ring-[#013638]"
                    />
                    <span>I have called this tutor, verified their credentials & confirmed subject readiness.</span>
                  </label>

                  <div className="pt-2">
                    <Button
                      type="button"
                      disabled={isVerifyingCall || !callVerifiedCheck}
                      onClick={handleVerifyCall}
                      className="w-full text-xs font-bold py-2.5 rounded-xl bg-[#013638] hover:bg-[#01494b]"
                    >
                      {isVerifyingCall ? "Verifying..." : "Confirm Phone Call & Approve Tutor for Assignment"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Account Status Setting */}
              <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Account Status Controls
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <select
                    value={modalStatus}
                    onChange={(e) => setModalStatus(e.target.value)}
                    className="flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-[#013638]"
                  >
                    {userStatuses.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>

                  <Button
                    type="button"
                    disabled={isUpdatingStatus || modalStatus === selectedUser.status}
                    onClick={handleUpdateStatus}
                    className="text-xs font-bold py-2.5 px-5 rounded-xl"
                  >
                    {isUpdatingStatus ? "Updating..." : "Save Status"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
