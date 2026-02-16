"use client";

import { MobileViewportLock } from "./layout/mobile-viewport-lock";
import { ToastProvider } from "./ui/toast-provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <MobileViewportLock>
      <ToastProvider>{children}</ToastProvider>
    </MobileViewportLock>
  );
}
