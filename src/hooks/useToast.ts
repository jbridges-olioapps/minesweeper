/**
 * @fileoverview Simple toast notification hook using DaisyUI styling.
 * Provides temporary notification messages to the user.
 */

import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
}

/**
 * Hook for managing toast notifications.
 *
 * @returns Object with toasts array and showToast function
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: Toast["type"] = "info", duration = 3000) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: Toast = { id, message, type };

      setToasts((prev) => [...prev, newToast]);

      // Auto-remove after duration
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, duration);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, showToast, removeToast };
}
