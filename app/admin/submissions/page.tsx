"use client";

import { useMemo, useState } from "react";
import { SUBMISSION_STATUSES } from "@/types";
import type { Submission, CaseFile, ContentPipelineItem } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockSubmissions, mockCases } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { createItem, updateItem } from "@/lib/storage";
import { formatDate, generateId, nowISO } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge, RiskBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { TextArea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

export default function AdminSubmissionsPage() {
  const { showToast } = useToast();
  const { data: submissions } = useCollection<Submission>(STORAGE_KEYS.submissions, mockSubmissions);
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);
  const { data: pipeline } = useCollection<ContentPipelineItem>(STORAGE_KEYS.contentPipelineItems, []);

  const [statusFilter, setStatusFilter] = useState("전체");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const caseBySub = useMemo(() => {
    const map: Record<string, CaseFile> = {};
    cases.forEach((c) => {
      if (c.submissionId) map[c.submissionId] = c;
    });
    return map;
  }, [cases]);

  const filtered = useMemo(() => {
    let list = submissions;
    if (statusFilter !== "전체") list = list.filter((s) => s.status === statusFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.authorName.toLowerCase().includes(q),
      );
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [submissions, statusFilter, query]);

  const selected = submissions.find((s) => s.id === selectedId) ?? null;

  const columns: Column<Submission>[] = [
    {
      key: "caseNumber",
      header: "사건번호",
      render: (s) => (
        <span className="case-no text-xs">
          {s.caseFileId ? caseBySub[s.id]?.caseNumber ?? "-" : "-"}
        </span>
      ),
    },
    {
      key: "title",
      header: "제목",
      render: (s) => <span className="font-medium text-zinc-100">{s.title}</span>,
    },
    { key: "category", header: "카테고리", render: (s) => <Badge variant="neutral">{s.category}</Badge> },
    { key: "authorName", header: "제보자", render: (s) => s.authorName, hideOnMobile: true },
    { key: "isAnonymous", header: "익명", render: (s) => (s.isAnonymous ? "익명" : "공개"), hideOnMobile: true },
    { key: "region", header: "지역", render: (s) => s.region, hideOnMobile: true },
    { key: "locationType", header: "장소", render: (s) => s.locationType, hideOnMobile: true },
    { key: "broadcastWish", header: "방송 희망", render: (s) => <span className="text-xs">{s.broadcastWish}</span>, hideOnMobile: true },
    { key: "riskLevel", header: "개인정보", render: (s) => <RiskBadge risk={s.riskLevel} /> },
    { key: "status", header: "상태", render: (s) => <StatusBadge status={s.status} /> },
    { key: "createdAt", header: "작성일", render: (s) => <span className="text-xs text-ash-faint">{formatDate(s.createdAt)}</span>, hideOnMobile: true },
    {
      key: "actions",
      header: "관리",
      render: (s) => (
        <Button size="sm" variant="secondary" onClick={() => setSelectedId(s.id)}>
          상세
        </Button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="제보 관리"
        description="검은 제보함으로 접수된 제보를 검수하고 상태를 변경합니다."
      />

      {/* 필터 */}
      <div className="mb-4 space-y-2">
        <input
          className="field"
          placeholder="🔍 제목 / 제보자 검색"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {["전체", ...SUBMISSION_STATUSES].map((s) => (
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
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(s) => s.id}
        emptyLabel="해당 조건의 제보가 없습니다."
      />

      <SubmissionDetail
        submission={selected}
        relatedCase={selected ? caseBySub[selected.id] : undefined}
        inPipeline={
          selected ? pipeline.some((p) => p.caseFileId === selected.caseFileId) : false
        }
        onClose={() => setSelectedId(null)}
        onToast={showToast}
      />
    </div>
  );
}

function SubmissionDetail({
  submission,
  relatedCase,
  inPipeline,
  onClose,
  onToast,
}: {
  submission: Submission | null;
  relatedCase?: CaseFile;
  inPipeline: boolean;
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [memo, setMemo] = useState("");
  const [reject, setReject] = useState("");
  const [followUp, setFollowUp] = useState("");

  if (!submission) return null;
  const s = submission;

  const changeStatus = (status: Submission["status"]) => {
    updateItem<Submission>(STORAGE_KEYS.submissions, s.id, { status });
    if (s.caseFileId) {
      // 사건파일 상태도 일부 동기화
      const caseStatus =
        status === "방송 완료" ? "방송 완료" : status === "방송 후보" ? "방송 후보" : undefined;
      if (caseStatus) updateItem<CaseFile>(STORAGE_KEYS.cases, s.caseFileId, { status: caseStatus });
    }
    onToast(`상태를 '${status}'(으)로 변경했습니다.`, "success");
  };

  const saveMemo = () => {
    updateItem<Submission>(STORAGE_KEYS.submissions, s.id, {
      adminMemo: memo || s.adminMemo,
      rejectReason: reject || s.rejectReason,
      followUpQuestion: followUp || s.followUpQuestion,
    });
    onToast("관리자 메모를 저장했습니다.", "success");
  };

  const sendToPipeline = () => {
    if (!relatedCase) return onToast("연결된 사건파일이 없습니다.", "error");
    if (inPipeline) return onToast("이미 파이프라인에 있는 사건입니다.", "info");
    const ts = nowISO();
    const item: ContentPipelineItem = {
      id: generateId("pipe"),
      caseFileId: relatedCase.id,
      caseNumber: relatedCase.caseNumber,
      title: relatedCase.title,
      category: relatedCase.category,
      fearScore: relatedCase.fearScore,
      broadcastRequestCount: relatedCase.broadcastRequestCount,
      status: "검토 중",
      priority: "보통",
      assignee: "미정",
      estimatedRuntime: "",
      dueDate: null,
      uploadUrl: null,
      recordingMemo: "",
      editingMemo: "",
      createdAt: ts,
      updatedAt: ts,
    };
    createItem(STORAGE_KEYS.contentPipelineItems, item);
    changeStatus("방송 후보");
    onToast("콘텐츠 제작 파이프라인으로 보냈습니다.", "success");
  };

  return (
    <Modal open={!!submission} onClose={onClose} title={s.title}>
      <div className="space-y-4 text-sm">
        {/* 위험 키워드 */}
        {s.detectedRiskKeywords.length > 0 && (
          <div className="rounded-lg border border-blood/40 bg-blood/5 p-3">
            <div className="mb-1 flex items-center gap-2">
              <RiskBadge risk={s.riskLevel} />
              <span className="text-xs text-ash-dim">위험 키워드 감지 결과</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {s.detectedRiskKeywords.map((k) => (
                <span key={k} className="rounded bg-blood/15 px-1.5 py-0.5 text-xs text-blood-bright">
                  {k}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 원문 */}
        <div>
          <div className="field-label">원문</div>
          <p className="whitespace-pre-line rounded-lg border border-line bg-ink-800 p-3 leading-relaxed text-ash">
            {s.content}
          </p>
        </div>

        {/* 제보자 / 동의 정보 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Info label="제보자" value={s.isAnonymous ? "익명" : s.authorName} />
          <Info label="카테고리" value={s.category} />
          <Info label="방송 사용 동의" value={s.broadcastConsent ? "동의" : "미동의"} />
          <Info label="각색 가능" value={s.editConsent ? "동의" : "미동의"} />
          <Info label="개인정보 제외 동의" value={s.privacyConsent ? "동의" : "미동의"} />
          <Info label="방송 희망" value={s.broadcastWish} />
        </div>

        {/* 상태 변경 */}
        <div>
          <div className="field-label">상태 변경</div>
          <div className="flex flex-wrap gap-1.5">
            {SUBMISSION_STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => changeStatus(st)}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs",
                  s.status === st
                    ? "border-blood/50 bg-blood/15 text-blood-bright"
                    : "border-line text-ash-dim hover:text-zinc-100",
                )}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <TextArea label="관리자 메모" placeholder={s.adminMemo || "검수 메모..."} value={memo} onChange={(e) => setMemo(e.target.value)} />
        <TextArea label="반려 사유" placeholder={s.rejectReason || "반려 시 사유..."} value={reject} onChange={(e) => setReject(e.target.value)} />
        <TextArea label="후속 질문" placeholder={s.followUpQuestion || "제보자에게 추가로 물어볼 내용..."} value={followUp} onChange={(e) => setFollowUp(e.target.value)} />

        <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-3">
          <Button variant="ghost" onClick={saveMemo}>메모 저장</Button>
          <Button variant="secondary" onClick={sendToPipeline} disabled={inPipeline}>
            {inPipeline ? "파이프라인에 있음" : "콘텐츠 파이프라인으로 보내기"}
          </Button>
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
