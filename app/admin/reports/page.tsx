"use client";

import { useMemo, useState } from "react";
import { REPORT_STATUSES, REPORT_REASONS } from "@/types";
import type {
  Report,
  ReportStatus,
  ReportTargetType,
  CaseFile,
  Comment,
  User,
} from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockReports, mockCases, mockComments, mockUsers } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { updateItem, softDeleteItem } from "@/lib/storage";
import { formatDate } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { TextArea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const TARGET_TYPE_LABEL: Record<ReportTargetType, string> = {
  case_file: "사건파일",
  comment: "댓글",
  user: "유저",
  writer_work: "작품",
};

export default function ReportsAdminPage() {
  const { showToast } = useToast();
  const { data: reports } = useCollection<Report>(STORAGE_KEYS.reports, mockReports);
  // 관리자 조치가 대상 컬렉션을 갱신할 수 있도록 함께 구독 (시드 보장)
  useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);
  useCollection<Comment>(STORAGE_KEYS.comments, mockComments);
  const { data: users } = useCollection<User>(STORAGE_KEYS.users, mockUsers);

  const [statusFilter, setStatusFilter] = useState("전체");
  const [reasonFilter, setReasonFilter] = useState("전체");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let list = reports;
    if (statusFilter !== "전체") list = list.filter((r) => r.status === statusFilter);
    if (reasonFilter !== "전체") list = list.filter((r) => r.reason === reasonFilter);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [reports, statusFilter, reasonFilter]);

  const selected = reports.find((r) => r.id === selectedId) ?? null;

  const columns: Column<Report>[] = [
    {
      key: "targetLabel",
      header: "신고 대상",
      render: (r) => <span className="font-medium text-zinc-100">{r.targetLabel}</span>,
    },
    {
      key: "targetType",
      header: "대상 유형",
      render: (r) => <Badge variant="neutral">{TARGET_TYPE_LABEL[r.targetType]}</Badge>,
      hideOnMobile: true,
    },
    {
      key: "reason",
      header: "신고 사유",
      render: (r) => <Badge variant="warning">{r.reason}</Badge>,
    },
    { key: "reporterName", header: "신고자", render: (r) => r.reporterName, hideOnMobile: true },
    {
      key: "reportCount",
      header: "신고 횟수",
      render: (r) =>
        r.reportCount >= 3 ? (
          <Badge variant="danger">{r.reportCount}</Badge>
        ) : (
          <span>{r.reportCount}</span>
        ),
    },
    { key: "status", header: "처리 상태", render: (r) => <StatusBadge status={r.status} /> },
    {
      key: "createdAt",
      header: "작성일",
      render: (r) => <span className="text-xs text-ash-faint">{formatDate(r.createdAt)}</span>,
      hideOnMobile: true,
    },
    {
      key: "actions",
      header: "관리",
      render: (r) => (
        <Button size="sm" variant="secondary" onClick={() => setSelectedId(r.id)}>
          처리
        </Button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="신고/검수 관리"
        description="신고된 사건파일·댓글·유저·작품을 검수하고 숨김/경고/제한 등을 처리합니다."
      />

      {/* 필터 */}
      <div className="mb-4 space-y-2">
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {["전체", ...REPORT_STATUSES].map((s) => (
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
        <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {["전체", ...REPORT_REASONS].map((r) => (
            <button
              key={r}
              onClick={() => setReasonFilter(r)}
              className={cn(
                "whitespace-nowrap rounded-full border px-3 py-1 text-xs",
                reasonFilter === r
                  ? "border-blood/50 bg-blood/15 text-blood-bright"
                  : "border-line text-ash-dim hover:text-zinc-100",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(r) => r.id}
        emptyLabel="해당 조건의 신고가 없습니다."
      />

      <ReportDetail
        report={selected}
        users={users}
        onClose={() => setSelectedId(null)}
        onToast={showToast}
      />
    </div>
  );
}

function ReportDetail({
  report,
  users,
  onClose,
  onToast,
}: {
  report: Report | null;
  users: User[];
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [memo, setMemo] = useState("");
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  if (!report) return null;
  const r = report;

  // 모달 열릴 때 1회 초기화
  if (hydratedId !== r.id) {
    setMemo(r.adminMemo ?? "");
    setHydratedId(r.id);
  }

  const changeStatus = (status: ReportStatus) => {
    updateItem<Report>(STORAGE_KEYS.reports, r.id, { status });
    onToast(`처리 상태를 '${status}'(으)로 변경했습니다.`, "success");
  };

  const saveMemo = () => {
    updateItem<Report>(STORAGE_KEYS.reports, r.id, { adminMemo: memo });
    onToast("관리자 메모를 저장했습니다.", "success");
  };

  const resolve = () =>
    updateItem<Report>(STORAGE_KEYS.reports, r.id, { status: "조치 완료" });

  const wrongTarget = () => onToast("대상 유형이 맞지 않습니다.", "info");

  const hideCase = () => {
    if (r.targetType !== "case_file") return wrongTarget();
    updateItem<CaseFile>(STORAGE_KEYS.cases, r.targetId, { isPublic: false });
    resolve();
    onToast("게시글을 숨김 처리했습니다.", "success");
  };

  const hideComment = () => {
    if (r.targetType !== "comment") return wrongTarget();
    softDeleteItem(STORAGE_KEYS.comments, r.targetId);
    resolve();
    onToast("댓글을 숨김 처리했습니다.", "success");
  };

  const warnUser = () => {
    if (r.targetType !== "user") return wrongTarget();
    const target = users.find((u) => u.id === r.targetId);
    updateItem<User>(STORAGE_KEYS.users, r.targetId, {
      status: "warned",
      warningCount: (target?.warningCount ?? 0) + 1,
    });
    resolve();
    onToast("유저에게 경고를 부여했습니다.", "success");
  };

  const restrictUser = () => {
    if (r.targetType !== "user") return wrongTarget();
    updateItem<User>(STORAGE_KEYS.users, r.targetId, { status: "restricted" });
    resolve();
    onToast("유저를 제한했습니다.", "success");
  };

  const banUser = () => {
    if (r.targetType !== "user") return wrongTarget();
    updateItem<User>(STORAGE_KEYS.users, r.targetId, { status: "banned" });
    resolve();
    onToast("유저를 차단했습니다.", "success");
  };

  const rejectReport = () => {
    updateItem<Report>(STORAGE_KEYS.reports, r.id, { status: "반려" });
    onToast("신고를 반려 처리했습니다.", "success");
  };

  return (
    <Modal open={!!report} onClose={onClose} title="신고 처리">
      <div className="space-y-4 text-sm">
        {/* 대상 정보 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <Info label="신고 대상" value={r.targetLabel} />
          <Info label="대상 유형" value={TARGET_TYPE_LABEL[r.targetType]} />
          <Info label="신고 사유" value={r.reason} />
          <Info label="신고자" value={r.reporterName} />
          <Info label="신고 횟수" value={String(r.reportCount)} />
        </div>

        {r.reportCount >= 3 && (
          <div className="rounded-lg border border-blood/40 bg-blood/5 p-3 text-xs text-blood-bright">
            누적 신고 {r.reportCount}건 — 우선 검토가 필요합니다.
          </div>
        )}

        {/* 처리 상태 변경 */}
        <div>
          <div className="field-label">처리 상태 변경</div>
          <div className="flex flex-wrap gap-1.5">
            {REPORT_STATUSES.map((st) => (
              <button
                key={st}
                onClick={() => changeStatus(st)}
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

        {/* 관리자 메모 */}
        <div>
          <TextArea
            label="관리자 메모"
            placeholder="검수 메모..."
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" size="sm" onClick={saveMemo}>
              메모 저장
            </Button>
          </div>
        </div>

        {/* 관리자 조치 */}
        <div className="border-t border-line pt-3">
          <div className="field-label">관리자 조치</div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled={r.targetType !== "case_file"}
              onClick={hideCase}
            >
              게시글 숨김
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={r.targetType !== "comment"}
              onClick={hideComment}
            >
              댓글 숨김
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={r.targetType !== "user"}
              onClick={warnUser}
            >
              유저 경고
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={r.targetType !== "user"}
              onClick={restrictUser}
            >
              유저 제한
            </Button>
            <Button
              size="sm"
              variant="danger"
              disabled={r.targetType !== "user"}
              onClick={banUser}
            >
              유저 차단
            </Button>
            <Button size="sm" variant="ghost" onClick={rejectReport}>
              신고 반려
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
