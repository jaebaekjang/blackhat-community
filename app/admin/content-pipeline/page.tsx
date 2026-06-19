"use client";

import { useMemo, useState } from "react";
import { PIPELINE_STATUSES, PIPELINE_PRIORITIES } from "@/types";
import type { ContentPipelineItem, AdminNote } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockContentPipelineItems, mockAdminNotes } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { createItem, updateItem } from "@/lib/storage";
import { formatDate, generateId, nowISO } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge, PriorityBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { TextField, TextArea, SelectField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export default function ContentPipelinePage() {
  const { showToast } = useToast();
  const { data: items } = useCollection<ContentPipelineItem>(STORAGE_KEYS.contentPipelineItems, mockContentPipelineItems);
  const { data: notes } = useCollection<AdminNote>(STORAGE_KEYS.adminNotes, mockAdminNotes);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const byStatus = useMemo(() => {
    const map: Record<string, ContentPipelineItem[]> = {};
    PIPELINE_STATUSES.forEach((s) => (map[s] = []));
    items.forEach((it) => {
      (map[it.status] ??= []).push(it);
    });
    return map;
  }, [items]);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  const selectedNote = selected
    ? notes.find((n) => n.targetType === "case_file" && n.targetId === selected.caseFileId) ?? null
    : null;

  return (
    <div>
      <AdminPageHeader
        title="콘텐츠 제작 파이프라인"
        description="제보 접수부터 업로드까지 콘텐츠 제작 흐름을 칸반으로 관리합니다."
      />

      {/* 칸반 보드 */}
      <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0">
        <div className="flex gap-3" style={{ minWidth: "max-content" }}>
          {PIPELINE_STATUSES.map((status) => (
            <div key={status} className="w-64 shrink-0">
              <div className="mb-2 flex items-center justify-between px-1">
                <span className="text-sm font-medium text-zinc-100">{status}</span>
                <span className="text-xs text-ash-faint">{byStatus[status]?.length || 0}</span>
              </div>
              <div className="space-y-2 rounded-xl border border-line bg-ink-900/50 p-2">
                {(byStatus[status] || []).map((it) => (
                  <button
                    key={it.id}
                    onClick={() => setSelectedId(it.id)}
                    className="panel w-full p-3 text-left transition-colors hover:border-line-strong"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="case-no text-[11px]">{it.caseNumber}</span>
                      <PriorityBadge priority={it.priority} />
                    </div>
                    <div className="mt-1.5 line-clamp-2 text-sm font-medium text-zinc-100">
                      {it.title}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ash-dim">
                      <span>😱 {it.fearScore}</span>
                      <span>📣 {it.broadcastRequestCount}</span>
                      {it.estimatedRuntime && <span>⏱ {it.estimatedRuntime}</span>}
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-ash-faint">
                      <span>{it.assignee}</span>
                      <span>{it.dueDate ? `~${formatDate(it.dueDate)}` : ""}</span>
                    </div>
                  </button>
                ))}
                {(byStatus[status]?.length || 0) === 0 && (
                  <div className="px-2 py-6 text-center text-xs text-ash-faint">비어 있음</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <PipelineDetail item={selected} note={selectedNote} onClose={() => setSelectedId(null)} onToast={showToast} />
    </div>
  );
}

function PipelineDetail({
  item,
  note,
  onClose,
  onToast,
}: {
  item: ContentPipelineItem | null;
  note: AdminNote | null;
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [hydratedId, setHydratedId] = useState<string | null>(null);
  const [pi, setPi] = useState<Partial<ContentPipelineItem>>({});
  const [nt, setNt] = useState<Partial<AdminNote>>({});

  if (!item) return null;

  if (hydratedId !== item.id) {
    setPi({
      status: item.status,
      priority: item.priority,
      assignee: item.assignee,
      estimatedRuntime: item.estimatedRuntime,
      dueDate: item.dueDate,
      uploadUrl: item.uploadUrl,
      recordingMemo: item.recordingMemo,
      editingMemo: item.editingMemo,
    });
    setNt(
      note ?? {
        youtubeTitle1: "", youtubeTitle2: "", youtubeTitle3: "",
        thumbnailCopy1: "", thumbnailCopy2: "", thumbnailCopy3: "",
        hook: "", keyScene: "", twist: "", ending: "", shortsPoint: "",
        communityPollQuestion: "", videoDescription: "", pinnedComment: "", tags: [],
      },
    );
    setHydratedId(item.id);
  }

  const setN = (k: keyof AdminNote, v: string) => setNt((p) => ({ ...p, [k]: v }));
  const setP = (k: keyof ContentPipelineItem, v: unknown) => setPi((p) => ({ ...p, [k]: v }));

  const save = () => {
    updateItem<ContentPipelineItem>(STORAGE_KEYS.contentPipelineItems, item.id, pi);
    // AdminNote upsert
    if (note) {
      updateItem<AdminNote>(STORAGE_KEYS.adminNotes, note.id, nt);
    } else {
      const ts = nowISO();
      createItem<AdminNote>(STORAGE_KEYS.adminNotes, {
        id: generateId("note"),
        targetType: "case_file",
        targetId: item.caseFileId,
        youtubeTitle1: nt.youtubeTitle1 || "", youtubeTitle2: nt.youtubeTitle2 || "", youtubeTitle3: nt.youtubeTitle3 || "",
        thumbnailCopy1: nt.thumbnailCopy1 || "", thumbnailCopy2: nt.thumbnailCopy2 || "", thumbnailCopy3: nt.thumbnailCopy3 || "",
        hook: nt.hook || "", keyScene: nt.keyScene || "", twist: nt.twist || "", ending: nt.ending || "",
        shortsPoint: nt.shortsPoint || "", communityPollQuestion: nt.communityPollQuestion || "",
        videoDescription: nt.videoDescription || "", pinnedComment: nt.pinnedComment || "",
        tags: nt.tags || [], adminMemo: "", createdAt: ts, updatedAt: ts,
      });
    }
    onToast("콘텐츠 메모를 저장했습니다.", "success");
  };

  // mock 자동 생성
  const gen = {
    titles: () =>
      setNt((p) => ({
        ...p,
        youtubeTitle1: `${item.title} [${item.category}]`,
        youtubeTitle2: `이 사건, 끝까지 보면 잠 못 잡니다`,
        youtubeTitle3: `검은 모자가 읽은 ${item.category} | ${item.caseNumber}`,
      })),
    thumbs: () =>
      setNt((p) => ({ ...p, thumbnailCopy1: "그날 밤", thumbnailCopy2: "보지 말걸", thumbnailCopy3: "마지막 한 줄" })),
    hook: () => setNt((p) => ({ ...p, hook: `${item.title} — 당신이라면 어떻게 했을까요.` })),
    shorts: () => setNt((p) => ({ ...p, shortsPoint: "가장 소름 돋는 30초 구간을 쇼츠로 추출" })),
    poll: () => setNt((p) => ({ ...p, communityPollQuestion: "이 사건, 진짜 같나요?" })),
  };

  return (
    <Modal open={!!item} onClose={onClose} title={`${item.caseNumber} 제작 메모`} className="max-w-2xl">
      <div className="space-y-4 text-sm">
        <div className="font-medium text-zinc-100">{item.title}</div>

        {/* 파이프라인 메타 */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField label="상태" options={PIPELINE_STATUSES} value={pi.status} onChange={(e) => setP("status", e.target.value)} />
          <SelectField label="우선순위" options={PIPELINE_PRIORITIES} value={pi.priority} onChange={(e) => setP("priority", e.target.value)} />
          <TextField label="담당자" value={pi.assignee ?? ""} onChange={(e) => setP("assignee", e.target.value)} />
          <TextField label="예상 러닝타임" value={pi.estimatedRuntime ?? ""} onChange={(e) => setP("estimatedRuntime", e.target.value)} />
          <TextField label="마감일" type="date" value={pi.dueDate ? pi.dueDate.slice(0, 10) : ""} onChange={(e) => setP("dueDate", e.target.value ? new Date(e.target.value).toISOString() : null)} />
          <TextField label="업로드 완료 링크" value={pi.uploadUrl ?? ""} onChange={(e) => setP("uploadUrl", e.target.value)} />
        </div>

        {/* 자동 생성 */}
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-line bg-ink-800 p-2">
          <span className="self-center text-xs text-ash-dim">⚡ mock 자동 생성:</span>
          <Button size="sm" variant="ghost" onClick={gen.titles}>제목 후보</Button>
          <Button size="sm" variant="ghost" onClick={gen.thumbs}>썸네일 문구</Button>
          <Button size="sm" variant="ghost" onClick={gen.hook}>도입부 후킹</Button>
          <Button size="sm" variant="ghost" onClick={gen.shorts}>쇼츠 포인트</Button>
          <Button size="sm" variant="ghost" onClick={gen.poll}>투표 질문</Button>
        </div>

        {/* 유튜브 제목 후보 */}
        <Group title="유튜브 제목 후보">
          <TextField value={nt.youtubeTitle1 ?? ""} onChange={(e) => setN("youtubeTitle1", e.target.value)} placeholder="제목 후보 1" />
          <TextField value={nt.youtubeTitle2 ?? ""} onChange={(e) => setN("youtubeTitle2", e.target.value)} placeholder="제목 후보 2" />
          <TextField value={nt.youtubeTitle3 ?? ""} onChange={(e) => setN("youtubeTitle3", e.target.value)} placeholder="제목 후보 3" />
        </Group>

        <Group title="썸네일 문구 후보">
          <TextField value={nt.thumbnailCopy1 ?? ""} onChange={(e) => setN("thumbnailCopy1", e.target.value)} placeholder="문구 1" />
          <TextField value={nt.thumbnailCopy2 ?? ""} onChange={(e) => setN("thumbnailCopy2", e.target.value)} placeholder="문구 2" />
          <TextField value={nt.thumbnailCopy3 ?? ""} onChange={(e) => setN("thumbnailCopy3", e.target.value)} placeholder="문구 3" />
        </Group>

        <Group title="구성">
          <TextField label="도입부 후킹" value={nt.hook ?? ""} onChange={(e) => setN("hook", e.target.value)} />
          <TextField label="핵심 장면" value={nt.keyScene ?? ""} onChange={(e) => setN("keyScene", e.target.value)} />
          <TextField label="중간 반전" value={nt.twist ?? ""} onChange={(e) => setN("twist", e.target.value)} />
          <TextField label="엔딩 멘트" value={nt.ending ?? ""} onChange={(e) => setN("ending", e.target.value)} />
          <TextField label="쇼츠로 자를 장면" value={nt.shortsPoint ?? ""} onChange={(e) => setN("shortsPoint", e.target.value)} />
          <TextField label="커뮤니티 투표 질문" value={nt.communityPollQuestion ?? ""} onChange={(e) => setN("communityPollQuestion", e.target.value)} />
        </Group>

        <TextArea label="영상 설명란 초안" value={nt.videoDescription ?? ""} onChange={(e) => setN("videoDescription", e.target.value)} />
        <TextField label="고정 댓글 초안" value={nt.pinnedComment ?? ""} onChange={(e) => setN("pinnedComment", e.target.value)} />
        <TextArea label="녹음 메모" value={pi.recordingMemo ?? ""} onChange={(e) => setP("recordingMemo", e.target.value)} />
        <TextArea label="편집 메모" value={pi.editingMemo ?? ""} onChange={(e) => setP("editingMemo", e.target.value)} />

        <div className="flex justify-end border-t border-line pt-3">
          <Button onClick={save}>저장</Button>
        </div>
      </div>
    </Modal>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-ink-800 p-3">
      <div className="mb-2 text-xs font-medium text-ash-dim">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
