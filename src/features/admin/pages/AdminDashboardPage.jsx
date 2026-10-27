import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  Check,
  CircleAlert,
  CreditCard,
  GraduationCap,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  Users,
} from "lucide-react";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";
import Loader from "../../../components/common/Loader";
import { useAdmin } from "../hooks/useAdmin";

const gradeLevels = ["GRADE_8", "GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"];

const formatGrade = (grade) => grade?.replace("_", " ") || "Grade not set";

const formatDate = (value) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));

const formatMoney = (amountMinor, currency = "ETB") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format((amountMinor || 0) / 100);

function StatCard({ label, value, detail, icon: Icon, tone }) {
  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value ?? "—"}</p>
        </div>
        <span className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>
          <Icon size={20} strokeWidth={1.8} />
        </span>
      </div>
      <p className="mt-3 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        {eyebrow && <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700">{eyebrow}</p>}
        <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

function GradeDistribution({ distribution = [] }) {
  const counts = new Map(distribution.map(({ gradeLevel, students }) => [gradeLevel, students]));
  const maxCount = Math.max(1, ...gradeLevels.map((grade) => counts.get(grade) || 0));
  const total = distribution.reduce((sum, row) => sum + row.students, 0);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeading
        eyebrow="Student insights"
        title="Grade-level distribution"
        description={`${total.toLocaleString()} active students by grade`}
      />
      <div className="mt-7 space-y-4" role="img" aria-label="Student count by grade level">
        {gradeLevels.map((grade, index) => {
          const count = counts.get(grade) || 0;
          const width = count ? Math.max(4, (count / maxCount) * 100) : 0;
          const colors = ["bg-sky-500", "bg-cyan-500", "bg-teal-500", "bg-emerald-500", "bg-indigo-500"];
          return (
            <div key={grade} className="grid grid-cols-[4.5rem_1fr_2.5rem] items-center gap-3">
              <span className="text-xs font-medium text-slate-600">{formatGrade(grade)}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${colors[index]}`}
                  style={{ width: `${width}%` }}
                />
              </div>
              <span className="text-right text-xs font-semibold tabular-nums text-slate-700">{count}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-6 flex items-center gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
        <GraduationCap size={15} className="text-teal-700" />
        <span>Distribution reflects approved student accounts with a grade profile.</span>
      </div>
    </section>
  );
}

function RecentTransactions({ transactions = [] }) {
  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6">
      <SectionHeading
        eyebrow="Payments"
        title="Recent transactions"
        description="The latest 5 payment attempts"
        action={
          <Link to="/admin/revenue" className="text-sm font-semibold text-teal-800 hover:text-teal-950">
            View all
          </Link>
        }
      />
      {transactions.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
          <CreditCard size={20} className="mx-auto text-slate-400" />
          <p className="mt-2 text-sm font-medium text-slate-700">No transactions yet</p>
          <p className="mt-1 text-xs text-slate-500">Recent payment activity will appear here.</p>
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {transactions.map((transaction) => {
            const paid = transaction.status === "PAID";
            const failed = transaction.status === "FAILED";
            const StatusIcon = paid ? ArrowDownLeft : failed ? CircleAlert : ArrowUpRight;
            return (
              <li key={transaction.id} className="flex items-center gap-3 py-3.5 first:pt-1">
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${paid ? "bg-emerald-50 text-emerald-700" : failed ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-700"}`}>
                  <StatusIcon size={16} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{transaction.student?.fullName || "Student payment"}</p>
                  <p className="mt-0.5 truncate text-xs text-slate-500">
                    {transaction.tutor?.user?.fullName || transaction.txRef} · {formatDate(transaction.createdAt)}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums text-slate-800">{formatMoney(transaction.amountMinor, transaction.currency)}</p>
                  <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wide ${paid ? "text-emerald-700" : failed ? "text-rose-600" : "text-amber-700"}`}>
                    {transaction.status.toLowerCase()}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TutorManagement({ tutors = [], onUpdateStatus }) {
  const [search, setSearch] = useState("");
  const [savingTutorId, setSavingTutorId] = useState(null);
  const filteredTutors = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return tutors;
    return tutors.filter((tutor) =>
      [tutor.fullName, tutor.phoneOrEmail, tutor.tutorProfile?.institutionName]
        .some((value) => value?.toLowerCase().includes(term))
    );
  }, [search, tutors]);

  const changeStatus = async (tutor) => {
    const nextStatus = tutor.status === "APPROVED" ? "SUSPENDED" : "APPROVED";
    setSavingTutorId(tutor.id);
    try {
      await onUpdateStatus(tutor.id, nextStatus);
    } catch {
      // The dashboard hook displays the request error.
    } finally {
      setSavingTutorId(null);
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <SectionHeading
          eyebrow="People"
          title="Tutor user management"
          description="Review tutor accounts and manage access from one place."
          action={
            <label className="relative block w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tutors"
                aria-label="Search tutors"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-2 focus:ring-teal-600/10"
              />
            </label>
          }
        />
      </div>
      {filteredTutors.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <Users size={22} className="mx-auto text-slate-400" />
          <p className="mt-3 text-sm font-semibold text-slate-800">{tutors.length ? "No matching tutors" : "No tutor accounts found"}</p>
          <p className="mt-1 text-sm text-slate-500">{tutors.length ? "Try a different name, email, or institution." : "Approved and pending tutor accounts will appear here."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3 font-semibold">Tutor</th>
                <th className="px-5 py-3 font-semibold">Institution</th>
                <th className="px-5 py-3 font-semibold">Joined</th>
                <th className="px-5 py-3 font-semibold">Status</th>
                <th className="px-5 py-3 text-right font-semibold">Quick action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTutors.map((tutor) => {
                const isActive = tutor.status === "APPROVED";
                const canToggle = isActive || tutor.status === "SUSPENDED";
                return (
                  <tr key={tutor.id} className="transition hover:bg-slate-50/70">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-800">
                          {tutor.fullName?.trim().charAt(0).toUpperCase() || "T"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-800">{tutor.fullName}</p>
                          <p className="truncate text-xs text-slate-500">{tutor.phoneOrEmail}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{tutor.tutorProfile?.institutionName || "—"}</td>
                    <td className="px-5 py-4 text-slate-600">{formatDate(tutor.createdAt)}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${isActive ? "bg-emerald-50 text-emerald-700" : tutor.status === "SUSPENDED" ? "bg-amber-50 text-amber-700" : tutor.status === "BANNED" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600"}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : tutor.status === "SUSPENDED" ? "bg-amber-500" : tutor.status === "BANNED" ? "bg-rose-500" : "bg-slate-400"}`} />
                        {tutor.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        disabled={!canToggle || savingTutorId === tutor.id}
                        onClick={() => changeStatus(tutor)}
                        className={`rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${isActive ? "border border-amber-200 text-amber-800 hover:bg-amber-50" : "border border-emerald-200 text-emerald-800 hover:bg-emerald-50"}`}
                      >
                        {savingTutorId === tutor.id ? "Saving..." : isActive ? "Suspend" : tutor.status === "SUSPENDED" ? "Activate" : "Unavailable"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function ReviewList({ title, description, rows, status, setStatus, statusOptions, kind, onAction, loading }) {
  const isApplications = kind === "application";

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <select
          aria-label={`Filter ${title.toLowerCase()} by status`}
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-600"
        >
          {statusOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
        </select>
      </div>
      <div className="space-y-3 p-4 sm:p-6">
        {loading ? (
          <Loader label={`Loading ${title.toLowerCase()}...`} />
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center">
            <Check size={20} className="mx-auto text-emerald-600" />
            <p className="mt-2 text-sm font-semibold text-slate-800">Nothing to review</p>
            <p className="mt-1 text-sm text-slate-500">There are no {title.toLowerCase()} in this status.</p>
          </div>
        ) : rows.map((row) => (
          <article key={row.id} className="flex flex-col gap-4 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-900">
                {isApplications ? row.applicant?.fullName || "Unknown applicant" : row.reason || "No reason provided"}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {isApplications
                  ? `${row.institutionName || "Institution not provided"} · ${row.applicant?.phoneOrEmail || "No contact"}`
                  : `Target: ${row.targetType || "Unknown"}`}
              </p>
              <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate-500">
                {isApplications ? `${row.educationLevel || "Education not provided"} · ${row.status.replaceAll("_", " ")}` : row.status.replaceAll("_", " ")}
              </p>
            </div>
            {isApplications && ["SUBMITTED", "UNDER_REVIEW"].includes(row.status) ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button onClick={() => onAction(() => row.approve(row.id))}>Approve</Button>
                <Button variant="danger" onClick={() => onAction(() => row.reject(row.id, "Did not meet criteria"))}>Reject</Button>
              </div>
            ) : !isApplications && row.status === "PENDING" ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button onClick={() => onAction(() => row.resolve(row.id, "ACTION_TAKEN"))}>Action taken</Button>
                <Button variant="secondary" onClick={() => onAction(() => row.resolve(row.id, "DISMISSED"))}>Dismiss</Button>
              </div>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export default function AdminDashboardPage() {
  const {
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
  } = useAdmin();

  const handleAction = async (action) => {
    try {
      await action();
    } catch {
      // The hook records the API error for the dashboard alert.
    }
  };

  const applicationRows = applications.map((app) => ({
    ...app,
    approve: approveApplication,
    reject: rejectApplication,
  }));
  const reportRows = reports.map((report) => ({ ...report, resolve: resolveReport }));
  const metrics = dashboard?.metrics;

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-4 py-7 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-teal-800">Administration</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitor platform activity, review payments, and manage tutor access.
            </p>
          </div>
          <Button onClick={fetchAll} disabled={isLoading}>
            <span className="inline-flex items-center gap-2"><RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />{isLoading ? "Refreshing..." : "Refresh data"}</span>
          </Button>
        </header>

        {error && <ErrorMessage message={error} />}

        <section aria-label="Platform statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Active students" value={metrics?.activeStudents?.toLocaleString()} detail="Approved student accounts" icon={UserRound} tone="bg-sky-50 text-sky-700" />
          <StatCard label="Tutors" value={metrics?.tutors?.toLocaleString()} detail="Tutor accounts on the platform" icon={Users} tone="bg-teal-50 text-teal-700" />
          <StatCard label="Tutor applications" value={metrics?.tutorApplications?.toLocaleString()} detail="Awaiting review" icon={BookOpen} tone="bg-violet-50 text-violet-700" />
          <StatCard label="Reports" value={metrics?.reports?.toLocaleString()} detail="Open reports to review" icon={ShieldCheck} tone="bg-amber-50 text-amber-700" />
        </section>

        {!dashboard && isLoading ? (
          <Loader label="Loading dashboard overview..." />
        ) : dashboard ? (
          <section className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.9fr)]">
            <GradeDistribution distribution={dashboard.gradeDistribution} />
            <RecentTransactions transactions={dashboard.recentTransactions} />
          </section>
        ) : null}

        <TutorManagement
          tutors={dashboard?.tutors}
          onUpdateStatus={updateTutorStatus}
        />

        <section className="grid gap-5 xl:grid-cols-2">
          <ReviewList
            title="Tutor applications"
            description="Review applicant accounts and application status."
            rows={applicationRows}
            status={applicationStatus}
            setStatus={setApplicationStatus}
            statusOptions={[
              { value: "SUBMITTED", label: "Submitted" },
              { value: "UNDER_REVIEW", label: "Under review" },
              { value: "APPROVED", label: "Approved" },
              { value: "REJECTED", label: "Rejected" },
            ]}
            kind="application"
            onAction={handleAction}
            loading={isLoading}
          />
          <ReviewList
            title="Report management"
            description="Review reports and record the appropriate outcome."
            rows={reportRows}
            status={reportStatus}
            setStatus={setReportStatus}
            statusOptions={[
              { value: "PENDING", label: "Pending" },
              { value: "REVIEWED", label: "Reviewed" },
              { value: "ACTION_TAKEN", label: "Action taken" },
              { value: "DISMISSED", label: "Dismissed" },
            ]}
            kind="report"
            onAction={handleAction}
            loading={isLoading}
          />
        </section>
      </div>
    </main>
  );
}
