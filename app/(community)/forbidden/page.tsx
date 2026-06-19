"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCollection } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockForbiddenZoneItems } from "@/data";
import type { ForbiddenZoneItem } from "@/types";
import { formatDate } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

/** 잠금 오버레이 — 권한이 없는 항목 위에 덮는다. */
function LockOverlay() {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-xl bg-ink/80 text-center backdrop-blur-sm">
      <div className="text-3xl">🔒</div>
      <p className="text-sm font-medium text-zinc-200">열람 권한이 필요합니다</p>
      <Link href="/membership">
        <Button size="sm" variant="secondary">
          🎫 금지구역 출입 권한 얻기
        </Button>
      </Link>
    </div>
  );
}

export default function ForbiddenPage() {
  const { data: items } = useCollection<ForbiddenZoneItem>(
    STORAGE_KEYS.forbiddenZone,
    mockForbiddenZoneItems,
  );

  const villa = useMemo(() => items.filter((i) => i.type === "칠죄빌라"), [items]);
  const napoli = useMemo(
    () => items.filter((i) => i.type === "나폴리탄 문서실"),
    [items],
  );
  const letters = useMemo(
    () => items.filter((i) => i.type === "검은 모자의 편지함"),
    [items],
  );
  const restricted = useMemo(
    () =>
      items.filter(
        (i) => i.type === "열람 제한 파일" || i.type === "사라진 제보자 기록",
      ),
    [items],
  );

  // 나폴리탄 "가장 위험한 규칙 투표" (로컬 카운트)
  const [napoliVotes, setNapoliVotes] = useState<Record<string, number>>({});
  const voteNapoli = (id: string) =>
    setNapoliVotes((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">🚫 금지구역</h1>
        <p className="mt-1 text-sm text-ash">
          이 아래의 기록은 검은 모자의 허가 없이 외부로 옮기지 마십시오. 일부 문은
          아직 열리지 않았습니다.
        </p>
      </div>

      {/* ── 칠죄빌라 ── */}
      <section>
        <SectionTitle
          title="칠죄빌라"
          subtitle="일곱 개의 죄, 일곱 개의 방. 입주민은 아무도 나오지 못했습니다."
          action={
            <Link href="/submit">
              <Button size="sm" variant="outline">
                ✍️ 입주민 제보
              </Button>
            </Link>
          }
        />

        <Card className="mb-4 border-purple-500/30 bg-purple-500/5">
          <p className="text-sm text-ash">
            <span className="font-medium text-purple-300">관리인 공지</span> — 707호의
            계량기가 다시 돌아가고 있습니다. 입주민 여러분은 야간에 복도 거울을 보지
            마십시오.
          </p>
          <p className="mt-2 text-xs text-ash-faint">
            실종자 기록: 101호 최(실종), 303호(연락두절) 외 4명. 마지막 목격 시각은
            모두 새벽 3시였습니다.
          </p>
        </Card>

        {villa.length === 0 ? (
          <EmptyState icon="🏚️" title="공개된 호실이 없습니다." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {villa.map((room) => (
              <div key={room.id} className="relative">
                {room.isLocked && <LockOverlay />}
                <Card
                  className={cn(
                    "h-full",
                    room.isLocked && "pointer-events-none select-none blur-sm",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-zinc-100">
                      {room.roomNumber ?? "??호"} · {room.sin ?? "???"}
                    </span>
                    <Badge variant="villa">칠죄빌라</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ash-dim">
                    입주민: {room.residentName ?? "미상"}
                  </p>
                  <p className="mt-2 text-sm text-ash">{room.content}</p>

                  {room.officialLore && (
                    <p className="mt-3 text-xs text-ash-dim">
                      <span className="text-zinc-300">공식 설정</span> ·{" "}
                      {room.officialLore}
                    </p>
                  )}
                  {room.userSpeculation && room.userSpeculation !== "-" && (
                    <p className="mt-1 text-xs text-ash-faint">
                      <span className="text-purple-300">입주민 추측</span> ·{" "}
                      {room.userSpeculation}
                    </p>
                  )}
                  {room.nextRevealAt && (
                    <p className="mt-2 text-xs text-blood-bright">
                      🔓 다음 공개 예정: {formatDate(room.nextRevealAt)}
                    </p>
                  )}
                  {room.relatedCaseFileId && (
                    <Link
                      href={`/cases/${room.relatedCaseFileId}`}
                      className="mt-3 inline-block text-xs text-ash-dim underline hover:text-zinc-100"
                    >
                      관련 사건파일 보기 →
                    </Link>
                  )}
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 나폴리탄 문서실 ── */}
      <section>
        <SectionTitle
          title="나폴리탄 문서실"
          subtitle="설명되지 않은 규칙들의 보관소. 읽되, 따르지는 마십시오."
        />

        <Card className="mb-4 border-blood/30 bg-blood/5">
          <p className="text-sm font-medium text-zinc-100">🔥 나폴리탄 챌린지</p>
          <p className="mt-1 text-sm text-ash">
            아래 규칙 중 하나를 골라, 그 규칙을 어겼을 때 벌어질 일을 상상해
            제보해보세요. 채택된 시나리오는 다음 방송의 나폴리탄 특집으로 각색됩니다.
          </p>
          <Link href="/submit" className="mt-3 inline-block">
            <Button size="sm" variant="danger">
              챌린지 참여하기
            </Button>
          </Link>
        </Card>

        {napoli.length === 0 ? (
          <EmptyState icon="📄" title="공개된 문서가 없습니다." />
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-ash-faint">
              가장 위험한 규칙 투표 — 가장 무섭다고 생각하는 문서에 투표하세요.
            </p>
            {napoli.map((doc) => (
              <div key={doc.id} className="relative">
                {doc.isLocked && <LockOverlay />}
                <Card
                  className={cn(doc.isLocked && "pointer-events-none select-none blur-sm")}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold leading-snug text-zinc-100">
                      {doc.title}
                    </h3>
                    <Badge variant="broadcast">나폴리탄</Badge>
                  </div>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ash">
                    {doc.content}
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => voteNapoli(doc.id)}
                    >
                      ⚠️ 가장 위험함
                    </Button>
                    <span className="text-xs text-ash-faint tabular-nums">
                      {napoliVotes[doc.id] || 0}표
                    </span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 검은 모자의 편지함 ── */}
      <section>
        <SectionTitle
          title="검은 모자의 편지함"
          subtitle="진행자가 청취자에게만 남긴 글. 받는 사람은 한 명뿐입니다."
        />
        {letters.length === 0 ? (
          <EmptyState icon="✉️" title="도착한 편지가 없습니다." />
        ) : (
          <div className="space-y-4">
            {letters.map((letter) => (
              <div key={letter.id} className="relative">
                {letter.isLocked && <LockOverlay />}
                <Card
                  className={cn(
                    "border-line-strong bg-ink-800",
                    letter.isLocked && "pointer-events-none select-none blur-sm",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-zinc-100">{letter.title}</h3>
                    <span className="text-lg">🎩</span>
                  </div>
                  <p className="mt-2 font-mono text-sm italic leading-relaxed text-ash">
                    {letter.content}
                  </p>
                  <p className="mt-3 text-right text-xs italic text-ash-faint">
                    — 검은 모자
                  </p>
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 열람 제한 파일 + 사라진 제보자 기록 ── */}
      <section>
        <SectionTitle
          title="열람 제한 파일"
          subtitle="관리자 검토 후 일부만 공개됩니다. 나머지는 가려져 있습니다."
        />
        {restricted.length === 0 ? (
          <EmptyState icon="🗄️" title="열람 제한 파일이 없습니다." />
        ) : (
          <div className="space-y-4">
            {restricted.map((file) => (
              <div key={file.id} className="relative">
                {file.isLocked && <LockOverlay />}
                <Card
                  className={cn(
                    "border-blood/20",
                    file.isLocked && "pointer-events-none select-none blur-sm",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold text-zinc-100">{file.title}</h3>
                    <Badge variant="danger">{file.type}</Badge>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-ash-dim">
                    {file.content}
                  </p>
                  <p className="mt-3 font-mono text-xs tracking-widest text-ash-faint">
                    ██████ 이하 내용 검열됨 ██████
                  </p>
                </Card>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
