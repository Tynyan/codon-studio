import { useCallback, useEffect, useRef, useState } from "react";

export interface ToastState {
  id: number;
  message: string;
  detail?: string;
  tone: "default" | "success" | "warning";
}

export function useToast() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    setToast(null);
  }, []);

  const showToast = useCallback(
    (message: string, options: { detail?: string; tone?: ToastState["tone"] } = {}) => {
      if (timer.current !== null) window.clearTimeout(timer.current);
      setToast({
        id: Date.now(),
        message,
        detail: options.detail,
        tone: options.tone ?? "default",
      });
      timer.current = window.setTimeout(() => setToast(null), 3200);
    },
    [],
  );

  useEffect(() => () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
  }, []);

  return { toast, showToast, dismiss };
}
