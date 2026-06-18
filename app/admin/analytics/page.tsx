"use client";

import { useMemo } from "react";
import { useCollection, useStorageValue } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  mockSubmissions,
  mockCases,
  mockComments,
  mockUsers,
  mockReports,
  mockYouTubeVideos,
} from "@/data";
import type {
  Submission,
  CaseFile,
  Comment,
  User,
  Report,
  YouTubeVideo,
} from "@/types";
import { formatDate } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { Card, SectionTitle, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

/** 단순 수평 막대 (차트 라이브러리 미사용) */
function Bar({
  label,
  value,
  max,
  suffix,
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 shrink-0 truncate text-xs text-ash-dim" title={label}>
        {label}
      </span>
      <div className="h-3 flex-1 overflow-hidden rounded-full bg-ink-700">
        <div
          className="h-full rounded-full bg-blood transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs tabular-nums text-ash">
        {value}
        {suffix}
      </span>
    </div>
  );
}

export default function AnalyticsAdminPage() {
  const { data: submissions } = useCollection<Submission>(STORAGE_KEYS.submissions, mockSubmissions);
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);
  const { data: comments } = useCollection<Comment>(STORAGE_KEYS.comments, mockComments);
  const { data: users } = useCollection<User>(STORAGE_KEYS.users, mockUsers);
  const { data: reports } = useCollection<Report>(STORAGE_KEYS.reports, mockReports);
  const { value: videos } = useStorageValue<YouTubeVideo[]>(STORAGE_KEYS.youtubeVideos, mockYouTubeVideos);

  const caseTitle = useMemo(() => {
    const map: Record<string, string> = {};
    cases.forEach((c) => (map[c.id] = c.title));
    return map;
  }, [cases]);

  // 일별 제보 수 (최근 7개 날짜)
  const dailySubmissions = useMemo(() => {
    const map: Record<string, number> = {};
    submissions.forEach((s) => {
      const day = s.createdAt.slice(0, 10);
      map[day] = (map[day] || 0) + 1;
    });
    return Object.entries(map)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 7)
      .reverse();
  }, [submissions]);

  // 카테고리별 제보 수
  const categoryCounts = useMemo(() => {
    const map: Record<string, number> = {};
    submissions.forEach((s) => (map[s.category] = (map[s.category] || 0) + 1));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [submissions]);

  // 공포지수 평균
  const avgFear = useMemo(() => {
    if (cases.length === 0) return 0;
    return Math.round(cases.reduce((s, c) => s + c.fearScore, 0) / cases.length);
  }, [cases]);

  // 댓글 많은 사건 top 3
  const topCommented = useMemo(() => {
    const map: Record<string, number> = {};
    comments.forEach((c) => (map[c.caseFileId] = (map[c.caseFileId] || 0) + 1));
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([id, count]) => ({ title: caseTitle[id] ?? id, count }));
  }, [comments, caseTitle]);

  // 방송 요청 많은 사건 top 3
  const topBroadcast = useMemo(() => {
    return [...cases]
      .sort((a, b) => b.broadcastRequestCount - a.broadcastRequestCount)
      .slice(0, 3);
  }, [cases]);

  // 멤버십 전환율 mock (유료 회원 / 전체 유저)
  const membershipRate = useMemo(() => {
    if (users.length === 0) return "0.0%";
    const paying = users.filter(
      (u) => u.membershipTierId && u.membershipTierId !== "tier-free",
    ).length;
    return `${((paying / users.length) * 100).toFixed(1)}%`;
  }, [users]);

  // 인기 지역 / 인기 장소 유형
  const topRegion = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => (map[c.region] = (map[c.region] || 0) + 1));
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  }, [cases]);

  const topLocationType = useMemo(() => {
    const map: Record<string, number> = {};
    cases.forEach((c) => (map[c.locationType] = (map[c.locationType] || 0) + 1));
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  }, [cases]);

  // 유저 등급 분포
  const gradeCounts = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach((u) => (map[u.grade] = (map[u.grade] || 0) + 1));
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [users]);

  // 가장 많이 저장된 사건
  const topSaved = useMemo(() => {
    return [...cases].sort((a, b) => b.saveCount - a.saveCount)[0] ?? null;
  }, [cases]);

  // 가장 많이 신고된 유형
  const topReportReason = useMemo(() => {
    const map: Record<string, number> = {};
    reports.forEach((r) => (map[r.reason] = (map[r.reason] || 0) + 1));
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";
  }, [reports]);

  const maxDaily = Math.max(1, ...dailySubmissions.map(([, v]) => v));
  const maxCategory = Math.max(1, ...categoryCounts.map(([, v]) => v));
  const maxGrade = Math.max(1, ...gradeCounts.map(([, v]) => v));

  return (
    <div>
      <AdminPageHeader title="통계 분석" description="제보, 사건, 유저, 콘텐츠 지표를 한눈에 확인합니다." />

      {/* 핵심 지표 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard label="공포지수 평균" value={avgFear} accent />
        <StatCard label="멤버십 전환율" value={membershipRate} sub="mock" />
        <StatCard label="재방문율" value="68.4%" sub="mock" />
        <StatCard label="인기 지역" value={<span className="text-base">{topRegion}</span>} />
        <StatCard label="인기 장소 유형" value={<span className="text-base">{topLocationType}</span>} />
        <StatCard label="가장 많이 신고된 유형" value={<span className="text-base">{topReportReason}</span>} />
        <StatCard
          label="가장 많이 저장된 사건"
          value={<span className="text-base">{topSaved?.title ?? "-"}</span>}
          sub={topSaved ? `${topSaved.saveCount}회 저장` : undefined}
        />
        <StatCard
          label="YouTube 연동 영상"
          value={videos.length}
          sub={videos[0]?.title ? `최신: ${videos[0].title}` : "미동기화"}
        />
      </div>

      {/* 일별 제보 수 */}
      <div className="mt-6">
        <SectionTitle title="일별 제보 수" subtitle="최근 제보 추이" />
        <Card>
          {dailySubmissions.length === 0 ? (
            <p className="text-sm text-ash-dim">제보 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {dailySubmissions.map(([day, count]) => (
                <Bar key={day} label={formatDate(day)} value={count} max={maxDaily} suffix="건" />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 카테고리별 제보 수 */}
      <div className="mt-6">
        <SectionTitle title="카테고리별 제보 수" subtitle="어떤 괴담이 많이 제보되는가" />
        <Card>
          {categoryCounts.length === 0 ? (
            <p className="text-sm text-ash-dim">제보 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {categoryCounts.map(([cat, count]) => (
                <Bar key={cat} label={cat} value={count} max={maxCategory} suffix="건" />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 유저 등급 분포 */}
      <div className="mt-6">
        <SectionTitle title="유저 등급 분포" subtitle="청취자 등급별 인원" />
        <Card>
          {gradeCounts.length === 0 ? (
            <p className="text-sm text-ash-dim">유저 데이터가 없습니다.</p>
          ) : (
            <div className="space-y-2">
              {gradeCounts.map(([grade, count]) => (
                <Bar key={grade} label={grade} value={count} max={maxGrade} suffix="명" />
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* 인기 사건 (댓글 / 방송 요청) */}
      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <SectionTitle title="댓글 많은 사건 TOP 3" subtitle="해석 참여가 활발한 사건" />
          {topCommented.length === 0 ? (
            <p className="text-sm text-ash-dim">댓글 데이터가 없습니다.</p>
          ) : (
            <ol className="space-y-2">
              {topCommented.map((c, i) => (
                <li key={c.title} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-blood-bright">{i + 1}</span>
                    <span className="truncate text-ash">{c.title}</span>
                  </span>
                  <Badge variant="neutral">댓글 {c.count}</Badge>
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card>
          <SectionTitle title="방송 요청 많은 사건 TOP 3" subtitle="청취자가 듣고 싶어하는 사건" />
          {topBroadcast.length === 0 ? (
            <p className="text-sm text-ash-dim">사건 데이터가 없습니다.</p>
          ) : (
            <ol className="space-y-2">
              {topBroadcast.map((c, i) => (
                <li key={c.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="text-blood-bright">{i + 1}</span>
                    <span className="truncate text-ash">{c.title}</span>
                  </span>
                  <Badge variant="broadcast">요청 {c.broadcastRequestCount}</Badge>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      {/* 콘텐츠 인사이트 */}
      <div className="mt-6">
        <SectionTitle title="콘텐츠 인사이트" subtitle="검은 모자 라디오국 운영 참고" />
        <Card>
          <ul className="space-y-2 text-sm text-ash">
            <li className="flex items-start gap-2">
              <span className="text-blood-bright">▸</span>
              이번 주에는 아파트 괴담 제보가 가장 많습니다.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blood-bright">▸</span>
              공포지수 평균이 가장 높은 카테고리는 나폴리탄입니다.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blood-bright">▸</span>
              방송 요청이 많은 사건은 현실감 점수가 높은 경향이 있습니다.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blood-bright">▸</span>
              칠죄빌라 관련 게시글은 댓글 해석 참여율이 높습니다.
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
