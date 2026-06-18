"use client";

import { useMemo, useState } from "react";
import { useCollection } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockCases, mockComments } from "@/data";
import type { CaseFile, Comment } from "@/types";
import { CaseCard } from "@/components/community/CaseCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const STATUS_FILTERS = [
  "전체",
  "미확인 제보",
  "접수됨",
  "검토 중",
  "방송 후보",
  "방송 완료",
  "해석 필요",
  "후속 제보 대기",
  "위험 파일",
  "칠죄빌라 연결 의심",
  "금지 파일",
];

const CATEGORY_FILTERS = [
  "전체",
  "친무썰",
  "실화 괴담",
  "나폴리탄",
  "칠죄빌라",
  "군대 괴담",
  "학교 괴담",
  "아파트 괴담",
  "창작 괴담",
];

const SORTS = ["최신순", "공포지수순", "방송 요청순", "댓글 많은 순"] as const;

export default function CasesPage() {
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);
  const { data: comments } = useCollection<Comment>(STORAGE_KEYS.comments, mockComments);

  const [status, setStatus] = useState("전체");
  const [category, setCategory] = useState("전체");
  const [sort, setSort] = useState<(typeof SORTS)[number]>("최신순");
  const [query, setQuery] = useState("");

  const commentCount = useMemo(() => {
    const map: Record<string, number> = {};
    comments.forEach((c) => (map[c.caseFileId] = (map[c.caseFileId] || 0) + 1));
    return map;
  }, [comments]);

  const filtered = useMemo(() => {
    let list = cases.filter((c) => c.isPublic);
    if (status !== "전체") list = list.filter((c) => c.status === status);
    if (category !== "전체") list = list.filter((c) => c.category === category);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.content.toLowerCase().includes(q) ||
          c.caseNumber.toLowerCase().includes(q),
      );
    }
    list = [...list];
    switch (sort) {
      case "공포지수순":
        list.sort((a, b) => b.fearScore - a.fearScore);
        break;
      case "방송 요청순":
        list.sort((a, b) => b.broadcastRequestCount - a.broadcastRequestCount);
        break;
      case "댓글 많은 순":
        list.sort((a, b) => (commentCount[b.id] || 0) - (commentCount[a.id] || 0));
        break;
      default:
        list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
    }
    return list;
  }, [cases, status, category, sort, query, commentCount]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">🗂️ 사건파일</h1>
        <p className="mt-1 text-sm text-ash">
          이곳에는 검은 모자 라디오국에 접수된 모든 미확인 기록이 보관됩니다.
        </p>
      </div>

      {/* 검색 */}
      <input
        className="field"
        placeholder="🔍 사건번호, 제목, 내용 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      {/* 필터 */}
      <div className="space-y-2">
        <FilterRow values={STATUS_FILTERS} active={status} onChange={setStatus} />
        <FilterRow values={CATEGORY_FILTERS} active={category} onChange={setCategory} />
        <div className="flex flex-wrap gap-1.5">
          {SORTS.map((s) => (
            <button
              key={s}
              onClick={() => setSort(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs",
                sort === s
                  ? "border-line-strong bg-surface-alt text-zinc-100"
                  : "border-line text-ash-dim hover:text-zinc-100",
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <p className="text-xs text-ash-faint">총 {filtered.length}건</p>

      {filtered.length === 0 ? (
        <EmptyState
          title="해당 조건의 사건파일이 없습니다."
          description="필터를 바꾸거나 검은 제보함에 새로운 이야기를 남겨주세요."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((c) => (
            <CaseCard key={c.id} caseFile={c} commentCount={commentCount[c.id] || 0} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterRow({
  values,
  active,
  onChange,
}: {
  values: string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors",
            active === v
              ? "border-blood/50 bg-blood/15 text-blood-bright"
              : "border-line text-ash-dim hover:text-zinc-100",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
