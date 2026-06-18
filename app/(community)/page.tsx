"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCollection } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import {
  mockCases,
  mockComments,
  mockRadioRooms,
  mockNotices,
} from "@/data";
import type { CaseFile, Comment, RadioRoom, Notice } from "@/types";
import { CaseCard } from "@/components/community/CaseCard";
import { YouTubeSection } from "@/components/community/YouTubeSection";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatDateTime } from "@/lib/utils";

export default function HomePage() {
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);
  const { data: comments } = useCollection<Comment>(STORAGE_KEYS.comments, mockComments);
  const { data: rooms } = useCollection<RadioRoom>(STORAGE_KEYS.radioRooms, mockRadioRooms);
  const { data: notices } = useCollection<Notice>(STORAGE_KEYS.notices, mockNotices);

  const commentCount = useMemo(() => {
    const map: Record<string, number> = {};
    comments.forEach((c) => (map[c.caseFileId] = (map[c.caseFileId] || 0) + 1));
    return map;
  }, [comments]);

  const popularCases = useMemo(
    () =>
      [...cases]
        .filter((c) => c.isPublic)
        .sort((a, b) => b.fearScore - a.fearScore)
        .slice(0, 5),
    [cases],
  );

  const adoptedCases = useMemo(
    () =>
      cases
        .filter((c) => c.status === "방송 후보" || c.status === "방송 완료")
        .slice(0, 4),
    [cases],
  );

  const waitingRooms = useMemo(
    () => rooms.filter((r) => r.status !== "방송 완료").slice(0, 3),
    [rooms],
  );

  const pinnedNotices = useMemo(
    () => [...notices].sort((a, b) => Number(b.isPinned) - Number(a.isPinned)).slice(0, 3),
    [notices],
  );

  return (
    <div className="space-y-10">
      {/* 히어로 */}
      <section className="panel relative overflow-hidden p-6 sm:p-8">
        <div className="absolute -right-10 -top-10 text-[120px] opacity-[0.06] animate-flicker">
          🎩
        </div>
        <p className="text-xs uppercase tracking-[0.3em] text-blood">
          오늘의 심야 기록
        </p>
        <h1 className="mt-3 max-w-2xl text-2xl font-bold leading-snug text-zinc-100 sm:text-3xl">
          검은 모자 라디오국에 접속되었습니다.
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ash sm:text-base">
          이곳은 검은 모자가 읽은 사건, 아직 방송되지 않은 제보, 그리고 청취자들이
          남긴 해석이 모이는 곳입니다.
        </p>
        <p className="mt-4 text-sm italic text-blood-bright">
          “당신은 지금부터 단순한 시청자가 아닙니다. 심야 청취자입니다.”
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/submit">
            <Button variant="primary">🖤 검은 제보함 열기</Button>
          </Link>
          <Link href="/cases">
            <Button variant="secondary">오늘의 사건 보기</Button>
          </Link>
          <Link href="/membership">
            <Button variant="ghost">🏚️ 칠죄빌라 입주하기</Button>
          </Link>
        </div>
      </section>

      {/* 검은 모자의 최신 영상 */}
      <YouTubeSection />

      {/* 오늘의 방송 대기 */}
      <section>
        <SectionTitle
          title="오늘의 방송 대기"
          subtitle="심야라디오 대기방 / 해석방"
          action={
            <Link href="/radio">
              <Button size="sm" variant="ghost">
                전체 보기 →
              </Button>
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {waitingRooms.map((room) => (
            <Card key={room.id}>
              <div className="flex items-center justify-between">
                <StatusBadge status={room.status} dot />
                <span className="text-xs text-ash-dim">👥 {room.participantCount}</span>
              </div>
              <h3 className="mt-2 line-clamp-2 font-medium text-zinc-100">
                {room.title}
              </h3>
              <p className="mt-1 text-xs text-ash-dim">
                {formatDateTime(room.scheduledAt)}
              </p>
              <Link href="/radio" className="mt-3 block">
                <Button size="sm" variant="secondary" className="w-full">
                  대기방 입장
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      </section>

      {/* 실시간 인기 사건 */}
      <section>
        <SectionTitle
          title="실시간 인기 사건"
          subtitle="공포지수가 높은 오늘의 위험 파일"
          action={
            <Link href="/cases">
              <Button size="sm" variant="ghost">
                전체 보기 →
              </Button>
            </Link>
          }
        />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {popularCases.map((c) => (
            <CaseCard key={c.id} caseFile={c} commentCount={commentCount[c.id] || 0} />
          ))}
        </div>
      </section>

      {/* 이번 주 채택 제보 */}
      <section>
        <SectionTitle title="이번 주 채택 제보" subtitle="방송 후보 및 방송 완료 사건" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {adoptedCases.map((c) => (
            <CaseCard
              key={c.id}
              caseFile={c}
              commentCount={commentCount[c.id] || 0}
              compact
            />
          ))}
        </div>
      </section>

      {/* 검은 모자의 전달사항 */}
      <section>
        <SectionTitle title="검은 모자의 전달사항" subtitle="라디오국 공지" />
        <div className="space-y-3">
          {pinnedNotices.map((n) => (
            <Card key={n.id}>
              <div className="flex items-center gap-2">
                {n.isPinned && <Badge variant="danger">📌 고정</Badge>}
                <Badge variant="neutral">{n.type}</Badge>
                <h3 className="font-medium text-zinc-100">{n.title}</h3>
              </div>
              <p className="mt-2 line-clamp-2 text-sm text-ash">{n.content}</p>
            </Card>
          ))}
        </div>
      </section>

      <PrivacyFooter />
    </div>
  );
}

function PrivacyFooter() {
  return (
    <footer className="panel border-blood/20 bg-blood/5 p-4 text-xs leading-relaxed text-ash-dim">
      ⚠️ 개인정보 보호 안내 — 실명, 정확한 주소, 전화번호, 학교명, 회사명 등 특정
      가능한 개인정보는 작성하지 마세요. 검은 모자 라디오국은 제보자의 익명성과 타인의
      권리를 보호하기 위해 일부 내용을 비공개 또는 수정할 수 있습니다.
    </footer>
  );
}
