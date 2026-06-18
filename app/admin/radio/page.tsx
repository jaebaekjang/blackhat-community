"use client";

import { useMemo, useState } from "react";
import { RADIO_STATUSES } from "@/types";
import type { RadioRoom, CaseFile, RadioStatus } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockRadioRooms, mockCases } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { createItem, updateItem, softDeleteItem } from "@/lib/storage";
import { formatDateTime, generateId, nowISO } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { TextField, SelectField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function RadioAdminPage() {
  const { showToast } = useToast();
  const { data: rooms } = useCollection<RadioRoom>(STORAGE_KEYS.radioRooms, mockRadioRooms);
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 생성 폼 상태
  const [title, setTitle] = useState("");
  const [caseTitle, setCaseTitle] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState<RadioStatus>(RADIO_STATUSES[0]);

  // caseFileId → 사건 제목 lookup
  const caseTitleById = useMemo(() => {
    const map: Record<string, string> = {};
    cases.forEach((c) => (map[c.id] = c.title));
    return map;
  }, [cases]);

  const caseTitleOptions = useMemo(() => ["선택 안 함", ...cases.map((c) => c.title)], [cases]);

  const sortedRooms = useMemo(
    () =>
      [...rooms].sort(
        (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
      ),
    [rooms],
  );

  const selected = rooms.find((r) => r.id === selectedId) ?? null;
  const deleting = rooms.find((r) => r.id === deleteId) ?? null;

  const handleCreate = () => {
    if (!title.trim()) {
      showToast("제목을 입력해주세요.", "error");
      return;
    }
    const matchedCase = cases.find((c) => c.title === caseTitle);
    const ts = nowISO();
    const scheduledISO = scheduledAt ? new Date(scheduledAt).toISOString() : ts;
    const room: RadioRoom = {
      id: generateId("radio"),
      title: title.trim(),
      caseFileId: matchedCase ? matchedCase.id : null,
      scheduledAt: scheduledISO,
      status,
      youtubeUrl: youtubeUrl.trim() || null,
      participantCount: 0,
      pollQuestion: "",
      createdAt: ts,
      updatedAt: ts,
    };
    createItem(STORAGE_KEYS.radioRooms, room);
    showToast("방송/해석방을 생성했습니다.", "success");
    setTitle("");
    setCaseTitle("");
    setScheduledAt("");
    setYoutubeUrl("");
    setStatus(RADIO_STATUSES[0]);
  };

  const columns: Column<RadioRoom>[] = [
    {
      key: "title",
      header: "제목",
      render: (r) => <span className="font-medium text-zinc-100">{r.title}</span>,
    },
    {
      key: "case",
      header: "관련 사건",
      render: (r) => (
        <span className="text-xs text-ash">
          {r.caseFileId ? caseTitleById[r.caseFileId] ?? "-" : "-"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "scheduledAt",
      header: "예정시간",
      render: (r) => <span className="text-xs text-ash-faint">{formatDateTime(r.scheduledAt)}</span>,
    },
    { key: "status", header: "상태", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "participantCount",
      header: "참여자",
      render: (r) => <span className="tabular-nums">{r.participantCount}</span>,
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "관리",
      render: (r) => (
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setSelectedId(r.id)}>
            편집
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteId(r.id)}>
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="심야라디오 관리"
        description="대기방/방송/해석방을 생성하고 방송 상태, 투표, 유튜브 링크를 관리합니다."
      />

      {/* 상태 범례 */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-ash-dim">
        <span>상태:</span>
        {RADIO_STATUSES.map((st) => (
          <StatusBadge key={st} status={st} />
        ))}
      </div>

      {/* 생성 폼 */}
      <Card className="mb-5">
        <div className="mb-3 text-sm font-semibold text-zinc-100">방송/해석방 생성</div>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="제목"
            placeholder="예: 오늘 밤 친무썰 - 새벽 3시 초인종"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <SelectField
            label="방송 예정 사건 선택"
            options={caseTitleOptions}
            value={caseTitle}
            onChange={(e) => setCaseTitle(e.target.value === "선택 안 함" ? "" : e.target.value)}
          />
          <TextField
            label="방송 시간"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
          <TextField
            label="유튜브 링크"
            placeholder="https://youtube.com/watch?v=..."
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
          />
          <SelectField
            label="상태"
            options={RADIO_STATUSES}
            value={status}
            onChange={(e) => setStatus(e.target.value as RadioStatus)}
          />
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={handleCreate}>생성</Button>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={sortedRooms}
        getRowKey={(r) => r.id}
        emptyLabel="등록된 방송/해석방이 없습니다."
      />

      <RadioEditor
        room={selected}
        onClose={() => setSelectedId(null)}
        onToast={showToast}
      />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleting) {
            softDeleteItem(STORAGE_KEYS.radioRooms, deleting.id);
            showToast("방송/해석방을 삭제했습니다.", "success");
          }
        }}
        title="방송/해석방을 삭제할까요?"
        description={deleting ? `'${deleting.title}'(을)를 삭제합니다.` : undefined}
        confirmLabel="삭제"
      />
    </div>
  );
}

function RadioEditor({
  room,
  onClose,
  onToast,
}: {
  room: RadioRoom | null;
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [pollQuestion, setPollQuestion] = useState("");
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  if (!room) return null;
  const r = room;

  // 모달 열릴 때 1회 초기화
  if (hydratedId !== r.id) {
    setYoutubeUrl(r.youtubeUrl ?? "");
    setPollQuestion(r.pollQuestion ?? "");
    setHydratedId(r.id);
  }

  const patch = (updates: Partial<RadioRoom>, msg: string) => {
    updateItem<RadioRoom>(STORAGE_KEYS.radioRooms, r.id, updates);
    onToast(msg, "success");
  };

  const save = () =>
    patch(
      { youtubeUrl: youtubeUrl.trim() || null, pollQuestion: pollQuestion.trim() },
      "방송 정보를 저장했습니다.",
    );

  return (
    <Modal open={!!room} onClose={onClose} title={`${r.title} 편집`}>
      <div className="space-y-4 text-sm">
        {/* 상태 변경 */}
        <div>
          <div className="field-label">상태 변경</div>
          <div className="flex flex-wrap gap-1.5">
            {RADIO_STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => patch({ status: st }, `상태: ${st}`)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  r.status === st
                    ? "border-blood/50 bg-blood/15 text-blood-bright"
                    : "border-line text-ash-dim hover:text-zinc-100",
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* 대기방 오픈 / 닫기 */}
        <div>
          <div className="field-label">대기방 제어</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => patch({ status: "대기방 오픈" }, "대기방을 오픈했습니다.")}>
              대기방 오픈
            </Button>
            <Button size="sm" variant="secondary" onClick={() => patch({ status: "방송 전" }, "대기방을 닫았습니다.")}>
              대기방 닫기
            </Button>
          </div>
        </div>

        <TextField
          label="유튜브 링크"
          placeholder="https://youtube.com/watch?v=..."
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
        />
        <TextField
          label="투표 질문"
          placeholder="예: 오늘 혼자 듣나요?"
          value={pollQuestion}
          onChange={(e) => setPollQuestion(e.target.value)}
        />

        {/* mock 도구 */}
        <div className="border-t border-line pt-3">
          <div className="field-label">방송 도구 (mock)</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={() => onToast("채팅 mock 데이터를 갱신했습니다. (mock)", "info")}>
              채팅 mock 관리
            </Button>
            <Button size="sm" variant="ghost" onClick={() => onToast("투표를 생성했습니다. (mock)", "info")}>
              투표 생성
            </Button>
          </div>
        </div>

        <div className="flex justify-end border-t border-line pt-3">
          <Button onClick={save}>링크/투표 저장</Button>
        </div>
      </div>
    </Modal>
  );
}
