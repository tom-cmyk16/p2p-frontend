import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  CreditCard,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  MessageSquareText,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldCheck,
  Sparkles,
  Star,
  UserCircle2,
  UserRound,
  Users,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import { profileService } from "../features/profile/services/profile.service";
import NotificationAlert from "../components/common/NotificationAlert";

const navigationByRole = {
  STUDENT: [
    { label: "Dashboard", to: "/student", icon: LayoutGrid },
    { label: "Packages and payments", to: "/student/packages", icon: CreditCard },
    { label: "Practice quizzes", to: "/quiz", icon: BookOpenCheck },
    { label: "Mentorship schedule", to: "/student/schedule", icon: CalendarDays },
    { label: "My profile", to: "/profile", icon: UserRound },
  ],
  TUTOR: [
    { label: "Dashboard", to: "/tutor-portal", icon: LayoutGrid },
    { label: "Student inbox", to: "/tutor-portal/chat", icon: MessageSquareText },
    { label: "Availability", to: "/tutor-portal/schedule", icon: CalendarDays },
    { label: "Ratings & feedback", to: "/tutor-portal/ratings", icon: Star },
    { label: "Tutor profile", to: "/tutor-portal/profile", icon: UserCircle2 },
  ],
  ADMIN: [
    { label: "Dashboard", to: "/admin", icon: LayoutGrid },
    { label: "User Management", to: "/admin/users", icon: Users },
    { label: "Tutor Applications", to: "/admin/tutor-applications", icon: BriefcaseBusiness },
    { label: "Report Management", to: "/admin/reports", icon: FileText },
    { label: "Content Management", to: "/admin/content", icon: GraduationCap },
    { label: "Packages & Pricing", to: "/admin/packages", icon: CreditCard },
    { label: "Revenue and Payouts", to: "/admin/revenue", icon: ShieldCheck },
  ],
};

function PasswordChangeDialog({ onClose }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }

    setIsSaving(true);
    try {
      await profileService.changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess("Password changed successfully.");
    } catch (requestError) {
      setError(
        requestError.response?.data?.error?.message ||
          requestError.response?.data?.message ||
          "Unable to change your password.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-8"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-dialog-title"
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="password-dialog-title" className="text-xl font-semibold text-[#013638]">
              Change password
            </h2>
            <p className="mt-1 text-sm text-slate-600">Choose a new password for your account.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close password change"
            className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          >
            ×
          </button>
        </div>

        {error && (
          <NotificationAlert
            type="error"
            message={error}
            duration={5000}
            onDismiss={() => setError("")}
            className="mt-5"
          />
        )}
        {success && (
          <NotificationAlert
            type="success"
            message={success}
            duration={5000}
            onDismiss={() => setSuccess("")}
            className="mt-5"
          />
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Current password
            <input
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Confirm new password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-[#013638] focus:ring-2 focus:ring-[#013638]/15"
            />
          </label>
          <button
            type="submit"
            disabled={isSaving}
            className="w-full rounded-lg bg-[#013638] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#01494b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}

function LogoutConfirmModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm px-4 py-8 animate-in fade-in duration-200"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-dialog-title"
        className="w-full max-w-sm rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200"
      >
        {/* Warning Icon Badge */}
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 shadow-inner">
          <LogOut className="h-6 w-6 stroke-[2.2]" />
        </div>

        {/* Heading & Subtext */}
        <h3
          id="logout-dialog-title"
          className="text-lg font-bold text-slate-900"
        >
          Are you sure you want to log out?
        </h3>
        <p className="mt-2 text-xs sm:text-sm text-slate-500 leading-relaxed">
          You will need to sign in again with your email and password to access your dashboard.
        </p>

        {/* Action Buttons */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:flex-1 rounded-xl bg-rose-600 px-4 py-2.5 text-xs sm:text-sm font-bold text-white hover:bg-rose-700 active:scale-[0.98] transition-all shadow-sm shadow-rose-600/20 cursor-pointer"
          >
            Yes, Log out
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PortalLayout({ children }) {
  const { user, logout } = useAuthContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();
  const navigate = useNavigate();

  const navigation = user.role === "TUTOR" && user.status !== "APPROVED"
    ? [{ label: "Tutor application", to: "/tutor-application", icon: BriefcaseBusiness }]
    : navigationByRole[user.role] || [];

  const allNavItems = useMemo(() => {
    const list = [];
    navigation.forEach((item) => {
      if (item.children) {
        list.push(...item.children);
      } else {
        list.push(item);
      }
    });
    return list;
  }, [navigation]);

  const activePage = allNavItems
    .slice()
    .sort((a, b) => b.to.length - a.to.length)
    .find(({ to }) => {
      const currentFull = location.pathname + location.search;
      if (to.includes("?")) {
        return currentFull === to;
      }
      return location.pathname === to || (to !== "/" && to !== "/admin" && location.pathname.startsWith(`${to}/`));
    }) || allNavItems.find(({ to }) => location.pathname === to);

  const profilePath = user.role === "TUTOR" && user.status === "APPROVED"
    ? "/tutor-portal/profile"
    : user.role === "TUTOR"
      ? "/tutor-application"
      : "/profile";

  const handleRequestLogout = () => {
    setIsLogoutModalOpen(true);
    document.activeElement?.closest("details")?.removeAttribute("open");
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-left text-slate-900">
      <div className="flex min-h-screen">
        {isSidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-30 bg-slate-950/30 lg:hidden"
          />
        )}

        <aside
          className={[
            "fixed inset-y-0 left-0 z-40 flex h-full max-h-screen shrink-0 flex-col border-r border-slate-200/80 bg-[#f8fafc] bg-gradient-to-b from-white via-slate-50 to-[#eef4f8] shadow-[0_0_0_1px_rgba(15,23,42,0.02),0_18px_50px_rgba(15,23,42,0.08)] transition-all duration-300 ease-out",
            "lg:sticky lg:top-0 lg:h-screen lg:max-h-screen lg:z-30",
            isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
            isSidebarCollapsed ? "lg:w-20" : "lg:w-72",
            "w-[calc(100%-2rem)] max-w-72 sm:w-72",
          ].join(" ")}
        >
          <div className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200/80 px-3.5">
            <div className={`flex items-center gap-3 overflow-hidden ${isSidebarCollapsed ? "lg:justify-center" : ""}`}>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f172a] via-[#013638] to-[#0ea5a7] text-sm font-bold text-white shadow-lg shadow-[#013638]/20">
                P
              </div>
              {!isSidebarCollapsed && (
                <Link to="/" className="truncate text-base font-bold tracking-tight text-[#013638]">
                  P2P Exam Prep
                </Link>
              )}
            </div>

            <button
              type="button"
              aria-label={isSidebarCollapsed ? "Expand navigation" : "Collapse navigation"}
              onClick={() => setIsSidebarCollapsed((prev) => !prev)}
              className="hidden rounded-lg p-2 text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-800 lg:inline-flex"
            >
              {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
            </button>

            <button
              type="button"
              aria-label="Close navigation"
              onClick={() => setIsSidebarOpen(false)}
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200/70 hover:text-slate-800 lg:hidden"
            >
              <span aria-hidden="true">×</span>
            </button>
          </div>

          {!isSidebarCollapsed && (
            <div className="shrink-0 px-5 pb-2 pt-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                {user.role === "ADMIN" ? "Administration" : user.role === "TUTOR" ? "Tutor workspace" : "Student workspace"}
              </p>
            </div>
          )}

          <nav
            aria-label="Main navigation"
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-1.5 px-3 pb-3 pt-2 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent]"
          >
            {navigation.map((item) => {
              const { label, to, icon: Icon, children } = item;
              if (children && children.length > 0) {
                const isChildActive = children.some((child) => {
                  const currentFull = location.pathname + location.search;
                  return child.to.includes("?")
                    ? currentFull === child.to
                    : location.pathname === child.to || (child.to !== "/admin" && location.pathname.startsWith(`${child.to}/`));
                });
                const isExpanded = expandedMenus[label] ?? isChildActive;

                if (isSidebarCollapsed) {
                  return (
                    <NavLink
                      key={label}
                      to={children[0].to}
                      className={[
                        "group relative flex items-center justify-center rounded-2xl p-3 text-sm font-medium transition-all duration-200 ease-out",
                        isChildActive
                          ? "bg-[#013638] text-white shadow-[0_10px_20px_rgba(1,54,56,0.18)]"
                          : "text-slate-600 hover:bg-white hover:text-[#013638] hover:shadow-sm",
                      ].join(" ")}
                      title={label}
                    >
                      <Icon size={18} className="shrink-0" />
                    </NavLink>
                  );
                }

                return (
                  <div key={label} className="space-y-1">
                    <button
                      type="button"
                      onClick={() =>
                        setExpandedMenus((prev) => ({
                          ...prev,
                          [label]: !isExpanded,
                        }))
                      }
                      className={[
                        "group flex w-full items-center justify-between rounded-2xl px-3 py-2 text-sm font-semibold transition-all duration-200",
                        isChildActive
                          ? "bg-[#013638]/10 text-[#013638]"
                          : "text-slate-700 hover:bg-white hover:text-[#013638]",
                      ].join(" ")}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-lg ${isChildActive ? "bg-[#013638] text-white" : "bg-slate-200/70 text-slate-600 group-hover:bg-[#013638]/10 group-hover:text-[#013638]"}`}>
                          <Icon size={15} />
                        </span>
                        <span className="truncate text-xs font-bold tracking-tight">{label}</span>
                      </div>
                      <ChevronDown
                        size={14}
                        className={`text-slate-400 transition-transform duration-200 ${isExpanded ? "rotate-0" : "-rotate-90"}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="ml-4 space-y-1 border-l-2 border-slate-200/80 pl-2">
                        {children.map((child) => {
                          const currentFull = location.pathname + location.search;
                          const isSubActive = child.to.includes("?")
                            ? currentFull === child.to
                            : location.pathname === child.to;

                          return (
                            <Link
                              key={child.label + child.to}
                              to={child.to}
                              onClick={() => setIsSidebarOpen(false)}
                              className={[
                                "flex items-center gap-2 rounded-xl px-2.5 py-1.5 text-xs font-medium transition-all duration-150",
                                isSubActive
                                  ? "bg-[#013638] font-bold text-white shadow-sm"
                                  : "text-slate-600 hover:bg-white hover:text-[#013638]",
                              ].join(" ")}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${isSubActive ? "bg-white" : "bg-slate-300"}`} />
                              <span className="truncate">{child.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/student" || to === "/tutor-portal" || to === "/admin"}
                  className={({ isActive }) =>
                    [
                      "group relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
                      isSidebarCollapsed ? "lg:justify-center lg:px-0 lg:py-3" : "",
                      isActive
                        ? "bg-[#013638] text-white shadow-[0_10px_20px_rgba(1,54,56,0.18)]"
                        : "text-slate-600 hover:bg-white hover:text-[#013638] hover:shadow-sm",
                    ].join(" ")
                  }
                  onClick={() => setIsSidebarOpen(false)}
                  title={isSidebarCollapsed ? label : undefined}
                >
                  <span className={`flex h-8 w-8 items-center justify-center rounded-xl ${isSidebarCollapsed ? "lg:h-9 lg:w-9" : ""}`}>
                    <Icon size={18} className="shrink-0" />
                  </span>
                  {!isSidebarCollapsed && <span className="truncate">{label}</span>}
                </NavLink>
              );
            })}
          </nav>

          <div className={`shrink-0 m-3 mt-auto rounded-2xl border border-slate-200/80 bg-white/80 p-3 shadow-sm backdrop-blur-sm ${isSidebarCollapsed ? "lg:hidden" : ""}`}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#013638] to-[#0ea5a7] text-sm font-semibold text-white">
                {user.fullName?.trim().charAt(0).toUpperCase() || "U"}
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{user.fullName}</p>
                  <p className="mt-0.5 truncate text-[11px] text-slate-500">{user.phoneOrEmail}</p>
                </div>
              )}
              {!isSidebarCollapsed && (
                <button
                  type="button"
                  onClick={handleRequestLogout}
                  title="Log out"
                  className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition cursor-pointer"
                >
                  <LogOut size={16} />
                </button>
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Open navigation"
                aria-expanded={isSidebarOpen}
                onClick={() => setIsSidebarOpen(true)}
                className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
              >
                <Menu size={18} />
              </button>

              <button
                type="button"
                aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                className="hidden rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:inline-flex"
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>

              <Link to="/" className="text-sm font-bold text-[#013638] lg:hidden">P2P</Link>
              <span className="hidden h-5 w-px bg-slate-200 lg:block" />
              <p className="truncate text-sm font-semibold text-slate-800">
                {activePage?.label || "Tutor application"}
              </p>
            </div>

            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-2 py-1.5 outline-none transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-[#013638]/30">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#013638] to-[#0ea5a7] text-sm font-semibold text-white shadow-sm">
                  {user.fullName?.trim().charAt(0).toUpperCase() || "U"}
                </span>
                <span className="hidden max-w-40 truncate text-left text-sm font-medium text-slate-700 sm:block">
                  {user.fullName}
                </span>
                <ChevronDown size={14} className="text-slate-500" />
              </summary>
              <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl shadow-slate-300/20">
                <Link
                  to={profilePath}
                  onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}
                  className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#013638]"
                >
                  <UserCircle2 size={16} />
                  User Profile
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordDialogOpen(true);
                    document.activeElement?.closest("details")?.removeAttribute("open");
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm text-slate-700 transition hover:bg-slate-50 hover:text-[#013638]"
                >
                  <ShieldCheck size={16} />
                  Password Change
                </button>
                <button
                  type="button"
                  onClick={handleRequestLogout}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-700 transition hover:bg-red-50 cursor-pointer"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </details>
          </header>

          <div className="flex-1">
            <div className="portal-content min-h-full [&>main]:text-left">{children}</div>
          </div>
        </div>
      </div>
      {isPasswordDialogOpen && (
        <PasswordChangeDialog onClose={() => setIsPasswordDialogOpen(false)} />
      )}
      <LogoutConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}
