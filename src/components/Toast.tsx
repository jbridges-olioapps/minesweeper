/**
 * @fileoverview Toast notification component using DaisyUI styling.
 * Displays temporary alert messages in a fixed position.
 */

import { motion, AnimatePresence } from "framer-motion";
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
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`alert ${getAlertClass(toast.type)} shadow-lg`}
            initial={{ opacity: 0, x: 100, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            layout
          >
            <span>{toast.message}</span>
            <motion.button
              className="btn btn-sm btn-circle btn-ghost"
              onClick={() => onRemove(toast.id)}
              aria-label="Close notification"
              whileHover={{ scale: 1.2, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
            >
              ✕
            </motion.button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
