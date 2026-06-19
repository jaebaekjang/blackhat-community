"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useCollection } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockCases } from "@/data";
import type { CaseFile } from "@/types";
import { updateItem } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState, LoadingState } from "@/components/ui/EmptyState";
import { CommentSection } from "@/components/community/CommentSection";
import { useToast } from "@/components/ui/Toast";

export default function CaseDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const { showToast } = useToast();
  const { data: cases, ready } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);
  const [saved, setSaved] = useState(false);

  const c = useMemo(() => cases.find((x) => x.id === id), [cases, id]);

  if (!ready) return <LoadingState />;
  if (!c) {
    return (
      <EmptyState
        icon="🗂️"
        title="사건파일을 찾을 수 없습니다."
        description="삭제되었거나 비공개 처리된 사건일 수 있습니다."
        action={
          <Link href="/cases">
            <Button variant="secondary">사건파일 목록으로</Button>
          </Link>
        }
      />
    );
  }

  const bump = (field: keyof CaseFile, label: string) => {
    const current = Number(c[field] ?? 0);
    updateItem<CaseFile>(STORAGE_KEYS.cases, c.id, { [field]: current + 1 } as Partial<CaseFile>);
    showToast(label, "success");
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/cases" className="text-sm text-ash-dim hover:text-zinc-100">
        ← 사건파일 목록
      </Link>

      {/* 헤더 */}
      <div className="panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="case-no text-sm">{c.caseNumber}</span>
          <StatusBadge status={c.status} dot />
        </div>
        <h1 className="mt-2 text-2xl font-bold leading-snug text-zinc-100">{c.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ash-dim">
          <Badge variant="neutral">{c.category}</Badge>
          <Badge variant="neutral">{c.locationType}</Badge>
          <Badge variant="neutral">{c.region}</Badge>
          <span>· 제보자 {c.isAnonymous ? "익명" : c.authorName}</span>
          <span>· {formatDate(c.createdAt)}</span>
        </div>

        {/* 점수 */}
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Score label="공포지수" value={c.fearScore} accent />
          <Score label="현실감" value={c.realismScore} />
          <Score label="찝찝함" value={c.uneaseScore} />
        </div>
      </div>

      {/* 본문 */}
      <Card>
        <p className="whitespace-pre-line text-[15px] leading-loose text-ash">{c.content}</p>
        {c.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {c.tags.map((t) => (
              <span key={t} className="text-xs text-ash-faint">
                #{t}
              </span>
            ))}
          </div>
        )}
      </Card>

      {/* 관련 영상 */}
      {c.relatedVideoUrl && (
        <Card className="border-blood/30 bg-blood/5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-zinc-100">▶ 이 사건은 방송되었습니다</div>
              <div className="text-xs text-ash-dim">검은 모자의 낭독으로 들어보세요.</div>
            </div>
            <a href={c.relatedVideoUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm">YouTube에서 보기</Button>
            </a>
          </div>
        </Card>
      )}

      {/* 반응 버튼 */}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => bump("broadcastRequestCount", "방송 요청 완료 📣")}>
          📣 방송 요청 {c.broadcastRequestCount}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            if (saved) return;
            bump("saveCount", "사건을 저장했습니다 💾");
            setSaved(true);
          }}
        >
          💾 저장 {c.saveCount}
        </Button>
        <Button variant="secondary" onClick={() => bump("chillsCount", "소름 +1 😱")}>
          😱 소름 {c.chillsCount}
        </Button>
        <Button variant="ghost" onClick={() => bump("uneaseScore", "찝찝함 +1 🌫️")}>
          🌫️ 찝찝함
        </Button>
        <Button variant="ghost" onClick={() => bump("realismScore", "진짜 같음 +1 🧩")}>
          🧩 진짜 같음
        </Button>
        <Link href="/submit">
          <Button variant="ghost">➕ 후속 제보</Button>
        </Link>
      </div>

      {/* 댓글 */}
      <CommentSection caseFileId={c.id} />
    </div>
  );
}

function Score({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-line bg-ink-800 p-3 text-center">
      <div className="text-xs text-ash-dim">{label}</div>
      <div
        className={`mt-1 text-xl font-bold tabular-nums ${
          accent ? "text-blood-bright" : "text-zinc-100"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
