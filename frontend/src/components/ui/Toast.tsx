import React from "react";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  description?: string;
}

export interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map((t) => {
        let borderColor = "border-secondary/40";
        let icon = "check_circle";
        let iconColor = "text-secondary";

        if (t.type === "error") {
          borderColor = "border-error/40";
          icon = "error";
          iconColor = "text-error";
        } else if (t.type === "warning") {
          borderColor = "border-tertiary/40";
          icon = "warning";
          iconColor = "text-tertiary";
        } else if (t.type === "info") {
          borderColor = "border-primary/40";
          icon = "info";
          iconColor = "text-primary";
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-space-sm p-space-sm rounded-lg bg-surface-container-high/95 backdrop-blur border ${borderColor} shadow-xl animate-fade-in`}
          >
            <span className={`material-symbols-outlined text-[20px] mt-0.5 ${iconColor}`}>
              {icon}
            </span>
            <div className="flex-1 min-w-0">
              <div className="font-headline-sm text-[13px] font-semibold text-on-surface">
                {t.title}
              </div>
              {t.description && (
                <div className="font-body-sm text-[11px] text-outline mt-0.5">
                  {t.description}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(t.id)}
              className="text-outline hover:text-on-surface p-1 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;

