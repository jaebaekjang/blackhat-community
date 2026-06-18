"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ADMIN_NAV } from "@/lib/constants";
import { useAdminMode } from "@/hooks/useStorage";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/EmptyState";

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { adminMode, ready, setAdminMode } = useAdminMode();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="관리자실 확인 중..." />
      </div>
    );
  }

  // 접근 제어 — blackhat_admin_mode 가 아니면 접근 제한
  if (!adminMode) {
    return <AccessDenied onEnable={() => setAdminMode(true)} />;
  }

  return (
    <div className="min-h-screen bg-ink lg:pl-60">
      {/* 사이드바 (데스크톱) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-line bg-ink-900 lg:flex">
        <AdminBrand />
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-2">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(pathname, item.href)
                  ? "bg-blood/15 text-blood-bright"
                  : "text-ash hover:bg-surface hover:text-zinc-100",
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <Link href="/" className="text-xs text-ash-dim hover:text-zinc-100">
            ← 커뮤니티로 나가기
          </Link>
        </div>
      </aside>

      {/* 상단 상태바 */}
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-line bg-ink-900/90 px-4 py-3 backdrop-blur">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="text-xl text-ash lg:hidden"
            aria-label="메뉴"
          >
            ☰
          </button>
          <div>
            <div className="text-sm font-semibold text-zinc-100">
              라디오국 관리자실
            </div>
            <div className="text-[11px] text-ash-faint">
              검은 모자 라디오국 운영센터
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-300 sm:inline-flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            관리자 모드 ON
          </span>
          <Button size="sm" variant="ghost" onClick={() => setAdminMode(false)}>
            모드 종료
          </Button>
        </div>
      </header>

      {/* 모바일 드로어 */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-64 max-w-[80%] animate-fade-in border-r border-line bg-ink-900">
            <AdminBrand onClose={() => setDrawerOpen(false)} />
            <nav className="space-y-0.5 px-2 py-2">
              {ADMIN_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm",
                    isActive(pathname, item.href)
                      ? "bg-blood/15 text-blood-bright"
                      : "text-ash hover:bg-surface",
                  )}
                >
                  <span>{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <Link
                href="/"
                onClick={() => setDrawerOpen(false)}
                className="mt-2 block rounded-lg border border-line px-3 py-2.5 text-sm text-ash-dim"
              >
                ← 커뮤니티로 나가기
              </Link>
            </nav>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">{children}</main>
    </div>
  );
}

function AdminBrand({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-bold text-zinc-100">
        🛠️ 관리자실
      </div>
      {onClose && (
        <button onClick={onClose} className="text-ash-dim" aria-label="닫기">
          ✕
        </button>
      )}
    </div>
  );
}

function AccessDenied({ onEnable }: { onEnable: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="panel max-w-md p-8 text-center">
        <div className="text-4xl">🚫</div>
        <h1 className="mt-4 text-lg font-semibold text-zinc-100">접근 제한</h1>
        <p className="mt-2 text-sm text-ash">
          이 구역은 라디오국 관리자만 접근할 수 있습니다.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={onEnable}>관리자 모드 활성화 (프로토타입)</Button>
          <Link href="/">
            <Button variant="ghost" className="w-full">
              커뮤니티로 돌아가기
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-[11px] text-ash-faint">
          실제 서비스에서는 인증/권한 검증으로 대체됩니다. (blackhat_admin_mode)
        </p>
      </div>
    </div>
  );
}
