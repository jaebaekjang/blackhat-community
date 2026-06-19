import Link from "next/link";
import type { CaseFile } from "@/types";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Badge } from "@/components/ui/Badge";

export function CaseCard({
  caseFile,
  commentCount = 0,
  compact = false,
}: {
  caseFile: CaseFile;
  commentCount?: number;
  compact?: boolean;
}) {
  const c = caseFile;
  return (
    <Link href={`/cases/${c.id}`} className="block">
      <div className="panel h-full p-4 transition-colors hover:border-line-strong hover:bg-surface-alt">
        <div className="flex items-center justify-between gap-2">
          <span className="case-no text-xs">{c.caseNumber}</span>
          <StatusBadge status={c.status} />
        </div>

        <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-zinc-100">
          {c.title}
        </h3>

        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-xs text-ash-dim">
          <Badge variant="neutral">{c.category}</Badge>
          <span>·</span>
          <span>{c.isAnonymous ? "익명" : c.authorName}</span>
          {c.relatedVideoUrl && (
            <>
              <span>·</span>
              <span className="text-blood-bright">▶ 방송 영상</span>
            </>
          )}
        </div>

        {!compact && (
          <p className="mt-2 line-clamp-2 text-sm text-ash">{c.content}</p>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ash-dim">
          <span title="공포지수">
            😱 공포 <b className="text-blood-bright">{c.fearScore}</b>
          </span>
          <span title="현실감">🧩 현실감 {c.realismScore}</span>
          <span title="찝찝함">🌫️ 찝찝함 {c.uneaseScore}</span>
          <span title="댓글 수">💬 {commentCount}</span>
          <span title="방송 요청 수">📣 {c.broadcastRequestCount}</span>
        </div>
      </div>
    </Link>
  );
}
