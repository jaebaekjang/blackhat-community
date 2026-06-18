"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { COMMUNITY_NAV } from "@/lib/constants";
import { useAdminMode } from "@/hooks/useStorage";
import { cn } from "@/lib/utils";

const BOTTOM_TABS = [
  { href: "/", label: "홈", icon: "📻" },
  { href: "/submit", label: "제보", icon: "🖤" },
  { href: "/cases", label: "사건파일", icon: "🗂️" },
  { href: "/radio", label: "라디오", icon: "🌙" },
  { href: "/profile", label: "내 기록", icon: "📁" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function CommunityShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { adminMode } = useAdminMode();

  return (
    <div className="min-h-screen lg:pl-64">
      {/* ── 데스크톱 좌측 사이드바 ── */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-line bg-ink-900/80 backdrop-blur lg:flex">
        <Brand />
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {COMMUNITY_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive(pathname, item.href)
                  ? "bg-blood/15 text-blood-bright"
                  : "text-ash hover:bg-surface hover:text-zinc-100",
              )}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-line p-3">
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              adminMode
                ? "bg-surface text-blood-bright"
                : "text-ash-dim hover:bg-surface hover:text-zinc-100",
            )}
          >
            🛠️ 라디오국 관리자실
            {adminMode && (
              <span className="ml-auto h-1.5 w-1.5 rounded-full bg-blood" />
            )}
          </Link>
        </div>
      </aside>

      {/* ── 모바일 상단바 ── */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-line bg-ink-900/90 px-4 py-3 backdrop-blur lg:hidden">
        <button
          onClick={() => setDrawerOpen(true)}
          aria-label="메뉴 열기"
          className="text-xl text-ash"
        >
          ☰
        </button>
        <Link href="/" className="text-sm font-semibold tracking-wide text-zinc-100">
          🎩 검은 모자 라디오국
        </Link>
        <Link href="/admin" aria-label="관리자실" className="text-lg">
          🛠️
        </Link>
      </header>

      {/* ── 모바일 드로어 ── */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[80%] animate-fade-in border-r border-line bg-ink-900">
            <Brand onClose={() => setDrawerOpen(false)} />
            <nav className="space-y-1 px-3 py-2">
              {COMMUNITY_NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm",
                    isActive(pathname, item.href)
                      ? "bg-blood/15 text-blood-bright"
                      : "text-ash hover:bg-surface",
                  )}
                >
                  <span className="text-base">{item.icon}</span>
                  {item.label}
                </Link>
              ))}
              <Link
                href="/admin"
                onClick={() => setDrawerOpen(false)}
                className="mt-2 flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 text-sm text-ash-dim"
              >
                🛠️ 라디오국 관리자실
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* ── 본문 ── */}
      <main className="mx-auto w-full max-w-5xl px-4 pb-24 pt-5 sm:px-6 lg:pb-12">
        {children}
      </main>

      {/* ── 모바일 하단 탭바 ── */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-ink-900/95 backdrop-blur lg:hidden">
        {BOTTOM_TABS.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex flex-col items-center gap-0.5 py-2 text-[11px]",
              isActive(pathname, tab.href) ? "text-blood-bright" : "text-ash-dim",
            )}
          >
            <span className="text-lg">{tab.icon}</span>
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function Brand({ onClose }: { onClose?: () => void }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-4 py-4">
      <Link href="/" onClick={onClose} className="block">
        <div className="flex items-center gap-2 text-base font-bold tracking-wide text-zinc-100">
          🎩 검은 모자 라디오국
        </div>
        <div className="mt-0.5 text-[11px] text-ash-faint">
          심야 청취자 전용 운영센터
        </div>
      </Link>
      {onClose && (
        <button onClick={onClose} aria-label="닫기" className="text-ash-dim">
          ✕
        </button>
      )}
    </div>
  );
}
