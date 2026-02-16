"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Toast } from "./toast";

type ToastVariant = "success" | "error" | "info";

interface ToastState {
  variant: ToastVariant;
  message: string;
  visible: boolean;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue>({
  showToast: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState>({
    variant: "info",
    message: "",
    visible: false,
  });

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    setToast({ variant, message, visible: true });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 4000);
  }, []);

  const contextValue = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext value={contextValue}>
      {children}
      {typeof document !== "undefined" &&
        createPortal(
          <Toast
            variant={toast.variant}
            message={toast.message}
            visible={toast.visible}
          />,
          document.body,
        )}
    </ToastContext>
  );
}
