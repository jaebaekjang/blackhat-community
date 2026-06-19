"use client";

import { useMemo, useState } from "react";
import { CASE_STATUSES } from "@/types";
import type { CaseFile, Comment, ForbiddenZoneItem } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockCases, mockComments } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { createItem, updateItem } from "@/lib/storage";
import { generateId, nowISO } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { TextField, Toggle } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function AdminCasesPage() {
  const { showToast } = useToast();
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);
  const { data: comments } = useCollection<Comment>(STORAGE_KEYS.comments, mockComments);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const commentCount = useMemo(() => {
    const map: Record<string, number> = {};
    comments.forEach((c) => (map[c.caseFileId] = (map[c.caseFileId] || 0) + 1));
    return map;
  }, [comments]);

  const filtered = useMemo(() => {
    let list = cases;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) => c.title.toLowerCase().includes(q) || c.caseNumber.toLowerCase().includes(q),
      );
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [cases, query]);

  const selected = cases.find((c) => c.id === selectedId) ?? null;

  const columns: Column<CaseFile>[] = [
    { key: "caseNumber", header: "사건번호", render: (c) => <span className="case-no text-xs">{c.caseNumber}</span> },
    { key: "title", header: "제목", render: (c) => <span className="font-medium text-zinc-100">{c.title}</span> },
    { key: "category", header: "카테고리", render: (c) => <Badge variant="neutral">{c.category}</Badge>, hideOnMobile: true },
    { key: "status", header: "상태", render: (c) => <StatusBadge status={c.status} /> },
    { key: "fearScore", header: "공포", render: (c) => <span className="text-blood-bright">{c.fearScore}</span> },
    { key: "realismScore", header: "현실감", render: (c) => c.realismScore, hideOnMobile: true },
    { key: "uneaseScore", header: "찝찝함", render: (c) => c.uneaseScore, hideOnMobile: true },
    { key: "comments", header: "댓글", render: (c) => commentCount[c.id] || 0, hideOnMobile: true },
    { key: "broadcastRequestCount", header: "방송요청", render: (c) => c.broadcastRequestCount, hideOnMobile: true },
    { key: "video", header: "영상", render: (c) => (c.relatedVideoUrl ? "▶" : "-"), hideOnMobile: true },
    { key: "isPublic", header: "공개", render: (c) => (c.isPublic ? <Badge variant="success">공개</Badge> : <Badge variant="warning">비공개</Badge>) },
    { key: "actions", header: "관리", render: (c) => <Button size="sm" variant="secondary" onClick={() => setSelectedId(c.id)}>편집</Button> },
  ];

  return (
    <div>
      <AdminPageHeader title="사건파일 관리" description="사건 상태, 공포지수, 공개 여부, 세계관 연결을 관리합니다." />
      <input className="field mb-4" placeholder="🔍 사건번호 / 제목 검색" value={query} onChange={(e) => setQuery(e.target.value)} />
      <DataTable columns={columns} rows={filtered} getRowKey={(c) => c.id} emptyLabel="사건파일이 없습니다." />
      <CaseEditor
        caseFile={selected}
        comments={selected ? comments.filter((c) => c.caseFileId === selected.id) : []}
        onClose={() => setSelectedId(null)}
        onToast={showToast}
      />
    </div>
  );
}

function CaseEditor({
  caseFile,
  comments,
  onClose,
  onToast,
}: {
  caseFile: CaseFile | null;
  comments: Comment[];
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [fear, setFear] = useState(0);
  const [realism, setRealism] = useState(0);
  const [unease, setUnease] = useState(0);
  const [tags, setTags] = useState("");
  const [video, setVideo] = useState("");
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  if (!caseFile) return null;
  const c = caseFile;

  // 모달 열릴 때 1회 초기화
  if (hydratedId !== c.id) {
    setFear(c.fearScore);
    setRealism(c.realismScore);
    setUnease(c.uneaseScore);
    setTags(c.tags.join(", "));
    setVideo(c.relatedVideoUrl ?? "");
    setHydratedId(c.id);
  }

  const patch = (updates: Partial<CaseFile>, msg: string) => {
    updateItem<CaseFile>(STORAGE_KEYS.cases, c.id, updates);
    onToast(msg, "success");
  };

  const saveScores = () =>
    patch(
      {
        fearScore: Number(fear),
        realismScore: Number(realism),
        uneaseScore: Number(unease),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        relatedVideoUrl: video.trim() || null,
      },
      "사건 정보를 저장했습니다.",
    );

  const moveToForbidden = (type: ForbiddenZoneItem["type"]) => {
    const ts = nowISO();
    const item: ForbiddenZoneItem = {
      id: generateId("fz"),
      type,
      title: c.title,
      content: c.content,
      requiredLevel: 2,
      isLocked: true,
      isPublic: false,
      relatedCaseFileId: c.id,
      createdAt: ts,
      updatedAt: ts,
    };
    createItem(STORAGE_KEYS.forbiddenZone, item);
    patch({ isPublic: false }, `'${type}'(으)로 이동했습니다.`);
  };

  const toggleBest = (cm: Comment) =>
    updateItem<Comment>(STORAGE_KEYS.comments, cm.id, { isBest: !cm.isBest });

  return (
    <Modal open={!!caseFile} onClose={onClose} title={`${c.caseNumber} 편집`}>
      <div className="space-y-4 text-sm">
        <div className="font-medium text-zinc-100">{c.title}</div>

        {/* 상태 변경 */}
        <div>
          <div className="field-label">상태 변경</div>
          <div className="flex flex-wrap gap-1.5">
            {CASE_STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => patch({ status: st }, `상태: ${st}`)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  c.status === st ? "border-blood/50 bg-blood/15 text-blood-bright" : "border-line text-ash-dim hover:text-zinc-100",
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* 점수 수정 */}
        <div className="grid grid-cols-3 gap-2">
          <TextField label="공포지수" type="number" value={fear} onChange={(e) => setFear(Number(e.target.value))} />
          <TextField label="현실감" type="number" value={realism} onChange={(e) => setRealism(Number(e.target.value))} />
          <TextField label="찝찝함" type="number" value={unease} onChange={(e) => setUnease(Number(e.target.value))} />
        </div>

        <TextField label="태그 (쉼표 구분)" value={tags} onChange={(e) => setTags(e.target.value)} />
        <TextField label="관련 유튜브 링크" placeholder="https://youtube.com/watch?v=..." value={video} onChange={(e) => setVideo(e.target.value)} />

        <div className="flex items-center gap-6">
          <Toggle checked={c.isPublic} onChange={(v) => patch({ isPublic: v }, v ? "공개로 전환" : "비공개로 전환")} label="공개" />
          <Toggle checked={c.isLocked} onChange={(v) => patch({ isLocked: v }, v ? "잠금" : "잠금 해제")} label="잠금" />
        </div>

        <div className="flex justify-end">
          <Button onClick={saveScores}>점수/태그/영상 저장</Button>
        </div>

        {/* 세계관 이동 */}
        <div className="border-t border-line pt-3">
          <div className="field-label">세계관 연결 / 이동</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => patch({ status: "칠죄빌라 연결 의심" }, "칠죄빌라 연결 의심으로 표시")}>칠죄빌라 연결</Button>
            <Button size="sm" variant="secondary" onClick={() => moveToForbidden("나폴리탄 문서실")}>나폴리탄 문서실로</Button>
            <Button size="sm" variant="secondary" onClick={() => moveToForbidden("열람 제한 파일")}>금지구역으로</Button>
          </div>
        </div>

        {/* 베스트 댓글 지정 */}
        {comments.length > 0 && (
          <div className="border-t border-line pt-3">
            <div className="field-label">베스트 해석 지정</div>
            <div className="space-y-1.5">
              {comments.map((cm) => (
                <button
                  key={cm.id}
                  onClick={() => toggleBest(cm)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2 text-left text-xs",
                    cm.isBest ? "border-emerald-500/40 bg-emerald-500/10" : "border-line hover:bg-surface-alt",
                  )}
                >
                  <span className="line-clamp-1 text-ash">{cm.authorName}: {cm.content}</span>
                  {cm.isBest && <Badge variant="success">⭐ 베스트</Badge>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
