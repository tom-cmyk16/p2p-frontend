import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import ErrorMessage from "../../../components/common/ErrorMessage";
import { paymentService } from "../services/payment.service";

const formatMoney = (amountMinor, currency = "ETB") =>
  new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amountMinor / 100);

export default function PaymentResultPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get("tx_ref");
  const [payment, setPayment] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [isPaused, setIsPaused] = useState(false);

  const verify = useCallback(async () => {
    if (!txRef) {
      setError("The payment return did not include a transaction reference.");
      setIsChecking(false);
      return null;
    }
    setIsChecking(true);
    setError(null);
    try {
      const result = await paymentService.verifyPayment(txRef);
      setPayment(result);
      return result;
    } catch (verifyError) {
      setError(
        verifyError.response?.data?.error?.message ||
          "Unable to verify payment with Chapa. Retry in a moment.",
      );
      return null;
    } finally {
      setIsChecking(false);
    }
  }, [txRef]);

  useEffect(() => {
    verify();
  }, [verify]);

  useEffect(() => {
    if (payment?.status !== "PENDING") return undefined;
    let attempts = 0;
    const interval = window.setInterval(async () => {
      attempts += 1;
      const updated = await verify();
      if (updated?.status !== "PENDING" || attempts >= 6) window.clearInterval(interval);
    }, 5000);
    return () => window.clearInterval(interval);
  }, [payment?.status, verify]);

  // Automatic redirect to quizzes workspace once verified as PAID
  useEffect(() => {
    if (payment?.status !== "PAID" || isPaused) return undefined;
    if (countdown <= 0) {
      navigate("/student/quizzes", {
        replace: true,
        state: { paymentSuccess: true, packageType: payment.packageType },
      });
      return undefined;
    }
    const timer = window.setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [payment?.status, payment?.packageType, countdown, isPaused, navigate]);

  return (
    <main className="min-h-[70vh] bg-slate-50/50 px-4 py-12 text-left sm:px-6">
      <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#013638]">Chapa Checkout</p>
          {payment?.status === "PAID" && (
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              Verified & Active
            </span>
          )}
        </div>

        <h1 className="mt-2 text-2xl font-bold text-[#013638]">Payment Confirmation</h1>

        {isChecking && (
          <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 p-4 border border-slate-200 text-sm text-slate-600">
            <svg className="h-5 w-5 animate-spin text-[#013638]" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
            </svg>
            <span>Verifying transaction status with Chapa and unlocking courses...</span>
          </div>
        )}

        {error && <div className="mt-5"><ErrorMessage message={error} /></div>}

        {payment?.status === "PAID" && (
          <div className="mt-6 space-y-4">
            <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-bold">
                  ✓
                </div>
                <div>
                  <p className="font-bold text-emerald-900 text-base">Payment Successful! Course Unlocked.</p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Your {payment.packageType.replaceAll("_", " ")} access is now active. All corresponding quizzes, exams, and mentorship sessions have been automatically unlocked.
                  </p>
                  <p className="mt-2 text-xs font-medium text-emerald-800">
                    Amount Paid: <span className="font-bold">{formatMoney(payment.amountMinor, payment.currency)}</span> · Ref: {payment.txRef}
                  </p>
                </div>
              </div>
            </div>

            {/* Countdown Banner */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-[#013638]/5 to-emerald-50/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-[#013638]">
                  {isPaused
                    ? "Automatic redirection paused."
                    : `Redirecting to your Quiz workspace in ${countdown}s...`}
                </p>
                <p className="text-xs text-slate-500">Jump right into your interactive tests and learning material.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaused((prev) => !prev)}
                  className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {isPaused ? "Resume Redirect" : "Stay Here"}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    navigate("/student/quizzes", {
                      replace: true,
                      state: { paymentSuccess: true, packageType: payment.packageType },
                    })
                  }
                  className="rounded-lg bg-[#013638] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#024a4c]"
                >
                  Start Now →
                </button>
              </div>
            </div>
          </div>
        )}

        {payment?.status === "PENDING" && (
          <div role="status" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <p className="font-semibold">Processing with Chapa...</p>
            <p className="mt-1 text-xs text-amber-700">
              Chapa has not finalized the transaction confirmation yet. This page is syncing automatically every few seconds.
            </p>
          </div>
        )}

        {payment?.status === "FAILED" && (
          <div role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
            <p className="font-semibold">Payment Failed or Cancelled</p>
            <p className="mt-1 text-xs text-red-700">
              The transaction was not completed. No charges were captured, and course access has not been activated.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3 border-t border-slate-100 pt-5">
          {payment?.status === "PAID" && (
            <Link
              to="/student/quizzes"
              state={{ paymentSuccess: true, packageType: payment?.packageType }}
              className="rounded-lg bg-[#013638] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#024a4c]"
            >
              Go to Quizzes & Exams
            </Link>
          )}

          {payment?.status !== "PAID" && (
            <button
              type="button"
              onClick={verify}
              disabled={isChecking}
              className="rounded-lg bg-[#013638] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            >
              Verify Status Again
            </button>
          )}

          <Link
            to="/student/packages"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#013638] hover:bg-slate-50"
          >
            Package Subscriptions
          </Link>
          <Link
            to="/student"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#013638] hover:bg-slate-50"
          >
            Dashboard
          </Link>
        </div>
      </section>
    </main>
  );
}
