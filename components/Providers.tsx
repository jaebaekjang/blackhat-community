"use client";

import { useEffect } from "react";
import { ToastProvider } from "@/components/ui/Toast";
import { initializeMockData } from "@/lib/storage";

export function Providers({ children }: { children: React.ReactNode }) {
  // 앱 진입 시 mock 데이터를 1회 시드 (빈 화면 방지)
  useEffect(() => {
    initializeMockData();
  }, []);

  return <ToastProvider>{children}</ToastProvider>;
}
