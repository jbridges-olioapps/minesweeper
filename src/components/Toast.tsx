/**
 * @fileoverview Toast notification component using DaisyUI styling.
 * Displays temporary alert messages in a fixed position.
 */

import type { Toast as ToastType } from "../hooks/useToast";

interface ToastProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

/**
 * Toast container component - Displays multiple toast notifications.
 *
 * Uses DaisyUI alert styling with fixed positioning.
 * Toasts appear at the top-right of the screen and auto-dismiss.
 */
export function Toast({ toasts, onRemove }: ToastProps) {
  if (toasts.length === 0) return null;

  const getAlertClass = (type: ToastType["type"]) => {
    switch (type) {
      case "success":
        return "alert-success";
      case "warning":
        return "alert-warning";
      case "error":
        return "alert-error";
      case "info":
      default:
        return "alert-info";
    }
  };

  return (
    <div className="toast toast-top toast-end z-50">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`alert ${getAlertClass(toast.type)} shadow-lg`}
        >
          <span>{toast.message}</span>
          <button
            className="btn btn-sm btn-circle btn-ghost"
            onClick={() => onRemove(toast.id)}
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
