import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useReport } from "../hooks/useReport";
import Button from "../../../components/common/Button";
import ErrorMessage from "../../../components/common/ErrorMessage";

// Expects /report?targetType=MESSAGE&targetId=xyz
export default function ReportPage() {
  const [searchParams] = useSearchParams();
  const targetType = searchParams.get("targetType") || "Content";
  const targetId = searchParams.get("targetId") || "";
  
  const [reason, setReason] = useState("");
  const { submitReport, isLoading, error, submitted } = useReport();

  // ሪ (Success View)
  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold shadow-inner">
            ✓
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Report Submitted</h1>
          <p className="text-sm text-slate-500">
            Thank you. An admin will review this {targetType.toLowerCase()} shortly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
        
        {/* የርዕስ ክፍል */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 text-xl font-bold">
            🚨
          </div>
          <h1 className="text-xl font-bold text-slate-900">Report {targetType}</h1>
          <p className="text-xs text-slate-500">
            Help us keep the P2P platform safe and professional.
          </p>
        </div>

        <ErrorMessage message={error} />

        <div className="space-y-4">
          {/*  (Reason Textarea) */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Reason for Report
            </label>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 outline-none focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
              rows="5"
              placeholder="Please describe why you are reporting this content (e.g., spam, inappropriate language, harassment)..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>

          {/* (Submit Button) */}
          <div className="pt-2">
            <Button 
              onClick={() => submitReport(targetType, targetId, reason)} 
              disabled={isLoading || !reason.trim()}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm shadow-sm transition-all disabled:opacity-50"
            >
              {isLoading ? "Submitting Report..." : "Submit Report"}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
}