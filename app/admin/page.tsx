"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCollection, useStorageValue } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  mockUsers,
  mockSubmissions,
  mockCases,
  mockComments,
  mockReports,
  mockYouTubeVideos,
  mockSettings,
} from "@/data";
import type {
  User,
  Submission,
  CaseFile,
  Comment,
  Report,
  YouTubeVideo,
  AdminSettings,
} from "@/types";
import { exportAllData } from "@/lib/storage";
import { downloadJson, formatDateTime, isToday, withinDays } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { Card, SectionTitle, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";

export default function AdminDashboard() {
  const { showToast } = useToast();
  const { data: users } = useCollection<User>(STORAGE_KEYS.users, mockUsers);
  const { data: submissions } = useCollection<Submission>(STORAGE_KEYS.submissions, mockSubmissions);
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);
  const { data: comments } = useCollection<Comment>(STORAGE_KEYS.comments, mockComments);
  const { data: reports } = useCollection<Report>(STORAGE_KEYS.reports, mockReports);
  const { value: videos } = useStorageValue<YouTubeVideo[]>(STORAGE_KEYS.youtubeVideos, mockYouTubeVideos);
  const { value: settings } = useStorageValue<AdminSettings>(STORAGE_KEYS.settings, mockSettings);

  const m = useMemo(() => {
    const avgFear =
      cases.length > 0
        ? Math.round(cases.reduce((s, c) => s + c.fearScore, 0) / cases.length)
        : 0;
    const catCount: Record<string, number> = {};
    cases.forEach((c) => (catCount[c.category] = (catCount[c.category] || 0) + 1));
    const topCategory =
      Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
    return {
      totalUsers: users.length,
      newUsersToday: users.filter((u) => isToday(u.createdAt)).length,
      totalSubmissions: submissions.length,
      newSubmissionsToday: submissions.filter((s) => isToday(s.createdAt)).length,
      pendingReview: submissions.filter((s) => s.status === "접수됨" || s.status === "검토 중").length,
      broadcastCandidates: cases.filter((c) => c.status === "방송 후보").length,
      broadcastDone: cases.filter((c) => c.status === "방송 완료").length,
      pendingReports: reports.filter((r) => r.status === "접수됨" || r.status === "검토 중").length,
      members: users.filter((u) => u.membershipTierId && u.membershipTierId !== "tier-free").length,
      weeklyComments: comments.filter((c) => withinDays(c.createdAt, 7)).length,
      avgFear,
      topCategory,
    };
  }, [users, submissions, cases, comments, reports]);

  // 오늘의 긴급 업무
  const urgent = useMemo(() => {
    const list: { label: string; href: string; tone: "danger" | "warning" }[] = [];
    const privacy = submissions.filter((s) => s.riskLevel === "높음").length;
    if (privacy) list.push({ label: `개인정보 포함 가능성 제보 ${privacy}건`, href: "/admin/submissions", tone: "danger" });
    const heavyReports = reports.filter((r) => r.reportCount >= 3).length;
    if (heavyReports) list.push({ label: `신고 3회 이상 게시글 ${heavyReports}건`, href: "/admin/reports", tone: "danger" });
    const candidates = submissions.filter((s) => s.broadcastWish !== "커뮤니티에만 올릴게요" && s.status === "검토 중").length;
    if (candidates) list.push({ label: `방송 후보로 올릴 만한 제보 ${candidates}건`, href: "/admin/content-pipeline", tone: "warning" });
    const villa = cases.filter((c) => c.status === "칠죄빌라 연결 의심").length;
    if (villa) list.push({ label: `칠죄빌라 연결 의심 사건 ${villa}건`, href: "/admin/forbidden-zone", tone: "warning" });
    return list;
  }, [submissions, reports, cases]);

  const handleExport = () => {
    downloadJson(`blackhat-export-${Date.now()}.json`, exportAllData());
    showToast("전체 데이터를 Export 했습니다.", "success");
  };

  return (
    <div>
      <AdminPageHeader
        title="대시보드"
        description="검은 모자 라디오국 운영 현황"
        actions={
          <Button size="sm" variant="secondary" onClick={handleExport}>
            ⬇ 데이터 Export
          </Button>
        }
      />

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="전체 회원 수" value={m.totalUsers} sub={`오늘 신규 +${m.newUsersToday}`} />
        <StatCard label="전체 제보 수" value={m.totalSubmissions} sub={`오늘 신규 +${m.newSubmissionsToday}`} />
        <StatCard label="검토 대기 제보" value={m.pendingReview} accent={m.pendingReview > 0} />
        <StatCard label="신고 대기" value={m.pendingReports} accent={m.pendingReports > 0} />
        <StatCard label="방송 후보 사건" value={m.broadcastCandidates} />
        <StatCard label="방송 완료 사건" value={m.broadcastDone} />
        <StatCard label="멤버십 가입자" value={m.members} />
        <StatCard label="이번 주 댓글 수" value={m.weeklyComments} />
        <StatCard label="평균 공포지수" value={m.avgFear} />
        <StatCard label="인기 카테고리" value={<span className="text-base">{m.topCategory}</span>} />
      </div>

      {/* YouTube 연동 상태 */}
      <div className="mt-6">
        <SectionTitle title="YouTube 연동 상태" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <StatCard label="최근 불러온 영상 수" value={videos.length} />
          <StatCard
            label="마지막 동기화"
            value={
              <span className="text-base">
                {settings.youtubeLastSyncedAt ? formatDateTime(settings.youtubeLastSyncedAt) : "미동기화"}
              </span>
            }
          />
          <div className="panel p-4">
            <div className="text-xs text-ash-dim">영상 연동 상태</div>
            <div className="mt-2">
              <Badge variant={videos.length > 0 ? "success" : "warning"} dot>
                {videos.length > 0 ? "정상" : "대기"}
              </Badge>
            </div>
            <div className="mt-2 line-clamp-1 text-xs text-ash-faint">
              최신: {videos[0]?.title ?? "-"}
            </div>
          </div>
        </div>
      </div>

      {/* 오늘의 긴급 업무 */}
      <div className="mt-6">
        <SectionTitle title="오늘의 긴급 업무" subtitle="우선 처리가 필요한 항목" />
        {urgent.length === 0 ? (
          <Card>
            <p className="text-sm text-ash-dim">긴급 업무가 없습니다. 평온한 밤입니다.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {urgent.map((u, i) => (
              <Link key={i} href={u.href}>
                <Card hover className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant={u.tone} dot>
                      {u.tone === "danger" ? "긴급" : "확인"}
                    </Badge>
                    <span className="text-sm text-ash">{u.label}</span>
                  </div>
                  <span className="text-ash-dim">→</span>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* 최근 제보 미리보기 */}
      <div className="mt-6">
        <SectionTitle
          title="최근 제보"
          action={
            <Link href="/admin/submissions">
              <Button size="sm" variant="ghost">전체 보기 →</Button>
            </Link>
          }
        />
        <div className="space-y-2">
          {submissions.slice(0, 5).map((s) => (
            <Card key={s.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="truncate text-sm text-zinc-100">{s.title}</div>
                <div className="text-xs text-ash-faint">{s.category} · {s.authorName}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {s.riskLevel === "높음" && <Badge variant="danger">개인정보 위험</Badge>}
                <StatusBadge status={s.status} />
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* 빠른 작업 */}
      <div className="mt-6">
        <SectionTitle title="빠른 작업" />
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/notices"><Button size="sm" variant="secondary">새 공지 작성</Button></Link>
          <Link href="/admin/cases"><Button size="sm" variant="secondary">방송 후보 보기</Button></Link>
          <Link href="/admin/submissions"><Button size="sm" variant="secondary">검토 대기 제보 보기</Button></Link>
          <Link href="/admin/radio"><Button size="sm" variant="secondary">오늘 방송 대기방 열기</Button></Link>
          <Link href="/admin/forbidden-zone"><Button size="sm" variant="secondary">금지구역 파일 추가</Button></Link>
          <Button size="sm" variant="secondary" onClick={handleExport}>데이터 Export</Button>
        </div>
      </div>
    </div>
  );
}
