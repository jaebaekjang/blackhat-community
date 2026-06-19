"use client";

import { useMemo, useState } from "react";
import { WRITER_WORK_STATUSES, WRITER_GRADES } from "@/types";
import type { WriterWork, WriterWorkStatus, WriterGrade } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockWriterWorks } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { updateItem } from "@/lib/storage";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { TextArea, SelectField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const CONTESTS = ["나폴리탄 공모전", "칠죄빌라 외전 공모", "친무썰 각색 공모"];

export default function WritersAdminPage() {
  const { showToast } = useToast();
  const { data: works } = useCollection<WriterWork>(
    STORAGE_KEYS.writerWorks,
    mockWriterWorks,
  );

  const [statusFilter, setStatusFilter] = useState("전체");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = works;
    if (statusFilter !== "전체") list = list.filter((w) => w.status === statusFilter);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [works, statusFilter]);

  const selected = works.find((w) => w.id === selectedId) ?? null;

  const columns: Column<WriterWork>[] = [
    {
      key: "title",
      header: "제목",
      render: (w) => <span className="font-medium text-zinc-100">{w.title}</span>,
    },
    { key: "authorName", header: "작가", render: (w) => w.authorName },
    {
      key: "authorGrade",
      header: "작가 등급",
      render: (w) => <Badge variant="neutral">{w.authorGrade}</Badge>,
      hideOnMobile: true,
    },
    { key: "genre", header: "장르", render: (w) => <Badge variant="neutral">{w.genre}</Badge>, hideOnMobile: true },
    { key: "fearScore", header: "공포지수", render: (w) => <span className="text-blood-bright">{w.fearScore}</span> },
    { key: "recommendationCount", header: "추천 수", render: (w) => w.recommendationCount, hideOnMobile: true },
    { key: "status", header: "상태", render: (w) => <StatusBadge status={w.status} /> },
    {
      key: "actions",
      header: "관리",
      render: (w) => (
        <Button size="sm" variant="secondary" onClick={() => setSelectedId(w.id)}>
          검토
        </Button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="작가실 관리"
        description="투고작을 검토하고 채택/반려, 공식 낭독 후보 지정, 작가 등급을 관리합니다."
      />

      {/* 공모전 안내 */}
      <Card className="mb-5">
        <h2 className="mb-2 text-base font-semibold text-zinc-100">공모전 관리</h2>
        <p className="mb-2 text-sm text-ash-dim">
          진행 중인 공모전. 수상작 선정은 각 작품 검토에서 &lsquo;수상작 선정(채택)&rsquo;으로 처리합니다.
        </p>
        <div className="flex flex-wrap gap-2">
          {CONTESTS.map((c) => (
            <Badge key={c} variant="info">
              {c}
            </Badge>
          ))}
        </div>
      </Card>

      {/* 상태 필터 */}
      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {["전체", ...WRITER_WORK_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1 text-xs",
              statusFilter === s
                ? "border-blood/50 bg-blood/15 text-blood-bright"
                : "border-line text-ash-dim hover:text-zinc-100",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(w) => w.id}
        emptyLabel="해당 상태의 작품이 없습니다."
      />

      <WriterReview
        work={selected}
        onClose={() => setSelectedId(null)}
        onToast={showToast}
      />
    </div>
  );
}

function WriterReview({
  work,
  onClose,
  onToast,
}: {
  work: WriterWork | null;
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [grade, setGrade] = useState<WriterGrade>(WRITER_GRADES[0]);
  const [rejectReason, setRejectReason] = useState("");
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  if (!work) return null;
  const w = work;

  // 모달 열릴 때 1회 초기화
  if (hydratedId !== w.id) {
    setGrade(w.authorGrade);
    setRejectReason("");
    setHydratedId(w.id);
  }

  const changeStatus = (status: WriterWorkStatus, msg: string) => {
    updateItem<WriterWork>(STORAGE_KEYS.writerWorks, w.id, { status });
    onToast(msg, "success");
  };

  const applyGrade = (next: WriterGrade) => {
    setGrade(next);
    updateItem<WriterWork>(STORAGE_KEYS.writerWorks, w.id, { authorGrade: next });
    onToast(`작가 등급을 '${next}'(으)로 변경했습니다.`, "success");
  };

  const applyReject = () => {
    updateItem<WriterWork>(STORAGE_KEYS.writerWorks, w.id, { status: "반려" });
    onToast("반려 처리 (사유 기록 mock)", "info");
  };

  return (
    <Modal open={!!work} onClose={onClose} title={w.title}>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Info label="작가" value={w.authorName} />
          <Info label="작가 등급" value={w.authorGrade} />
          <Info label="장르" value={w.genre} />
          <Info label="공포지수" value={String(w.fearScore)} />
        </div>

        {/* 원문 */}
        <div>
          <div className="field-label">작품 내용</div>
          <p className="whitespace-pre-line rounded-lg border border-line bg-ink-800 p-3 leading-relaxed text-ash">
            {w.content}
          </p>
        </div>

        {/* 상태 변경 */}
        <div>
          <div className="field-label">상태 변경</div>
          <div className="flex flex-wrap gap-1.5">
            {WRITER_WORK_STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => changeStatus(st, `상태: ${st}`)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  w.status === st
                    ? "border-blood/50 bg-blood/15 text-blood-bright"
                    : "border-line text-ash-dim hover:text-zinc-100",
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* 주요 조치 */}
        <div className="flex flex-wrap gap-2 border-t border-line pt-3">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => changeStatus("공식 낭독 후보", "공식 낭독 후보로 지정했습니다.")}
          >
            공식 낭독 후보 지정
          </Button>
          <Button
            size="sm"
            onClick={() => changeStatus("채택", "수상작으로 선정(채택)했습니다.")}
          >
            수상작 선정(채택)
          </Button>
        </div>

        {/* 작가 등급 변경 */}
        <div>
          <SelectField
            label="작가 등급 변경"
            options={WRITER_GRADES}
            value={grade}
            onChange={(e) => applyGrade(e.target.value as WriterGrade)}
          />
        </div>

        {/* 반려 */}
        <div className="border-t border-line pt-3">
          <TextArea
            label="반려 사유"
            placeholder="반려 시 작가에게 전달할 사유 (mock: 저장되지 않음)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <Button variant="danger" size="sm" onClick={applyReject}>
              반려 처리
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-800 p-2">
      <div className="text-ash-faint">{label}</div>
      <div className="mt-0.5 text-ash">{value}</div>
    </div>
  );
}
