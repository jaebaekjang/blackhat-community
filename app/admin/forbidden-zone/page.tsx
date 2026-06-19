"use client";

import { useMemo, useState } from "react";
import { FORBIDDEN_ZONE_TYPES } from "@/types";
import type { ForbiddenZoneType, ForbiddenZoneItem, CaseFile } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockForbiddenZoneItems, mockCases } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { createItem, updateItem, softDeleteItem } from "@/lib/storage";
import { generateId, nowISO } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { TextField, TextArea, SelectField, Toggle } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const NONE = "없음";
const VILLA_REFERENCE =
  "101호 탐욕 / 202호 질투 / 303호 색욕 / 404호 분노 / 505호 나태 / 606호 식탐 / 707호 오만";

export default function ForbiddenZoneAdminPage() {
  const { showToast } = useToast();
  const { data: items } = useCollection<ForbiddenZoneItem>(
    STORAGE_KEYS.forbiddenZone,
    mockForbiddenZoneItems,
  );
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);

  const [typeFilter, setTypeFilter] = useState("전체");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // 새 항목 추가 폼 상태
  const [newType, setNewType] = useState<ForbiddenZoneType>(FORBIDDEN_ZONE_TYPES[0]);
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newIsPublic, setNewIsPublic] = useState(false);
  const [newIsLocked, setNewIsLocked] = useState(true);
  const [newRequiredLevel, setNewRequiredLevel] = useState(0);
  const [newCaseTitle, setNewCaseTitle] = useState(NONE);
  const [newRoomNumber, setNewRoomNumber] = useState("");
  const [newSin, setNewSin] = useState("");
  const [newResidentName, setNewResidentName] = useState("");
  const [newOfficialLore, setNewOfficialLore] = useState("");
  const [newUserSpeculation, setNewUserSpeculation] = useState("");
  const [newNextRevealAt, setNewNextRevealAt] = useState("");

  const caseById = useMemo(() => {
    const map: Record<string, CaseFile> = {};
    cases.forEach((c) => (map[c.id] = c));
    return map;
  }, [cases]);

  const caseTitleOptions = useMemo(
    () => [NONE, ...cases.map((c) => c.title)],
    [cases],
  );

  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter !== "전체") list = list.filter((i) => i.type === typeFilter);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [items, typeFilter]);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const toDelete = items.find((i) => i.id === deleteId) ?? null;

  const resetForm = () => {
    setNewType(FORBIDDEN_ZONE_TYPES[0]);
    setNewTitle("");
    setNewContent("");
    setNewIsPublic(false);
    setNewIsLocked(true);
    setNewRequiredLevel(0);
    setNewCaseTitle(NONE);
    setNewRoomNumber("");
    setNewSin("");
    setNewResidentName("");
    setNewOfficialLore("");
    setNewUserSpeculation("");
    setNewNextRevealAt("");
  };

  const handleCreate = () => {
    if (!newTitle.trim()) {
      showToast("제목을 입력하세요.", "error");
      return;
    }
    const matchedCase = cases.find((c) => c.title === newCaseTitle);
    const ts = nowISO();
    const isVilla = newType === "칠죄빌라";
    const item: ForbiddenZoneItem = {
      id: generateId("fz"),
      type: newType,
      title: newTitle.trim(),
      content: newContent.trim(),
      requiredLevel: Number(newRequiredLevel) || 0,
      isLocked: newIsLocked,
      isPublic: newIsPublic,
      relatedCaseFileId: matchedCase ? matchedCase.id : null,
      ...(isVilla
        ? {
            roomNumber: newRoomNumber.trim() || undefined,
            sin: newSin.trim() || undefined,
            residentName: newResidentName.trim() || undefined,
            officialLore: newOfficialLore.trim() || undefined,
            userSpeculation: newUserSpeculation.trim() || undefined,
            nextRevealAt: newNextRevealAt
              ? new Date(newNextRevealAt).toISOString()
              : undefined,
          }
        : {}),
      createdAt: ts,
      updatedAt: ts,
    };
    createItem(STORAGE_KEYS.forbiddenZone, item);
    showToast("금지구역 항목을 추가했습니다.", "success");
    resetForm();
  };

  const columns: Column<ForbiddenZoneItem>[] = [
    {
      key: "type",
      header: "유형",
      render: (i) => (
        <Badge variant={i.type === "칠죄빌라" ? "villa" : "neutral"}>{i.type}</Badge>
      ),
    },
    {
      key: "title",
      header: "제목",
      render: (i) => <span className="font-medium text-zinc-100">{i.title}</span>,
    },
    { key: "roomNumber", header: "호실", render: (i) => i.roomNumber || "-", hideOnMobile: true },
    {
      key: "isPublic",
      header: "공개",
      render: (i) =>
        i.isPublic ? (
          <Badge variant="success">공개</Badge>
        ) : (
          <Badge variant="warning">비공개</Badge>
        ),
    },
    { key: "isLocked", header: "잠금", render: (i) => (i.isLocked ? "🔒" : "-") },
    {
      key: "relatedCase",
      header: "관련 사건",
      render: (i) => (
        <span className="case-no text-xs">
          {i.relatedCaseFileId ? caseById[i.relatedCaseFileId]?.caseNumber ?? "-" : "-"}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "관리",
      render: (i) => (
        <div className="flex gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setSelectedId(i.id)}>
            편집
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteId(i.id)}>
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="금지구역 관리"
        description="칠죄빌라, 나폴리탄 문서실 등 금지구역 항목의 공개/잠금과 세계관 설정을 관리합니다."
      />

      {/* 유형 필터 */}
      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {["전체", ...FORBIDDEN_ZONE_TYPES].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1 text-xs",
              typeFilter === t
                ? "border-blood/50 bg-blood/15 text-blood-bright"
                : "border-line text-ash-dim hover:text-zinc-100",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 새 항목 추가 */}
      <Card className="mb-5 space-y-3">
        <h2 className="text-base font-semibold text-zinc-100">새 항목 추가</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField
            label="유형"
            options={FORBIDDEN_ZONE_TYPES}
            value={newType}
            onChange={(e) => setNewType(e.target.value as ForbiddenZoneType)}
          />
          <TextField
            label="제목"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
          />
        </div>
        <TextArea
          label="내용"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField
            label="필요 레벨"
            type="number"
            value={newRequiredLevel}
            onChange={(e) => setNewRequiredLevel(Number(e.target.value))}
          />
          <SelectField
            label="관련 사건"
            options={caseTitleOptions}
            value={newCaseTitle}
            onChange={(e) => setNewCaseTitle(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-6">
          <Toggle checked={newIsPublic} onChange={setNewIsPublic} label="공개 여부" />
          <Toggle checked={newIsLocked} onChange={setNewIsLocked} label="잠금" />
        </div>

        {newType === "칠죄빌라" && (
          <div className="space-y-3 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
            <p className="text-xs text-ash-dim">
              칠죄빌라 호실 참고: {VILLA_REFERENCE}
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              <TextField
                label="호실명"
                placeholder="예: 101호"
                value={newRoomNumber}
                onChange={(e) => setNewRoomNumber(e.target.value)}
              />
              <TextField
                label="죄악"
                placeholder="예: 탐욕"
                value={newSin}
                onChange={(e) => setNewSin(e.target.value)}
              />
              <TextField
                label="입주자 이름"
                value={newResidentName}
                onChange={(e) => setNewResidentName(e.target.value)}
              />
            </div>
            <TextArea
              label="공식 설정"
              value={newOfficialLore}
              onChange={(e) => setNewOfficialLore(e.target.value)}
            />
            <TextArea
              label="유저 추측"
              value={newUserSpeculation}
              onChange={(e) => setNewUserSpeculation(e.target.value)}
            />
            <TextField
              label="다음 공개일"
              type="date"
              value={newNextRevealAt}
              onChange={(e) => setNewNextRevealAt(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleCreate}>새 항목 추가</Button>
        </div>
      </Card>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(i) => i.id}
        emptyLabel="해당 유형의 항목이 없습니다."
      />

      <ForbiddenEditor
        item={selected}
        onClose={() => setSelectedId(null)}
        onToast={showToast}
      />

      <ConfirmDialog
        open={!!toDelete}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (toDelete) {
            softDeleteItem(STORAGE_KEYS.forbiddenZone, toDelete.id);
            showToast("항목을 삭제했습니다.", "success");
          }
        }}
        title="항목을 삭제하시겠습니까?"
        description={toDelete ? `'${toDelete.title}' 항목을 삭제합니다.` : undefined}
      />
    </div>
  );
}

function ForbiddenEditor({
  item,
  onClose,
  onToast,
}: {
  item: ForbiddenZoneItem | null;
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [requiredLevel, setRequiredLevel] = useState(0);
  const [roomNumber, setRoomNumber] = useState("");
  const [sin, setSin] = useState("");
  const [residentName, setResidentName] = useState("");
  const [residentStatus, setResidentStatus] = useState("");
  const [officialLore, setOfficialLore] = useState("");
  const [userSpeculation, setUserSpeculation] = useState("");
  const [nextRevealAt, setNextRevealAt] = useState("");
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  if (!item) return null;
  const i = item;
  const isVilla = i.type === "칠죄빌라";

  // 모달 열릴 때 1회 초기화
  if (hydratedId !== i.id) {
    setTitle(i.title);
    setContent(i.content);
    setIsPublic(i.isPublic);
    setIsLocked(i.isLocked);
    setRequiredLevel(i.requiredLevel);
    setRoomNumber(i.roomNumber ?? "");
    setSin(i.sin ?? "");
    setResidentName(i.residentName ?? "");
    setResidentStatus("");
    setOfficialLore(i.officialLore ?? "");
    setUserSpeculation(i.userSpeculation ?? "");
    setNextRevealAt(i.nextRevealAt ? i.nextRevealAt.slice(0, 10) : "");
    setHydratedId(i.id);
  }

  const save = () => {
    const updates: Partial<ForbiddenZoneItem> = {
      title: title.trim(),
      content: content.trim(),
      isPublic,
      isLocked,
      requiredLevel: Number(requiredLevel) || 0,
    };
    if (isVilla) {
      updates.roomNumber = roomNumber.trim() || undefined;
      updates.sin = sin.trim() || undefined;
      updates.residentName = residentName.trim() || undefined;
      updates.officialLore = officialLore.trim() || undefined;
      updates.userSpeculation = userSpeculation.trim() || undefined;
      updates.nextRevealAt = nextRevealAt
        ? new Date(nextRevealAt).toISOString()
        : undefined;
    }
    updateItem<ForbiddenZoneItem>(STORAGE_KEYS.forbiddenZone, i.id, updates);
    onToast("항목을 저장했습니다.", "success");
    onClose();
  };

  return (
    <Modal open={!!item} onClose={onClose} title={`${i.title} 편집`}>
      <div className="space-y-4 text-sm">
        <div className="flex items-center gap-2">
          <Badge variant={isVilla ? "villa" : "neutral"}>{i.type}</Badge>
        </div>

        <TextField label="제목" value={title} onChange={(e) => setTitle(e.target.value)} />
        <TextArea label="내용" value={content} onChange={(e) => setContent(e.target.value)} />
        <TextField
          label="필요 레벨"
          type="number"
          value={requiredLevel}
          onChange={(e) => setRequiredLevel(Number(e.target.value))}
        />

        <div className="flex items-center gap-6">
          <Toggle checked={isPublic} onChange={setIsPublic} label="공개" />
          <Toggle checked={isLocked} onChange={setIsLocked} label="잠금" />
        </div>

        {isVilla && (
          <div className="space-y-3 rounded-lg border border-purple-500/30 bg-purple-500/5 p-3">
            <p className="text-xs text-ash-dim">칠죄빌라 호실 참고: {VILLA_REFERENCE}</p>
            <div className="grid grid-cols-2 gap-3">
              <TextField
                label="호실명"
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
              />
              <TextField label="죄악" value={sin} onChange={(e) => setSin(e.target.value)} />
              <TextField
                label="입주자 이름"
                value={residentName}
                onChange={(e) => setResidentName(e.target.value)}
              />
              <TextField
                label="상태"
                placeholder="예: 실종 / 연락두절"
                value={residentStatus}
                onChange={(e) => setResidentStatus(e.target.value)}
              />
            </div>
            <TextArea
              label="공식 설정"
              value={officialLore}
              onChange={(e) => setOfficialLore(e.target.value)}
            />
            <TextArea
              label="유저 추측"
              value={userSpeculation}
              onChange={(e) => setUserSpeculation(e.target.value)}
            />
            <TextField
              label="다음 공개일"
              type="date"
              value={nextRevealAt}
              onChange={(e) => setNextRevealAt(e.target.value)}
            />
          </div>
        )}

        <div className="flex justify-end border-t border-line pt-3">
          <Button onClick={save}>저장</Button>
        </div>
      </div>
    </Modal>
  );
}
