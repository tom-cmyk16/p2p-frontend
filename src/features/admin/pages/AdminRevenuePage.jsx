import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { adminService } from "../services/admin.service";
import { paymentService } from "../../payments/services/payment.service";

const grades = ["GRADE_9", "GRADE_10", "GRADE_11", "GRADE_12"];
const packageLabel = {
  SINGLE_COURSE: "Single course",
  FULL_GRADE: "Full grade",
  ENTRANCE_GRADE_9_12: "Grade 9–12 entrance",
};

const formatMoney = (amountMinor, currency = "ETB") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);

const getOfferTitle = (offer) => {
  if (offer.packageType === "SINGLE_COURSE") {
    return `${offer.course?.subject?.name || "Course"} · ${offer.course?.gradeLevel?.replace("_", " ")}`;
  }
  if (offer.packageType === "FULL_GRADE") return `${offer.gradeLevel?.replace("_", " ")} Full Package`;
  return "Grade 9–12 Entrance Package";
};

function Metric({ label, amount, detail }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-bold tracking-tight text-[#013638]">{amount}</p>
      <p className="mt-1 text-xs text-slate-500">{detail}</p>
    </article>
  );
}

export default function AdminRevenuePage() {
  const [dashboard, setDashboard] = useState(null);
  const [courses, setCourses] = useState([]);
  const [packageType, setPackageType] = useState("SINGLE_COURSE");
  const [courseId, setCourseId] = useState("");
  const [gradeLevel, setGradeLevel] = useState("GRADE_9");
  const [amount, setAmount] = useState("");
  const [pricingMode, setPricingMode] = useState("STANDARD");
  const [customAmount, setCustomAmount] = useState("");
  const [offerActive, setOfferActive] = useState(true);
  const [commissionPercent, setCommissionPercent] = useState("10");
  const [payoutReferences, setPayoutReferences] = useState({});
  const [paymentPage, setPaymentPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedOfferId = packageType === "SINGLE_COURSE"
    ? `${packageType}:${courseId}`
    : packageType === "FULL_GRADE"
      ? `${packageType}:${gradeLevel}`
      : `${packageType}:all`;
  const matchingOffer = dashboard?.offers.find((offer) => offer.id === selectedOfferId);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [revenue, courseList] = await Promise.all([
        paymentService.getRevenueDashboard({ paymentPage, payoutPage, pageSize: 25 }),
        adminService.getLearningCourses(),
      ]);
      setDashboard(revenue);
      setCourses(courseList);
      setCommissionPercent(String(revenue.commissionPercent));
      setCourseId((current) => current || courseList[0]?.id || "");
    } catch (loadError) {
      setError(
        loadError.response?.data?.error?.message ||
          loadError.message ||
          "Unable to load revenue and payout data.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [paymentPage, payoutPage]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    setAmount(matchingOffer ? (matchingOffer.standardAmountMinor / 100).toFixed(2) : "");
    setPricingMode(matchingOffer?.pricingMode || "STANDARD");
    setCustomAmount(matchingOffer?.customAmountMinor != null ? (matchingOffer.customAmountMinor / 100).toFixed(2) : "");
    setOfferActive(matchingOffer?.active ?? true);
  }, [matchingOffer]);

  const saveOffer = async (event) => {
    event.preventDefault();
    if (packageType === "SINGLE_COURSE" && !courseId) {
      setError("Create a course before configuring a single-course price.");
      return;
    }
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const offer = await paymentService.saveOffer({
        packageType,
        ...(packageType === "SINGLE_COURSE" ? { courseId } : {}),
        ...(packageType === "FULL_GRADE" ? { gradeLevel } : {}),
        pricingMode,
        standardAmount: Number(amount),
        ...(pricingMode === "CUSTOM" ? { customAmount: Number(customAmount) } : {}),
        active: offerActive,
      });
      setDashboard((current) => ({
        ...current,
        offers: [
          ...current.offers.filter((item) => item.id !== offer.id),
          offer,
        ].sort((first, second) => first.packageType.localeCompare(second.packageType)),
      }));
      setSuccess("Package price saved. New checkouts will use this price.");
    } catch (saveError) {
      setError(saveError.response?.data?.error?.message || "Unable to save package price.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveCommission = async (event) => {
    event.preventDefault();
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      const result = await paymentService.saveCommission(Number(commissionPercent));
      setCommissionPercent(String(result.commissionPercent));
      setDashboard((current) => ({ ...current, commissionPercent: result.commissionPercent }));
      setSuccess("Commission rate updated. The new rate applies to future payments only.");
    } catch (saveError) {
      setError(saveError.response?.data?.error?.message || "Unable to update commission rate.");
    } finally {
      setIsSaving(false);
    }
  };

  const settlePayout = async (payout) => {
    const payoutReference = payoutReferences[payout.id]?.trim();
    if (!payoutReference) {
      setError("Enter a bank transfer or payout reference before marking this payout as paid.");
      return;
    }
    setIsSaving(true);
    setError("");
    setSuccess("");
    try {
      await paymentService.settlePayout(payout.id, payoutReference);
      setSuccess(`Tutor payout recorded as paid with reference ${payoutReference}.`);
      setPayoutReferences((current) => ({ ...current, [payout.id]: "" }));
      await refresh();
    } catch (settleError) {
      setError(settleError.response?.data?.error?.message || "Unable to settle this tutor payout.");
    } finally {
      setIsSaving(false);
    }
  };

  const summary = dashboard?.summary;

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-left sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <Link to="/admin" className="text-sm font-semibold text-[#013638] hover:underline">← Admin dashboard</Link>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">Administration</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[#013638]">Revenue and tutor payouts</h1>
            <p className="mt-2 text-sm text-slate-600">
              Monitor verified Chapa payments, set package prices, and manage tutor earnings.
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={isLoading}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-[#013638] disabled:opacity-50"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {error && <ErrorMessage message={error} />}
        {success && (
          <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            {success}
          </p>
        )}

        {summary && (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <Metric label="Verified platform sales" amount={formatMoney(summary.totalSalesMinor)} detail={`${summary.paidTransactions} successful transactions`} />
            <Metric label="Platform commission" amount={formatMoney(summary.platformCommissionMinor)} detail="Earned from verified purchases" />
            <Metric label="Tutor earnings" amount={formatMoney(summary.tutorEarningsMinor)} detail="Allocated through the commission split" />
            <Metric label="Payouts outstanding" amount={formatMoney(summary.unpaidPayoutMinor)} detail="Available to pay tutors" />
            <Metric label="Payouts recorded paid" amount={formatMoney(summary.paidPayoutMinor)} detail="Admin-marked completed transfers" />
            <Metric label="Payments pending" amount={String(summary.pendingTransactions)} detail="Awaiting Chapa verification" />
          </section>
        )}

        <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={saveOffer} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-xl font-semibold text-[#013638]">Package pricing</h2>
              <p className="mt-1 text-sm text-slate-600">Set the standard price or an offer-specific custom override in Ethiopian Birr (ETB).</p>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Package type
              <select value={packageType} onChange={(event) => setPackageType(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
                <option value="SINGLE_COURSE">Single course</option>
                <option value="FULL_GRADE">Full grade</option>
                <option value="ENTRANCE_GRADE_9_12">Grade 9–12 Entrance</option>
              </select>
            </label>
            {packageType === "SINGLE_COURSE" && (
              <label className="block text-sm font-medium text-slate-700">
                Course
                <select value={courseId} onChange={(event) => setCourseId(event.target.value)} required className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
                  <option value="">Select course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.subject.name} · {course.gradeLevel.replace("_", " ")}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {packageType === "FULL_GRADE" && (
              <label className="block text-sm font-medium text-slate-700">
                Grade
                <select value={gradeLevel} onChange={(event) => setGradeLevel(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
                  {grades.map((grade) => <option key={grade} value={grade}>{grade.replace("_", " ")}</option>)}
                </select>
              </label>
            )}
            <label className="block text-sm font-medium text-slate-700">
              Standard price (ETB)
              <input
                type="number"
                min="0.01"
                max="10000000"
                step="0.01"
                required
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Pricing mode
              <select value={pricingMode} onChange={(event) => setPricingMode(event.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5">
                <option value="STANDARD">Standard price</option>
                <option value="CUSTOM">Custom override</option>
              </select>
            </label>
            {pricingMode === "CUSTOM" && (
              <label className="block text-sm font-medium text-slate-700">
                Custom price (ETB)
                <input
                  type="number"
                  min="0.01"
                  max="10000000"
                  step="0.01"
                  required
                  value={customAmount}
                  onChange={(event) => setCustomAmount(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
                />
              </label>
            )}
            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={offerActive}
                onChange={(event) => setOfferActive(event.target.checked)}
                className="accent-[#013638]"
              />
              Available for student checkout
            </label>
            <button type="submit" disabled={isSaving || isLoading || !amount || (pricingMode === "CUSTOM" && !customAmount)} className="rounded-lg bg-[#013638] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
              {isSaving ? "Saving..." : matchingOffer ? "Update price" : "Create package price"}
            </button>
          </form>

          <form onSubmit={saveCommission} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div>
              <h2 className="text-xl font-semibold text-[#013638]">Platform commission</h2>
              <p className="mt-1 text-sm text-slate-600">
                Current rate: {dashboard ? `${dashboard.commissionPercent}%` : "Loading"}.
                Existing payments retain their original rate snapshot.
              </p>
            </div>
            <label className="block text-sm font-medium text-slate-700">
              Commission percentage
              <input
                type="number"
                min="5"
                max="10"
                step="0.01"
                required
                value={commissionPercent}
                onChange={(event) => setCommissionPercent(event.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5"
              />
            </label>
            <p className="text-xs leading-5 text-slate-500">
              Set a rate from 5% to 10%. Each verified payment is split in integer minor units, and the tutor receives the remainder.
            </p>
            <button type="submit" disabled={isSaving} className="rounded-lg border border-[#013638] px-4 py-2.5 text-sm font-semibold text-[#013638] disabled:opacity-50">
              Save commission
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-[#013638]">Configured package prices</h2>
          {dashboard?.offers.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="py-3 pr-4">Offer</th><th className="py-3 pr-4">Package</th><th className="py-3 pr-4">Price</th><th className="py-3">State</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboard.offers.map((offer) => (
                    <tr key={offer.id}>
                      <td className="py-3 pr-4 font-medium text-slate-800">{getOfferTitle(offer)}</td>
                      <td className="py-3 pr-4 text-slate-600">{packageLabel[offer.packageType]}</td>
                      <td className="py-3 pr-4 text-slate-700">{formatMoney(offer.amountMinor, offer.currency)}</td>
                      <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${offer.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{offer.active ? "Active" : "Inactive"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="mt-4 text-sm text-slate-500">No prices configured yet.</p>}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-semibold text-[#013638]">Tutor payouts</h2>
          <p className="mt-1 text-sm text-slate-600">
            Complete bank transfers outside this platform first, then record the transfer reference here. Recording a payout does not initiate a transfer.
          </p>
          {dashboard?.payouts.items.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="py-3 pr-4">Tutor</th><th className="py-3 pr-4">Student / transaction</th><th className="py-3 pr-4">Earnings</th><th className="py-3 pr-4">Created</th><th className="py-3 pr-4">Status / reference</th><th className="py-3">Action</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboard.payouts.items.map((payout) => (
                    <tr key={payout.id}>
                      <td className="py-3 pr-4 font-medium text-slate-800">{payout.tutor.user.fullName}</td>
                      <td className="py-3 pr-4 text-slate-600">{payout.payment.student.fullName}<span className="block text-xs text-slate-400">{payout.payment.txRef}</span></td>
                      <td className="py-3 pr-4 font-semibold text-slate-800">{formatMoney(payout.amountMinor, payout.currency)}</td>
                      <td className="py-3 pr-4 text-slate-600">{new Date(payout.createdAt).toLocaleDateString()}</td>
                      <td className="py-3 pr-4 text-slate-600">
                        {payout.status === "PAID"
                          ? <span>Paid · {payout.payoutReference}</span>
                          : <input
                              type="text"
                              value={payoutReferences[payout.id] || ""}
                              onChange={(event) => setPayoutReferences((current) => ({ ...current, [payout.id]: event.target.value }))}
                              placeholder="Transfer reference"
                              aria-label={`Transfer reference for ${payout.tutor.user.fullName}`}
                              className="w-44 rounded-md border border-slate-300 px-2 py-1.5 text-xs"
                            />}
                      </td>
                      <td className="py-3">
                        {payout.status === "AVAILABLE" && (
                          <button
                            type="button"
                            onClick={() => settlePayout(payout)}
                            disabled={isSaving || !payoutReferences[payout.id]?.trim()}
                            className="rounded-lg border border-[#013638] px-3 py-1.5 text-xs font-semibold text-[#013638] disabled:opacity-50"
                          >
                            Record transfer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="mt-4 text-sm text-slate-500">No tutor payouts have been generated.</p>}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">{dashboard?.payouts.total || 0} payouts · Page {dashboard?.payouts.page || payoutPage} of {Math.max(1, Math.ceil((dashboard?.payouts.total || 0) / 25))}</p>
            <div className="flex gap-2">
              <button type="button" disabled={payoutPage <= 1 || isLoading} onClick={() => setPayoutPage((page) => page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">Previous</button>
              <button type="button" disabled={payoutPage >= Math.ceil((dashboard?.payouts.total || 0) / 25) || isLoading} onClick={() => setPayoutPage((page) => page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">Next</button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-[#013638]">Transaction history</h2>
              <p className="mt-0.5 text-xs text-slate-500">Real-time payment and order ledger synced directly with Chapa gateway.</p>
            </div>
            <button
              type="button"
              onClick={refresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#013638] hover:bg-slate-50 disabled:opacity-50"
            >
              <svg className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isLoading ? "Syncing..." : "Sync Real-Time with Chapa"}</span>
            </button>
          </div>
          {dashboard?.payments.items.length ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <tr><th className="py-3 pr-4">Transaction</th><th className="py-3 pr-4">Student</th><th className="py-3 pr-4">Tutor</th><th className="py-3 pr-4">Gross</th><th className="py-3 pr-4">Commission</th><th className="py-3 pr-4">Tutor share</th><th className="py-3 pr-4">Status</th><th className="py-3">Date</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboard.payments.items.map((payment) => (
                    <tr key={payment.id}>
                      <td className="py-3 pr-4 font-medium text-slate-800">{payment.txRef}<span className="block text-xs text-slate-500">{packageLabel[payment.packageType]}</span></td>
                      <td className="py-3 pr-4 text-slate-600">{payment.student.fullName}</td>
                      <td className="py-3 pr-4 text-slate-600">{payment.tutor.user.fullName}</td>
                      <td className="py-3 pr-4 text-slate-700">{formatMoney(payment.amountMinor, payment.currency)}</td>
                      <td className="py-3 pr-4 text-slate-700">{formatMoney(payment.commissionMinor, payment.currency)} ({(payment.commissionBps / 100).toFixed(2)}%)</td>
                      <td className="py-3 pr-4 text-slate-700">{formatMoney(payment.tutorAmountMinor, payment.currency)}</td>
                      <td className="py-3 pr-4"><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${payment.status === "PAID" ? "bg-emerald-100 text-emerald-800" : payment.status === "FAILED" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>{payment.status}</span></td>
                      <td className="py-3 text-slate-600">{new Date(payment.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="mt-4 text-sm text-slate-500">No payment transactions yet.</p>}
          <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
            <p className="text-xs text-slate-500">{dashboard?.payments.total || 0} transactions · Page {dashboard?.payments.page || paymentPage} of {Math.max(1, Math.ceil((dashboard?.payments.total || 0) / 25))}</p>
            <div className="flex gap-2">
              <button type="button" disabled={paymentPage <= 1 || isLoading} onClick={() => setPaymentPage((page) => page - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">Previous</button>
              <button type="button" disabled={paymentPage >= Math.ceil((dashboard?.payments.total || 0) / 25) || isLoading} onClick={() => setPaymentPage((page) => page + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40">Next</button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
