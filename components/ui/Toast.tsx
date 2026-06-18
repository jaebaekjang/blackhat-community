"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const showToast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex w-full max-w-sm animate-fade-in items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-card backdrop-blur",
              t.type === "success" &&
                "border-emerald-500/40 bg-emerald-950/80 text-emerald-200",
              t.type === "error" && "border-blood/50 bg-ink-800/90 text-blood-bright",
              t.type === "info" && "border-line bg-surface/90 text-zinc-100",
            )}
          >
            <span>
              {t.type === "success" ? "✔" : t.type === "error" ? "⚠" : "•"}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // 프로바이더 밖에서 호출되면 콘솔로 폴백 (앱 크래시 방지)
    return { showToast: (m) => console.log("[toast]", m) };
  }
  return ctx;
}
