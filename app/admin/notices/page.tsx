"use client";

import { useMemo, useState } from "react";
import { NOTICE_TYPES, NOTICE_VISIBILITIES } from "@/types";
import type { Notice, NoticeType, NoticeVisibility } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockNotices } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { createItem, updateItem, softDeleteItem } from "@/lib/storage";
import { generateId, nowISO, formatDate } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { TextField, TextArea, SelectField, Toggle } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

const EVENT_EXAMPLES = [
  "칠죄빌라 다음 호실 투표",
  "나폴리탄 괴담 공모전",
  "친무썰 제보 주간",
  "심야 청취자 출석 이벤트",
  "베스트 해석 이벤트",
];

/** date input(YYYY-MM-DD) → ISO 또는 null */
function dateToISO(date: string): string | null {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

/** ISO → date input(YYYY-MM-DD) */
function isoToDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

export default function NoticesAdminPage() {
  const { showToast } = useToast();
  const { data: notices } = useCollection<Notice>(STORAGE_KEYS.notices, mockNotices);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 작성 폼 상태
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NoticeType>(NOTICE_TYPES[0]);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<NoticeVisibility>(NOTICE_VISIBILITIES[0]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [isPinned, setIsPinned] = useState(false);

  const sorted = useMemo(() => {
    return [...notices].sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [notices]);

  const selected = notices.find((n) => n.id === selectedId) ?? null;
  const deleting = notices.find((n) => n.id === deleteId) ?? null;

  const resetForm = () => {
    setTitle("");
    setType(NOTICE_TYPES[0]);
    setContent("");
    setVisibility(NOTICE_VISIBILITIES[0]);
    setScheduledDate("");
    setIsPinned(false);
  };

  const handleCreate = () => {
    if (!title.trim() || !content.trim()) {
      showToast("제목과 본문을 입력해주세요.", "error");
      return;
    }
    const ts = nowISO();
    const notice: Notice = {
      id: generateId("notice"),
      title: title.trim(),
      content: content.trim(),
      type,
      visibility,
      isPinned,
      scheduledAt: dateToISO(scheduledDate),
      createdAt: ts,
      updatedAt: ts,
    };
    createItem(STORAGE_KEYS.notices, notice);
    showToast("공지를 등록했습니다.", "success");
    resetForm();
  };

  const togglePin = (n: Notice) => {
    updateItem<Notice>(STORAGE_KEYS.notices, n.id, { isPinned: !n.isPinned });
    showToast(n.isPinned ? "상단 고정을 해제했습니다." : "상단에 고정했습니다.", "success");
  };

  const columns: Column<Notice>[] = [
    {
      key: "title",
      header: "제목",
      render: (n) => (
        <span className="font-medium text-zinc-100">
          {n.isPinned && <span className="mr-1">📌</span>}
          {n.title}
        </span>
      ),
    },
    { key: "type", header: "유형", render: (n) => <Badge variant="neutral">{n.type}</Badge>, hideOnMobile: true },
    { key: "visibility", header: "공개 대상", render: (n) => n.visibility, hideOnMobile: true },
    { key: "isPinned", header: "고정", render: (n) => (n.isPinned ? "📌" : "-") },
    { key: "scheduledAt", header: "예약일", render: (n) => (n.scheduledAt ? formatDate(n.scheduledAt) : "-"), hideOnMobile: true },
    { key: "createdAt", header: "작성일", render: (n) => formatDate(n.createdAt), hideOnMobile: true },
    {
      key: "actions",
      header: "관리",
      render: (n) => (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setSelectedId(n.id)}>
            편집
          </Button>
          <Button size="sm" variant="ghost" onClick={() => togglePin(n)}>
            {n.isPinned ? "고정 해제" : "고정"}
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteId(n.id)}>
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="공지/이벤트 관리" description="공지사항과 세계관 이벤트를 등록하고 관리합니다." />

      {/* 공지 작성 */}
      <Card className="mb-6">
        <SectionTitle title="공지 작성" subtitle="검은 모자의 전달사항을 등록합니다." />
        <div className="space-y-3">
          <TextField label="제목" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="공지 제목" />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SelectField
              label="유형"
              options={NOTICE_TYPES}
              value={type}
              onChange={(e) => setType(e.target.value as NoticeType)}
            />
            <SelectField
              label="공개 대상"
              options={NOTICE_VISIBILITIES}
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as NoticeVisibility)}
            />
          </div>
          <TextArea label="본문" required value={content} onChange={(e) => setContent(e.target.value)} placeholder="공지 내용을 입력하세요." />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="예약 공개일"
              type="date"
              hint="비워두면 즉시 공개됩니다."
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
            <div className="flex items-end pb-2">
              <Toggle checked={isPinned} onChange={setIsPinned} label="상단 고정" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate}>공지 작성</Button>
          </div>
        </div>
      </Card>

      {/* 공지 목록 */}
      <SectionTitle title="공지 목록" subtitle="고정 공지가 상단에 표시됩니다." />
      <DataTable columns={columns} rows={sorted} getRowKey={(n) => n.id} emptyLabel="등록된 공지가 없습니다." />

      {/* 이벤트 예시 */}
      <Card className="mt-6">
        <SectionTitle title="이벤트 예시" subtitle="세계관 이벤트 아이디어 모음" />
        <ul className="space-y-1.5 text-sm text-ash">
          {EVENT_EXAMPLES.map((e) => (
            <li key={e} className="flex items-center gap-2">
              <span className="text-blood-bright">▸</span>
              {e}
            </li>
          ))}
        </ul>
      </Card>

      <NoticeEditor notice={selected} onClose={() => setSelectedId(null)} onToast={showToast} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleting) {
            softDeleteItem(STORAGE_KEYS.notices, deleting.id);
            showToast("공지를 삭제했습니다.", "success");
          }
        }}
        title="공지를 삭제하시겠습니까?"
        description={deleting ? `'${deleting.title}' 공지가 삭제됩니다.` : undefined}
      />
    </div>
  );
}

function NoticeEditor({
  notice,
  onClose,
  onToast,
}: {
  notice: Notice | null;
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<NoticeType>(NOTICE_TYPES[0]);
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<NoticeVisibility>(NOTICE_VISIBILITIES[0]);
  const [scheduledDate, setScheduledDate] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  if (!notice) return null;
  const n = notice;

  // 모달 열릴 때 1회 초기화
  if (hydratedId !== n.id) {
    setTitle(n.title);
    setType(n.type);
    setContent(n.content);
    setVisibility(n.visibility);
    setScheduledDate(isoToDate(n.scheduledAt));
    setIsPinned(n.isPinned);
    setHydratedId(n.id);
  }

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      onToast("제목과 본문을 입력해주세요.", "error");
      return;
    }
    updateItem<Notice>(STORAGE_KEYS.notices, n.id, {
      title: title.trim(),
      content: content.trim(),
      type,
      visibility,
      isPinned,
      scheduledAt: dateToISO(scheduledDate),
    });
    onToast("공지를 저장했습니다.", "success");
    onClose();
  };

  return (
    <Modal
      open={!!notice}
      onClose={onClose}
      title="공지 편집"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <TextField label="제목" required value={title} onChange={(e) => setTitle(e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="유형"
            options={NOTICE_TYPES}
            value={type}
            onChange={(e) => setType(e.target.value as NoticeType)}
          />
          <SelectField
            label="공개 대상"
            options={NOTICE_VISIBILITIES}
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as NoticeVisibility)}
          />
        </div>
        <TextArea label="본문" required value={content} onChange={(e) => setContent(e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <TextField label="예약 공개일" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          <div className="flex items-end pb-2">
            <Toggle checked={isPinned} onChange={setIsPinned} label="상단 고정" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
