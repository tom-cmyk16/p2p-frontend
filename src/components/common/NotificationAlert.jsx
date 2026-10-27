import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

export default function NotificationAlert({
  message,
  children,
  type = "error",
  duration = 5000,
  onDismiss,
  className = "",
}) {
  const content = message || children;
  const [visible, setVisible] = useState(Boolean(content));

  useEffect(() => {
    if (!content) {
      setVisible(false);
      return;
    }

    setVisible(true);

    if (duration && duration > 0) {
      const timer = setTimeout(() => {
        setVisible(false);
        if (onDismiss) onDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [content, duration, onDismiss]);

  const handleClose = () => {
    setVisible(false);
    if (onDismiss) onDismiss();
  };

  if (!visible || !content) return null;

  const typeConfig = {
    error: {
      container: "border-rose-200 bg-rose-50/95 text-rose-900",
      icon: <AlertCircle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />,
      closeBtn: "text-rose-500 hover:text-rose-800 hover:bg-rose-100",
      role: "alert",
    },
    success: {
      container: "border-emerald-200 bg-emerald-50/95 text-emerald-900",
      icon: <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />,
      closeBtn: "text-emerald-500 hover:text-emerald-800 hover:bg-emerald-100",
      role: "status",
    },
    warning: {
      container: "border-amber-200 bg-amber-50/95 text-amber-900",
      icon: <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 mt-0.5" />,
      closeBtn: "text-amber-500 hover:text-amber-800 hover:bg-amber-100",
      role: "alert",
    },
    info: {
      container: "border-teal-200 bg-teal-50/95 text-teal-900",
      icon: <Info className="h-5 w-5 shrink-0 text-teal-600 mt-0.5" />,
      closeBtn: "text-teal-500 hover:text-teal-800 hover:bg-teal-100",
      role: "status",
    },
  };

  const config = typeConfig[type] || typeConfig.error;

  return (
    <div
      role={config.role}
      className={`flex items-start justify-between gap-3 rounded-2xl border p-4 text-xs sm:text-sm shadow-xs transition-all duration-200 animate-in fade-in duration-200 ${config.container} ${className}`}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {config.icon}
        <div className="font-medium leading-relaxed break-words">{content}</div>
      </div>
      <button
        type="button"
        onClick={handleClose}
        aria-label="Dismiss message"
        className={`shrink-0 rounded-lg p-1 transition-colors ${config.closeBtn} cursor-pointer`}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
