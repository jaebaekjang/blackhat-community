"use client";

import { useMemo, useState } from "react";
import { useCollection, useCurrentUserId } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockWriterWorks, mockUsers } from "@/data";
import { CATEGORIES, WRITER_GRADES } from "@/types";
import type { WriterWork, User, Category } from "@/types";
import { createItem, updateItem } from "@/lib/storage";
import { generateId, nowISO } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { TextField, TextArea, SelectField } from "@/components/ui/Field";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

const CONTESTS = [
  {
    title: "나폴리탄 공모전",
    description:
      "설명할 수 없는 위화감, 끝내 해소되지 않는 찝찝함. 나폴리탄 괴담을 모집합니다.",
  },
  {
    title: "칠죄빌라 외전 공모",
    description:
      "칠죄빌라 세계관의 새로운 호실, 새로운 입주자. 외전 에피소드를 모집합니다.",
  },
  {
    title: "친무썰 각색 공모",
    description:
      "검은 모자가 낭독할 친무썰. 실화처럼 들리는 각색본을 모집합니다.",
  },
] as const;

const FORM_ID = "writer-work-form";

export default function WritersPage() {
  const { showToast } = useToast();
  const { data: works } = useCollection<WriterWork>(STORAGE_KEYS.writerWorks, mockWriterWorks);
  const { data: users } = useCollection<User>(STORAGE_KEYS.users, mockUsers);
  const { userId } = useCurrentUserId();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState<Category>(CATEGORIES[0]);
  const [content, setContent] = useState("");

  const me = useMemo(() => users.find((u) => u.id === userId), [users, userId]);

  // 베스트 작가 랭킹: authorName 별 추천수 합산
  const ranking = useMemo(() => {
    const map = new Map<
      string,
      { authorName: string; total: number; grade: WriterWork["authorGrade"]; latest: number }
    >();
    works.forEach((w) => {
      const ts = new Date(w.updatedAt).getTime();
      const prev = map.get(w.authorName);
      if (!prev) {
        map.set(w.authorName, {
          authorName: w.authorName,
          total: w.recommendationCount,
          grade: w.authorGrade,
          latest: ts,
        });
      } else {
        prev.total += w.recommendationCount;
        if (ts >= prev.latest) {
          prev.latest = ts;
          prev.grade = w.authorGrade;
        }
      }
    });
    return [...map.values()].sort((a, b) => b.total - a.total).slice(0, 5);
  }, [works]);

  const officialCandidates = useMemo(
    () => works.filter((w) => w.status === "공식 낭독 후보" || w.status === "채택"),
    [works],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      showToast("제목과 본문을 입력해주세요.", "error");
      return;
    }
    const ts = nowISO();
    const work: WriterWork = {
      id: generateId("work"),
      title: title.trim(),
      authorId: userId,
      authorName: me?.nickname ?? "심야 작가",
      authorGrade: "신입 작가",
      genre,
      content: content.trim(),
      fearScore: 50,
      recommendationCount: 0,
      status: "접수됨",
      createdAt: ts,
      updatedAt: ts,
    };
    createItem(STORAGE_KEYS.writerWorks, work);
    showToast("창작 괴담이 접수되었습니다.", "success");
    setTitle("");
    setGenre(CATEGORIES[0]);
    setContent("");
  };

  const handleRecommend = (w: WriterWork) => {
    updateItem<WriterWork>(STORAGE_KEYS.writerWorks, w.id, {
      recommendationCount: w.recommendationCount + 1,
    });
    showToast("추천했습니다.", "success");
  };

  const scrollToForm = () => {
    if (typeof document !== "undefined") {
      document.getElementById(FORM_ID)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    showToast("응모 폼에 작성해주세요.", "info");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">✒️ 작가실</h1>
        <p className="mt-1 text-sm text-ash">
          당신이 쓴 창작 괴담이 검은 모자의 목소리로 낭독될 수 있습니다.
        </p>
      </div>

      {/* 작가 등급 안내 */}
      <Card className="border-blood/20 bg-blood/5">
        <SectionTitle title="작가 등급" subtitle="추천과 채택을 통해 등급이 올라갑니다." />
        <div className="flex flex-wrap gap-1.5">
          {WRITER_GRADES.map((g) => (
            <Badge key={g} variant="info">
              {g}
            </Badge>
          ))}
        </div>
      </Card>

      {/* 공모전 */}
      <section>
        <SectionTitle title="진행 중인 공모전" subtitle="원하는 공모에 창작 괴담을 응모하세요." />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {CONTESTS.map((c) => (
            <Card key={c.title} className="flex flex-col justify-between">
              <div>
                <div className="text-sm font-semibold text-zinc-100">{c.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-ash-dim">{c.description}</p>
              </div>
              <div className="mt-3">
                <Button variant="secondary" size="sm" onClick={scrollToForm}>
                  응모하기
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* 창작 괴담 업로드 폼 */}
      <section id={FORM_ID}>
        <SectionTitle title="창작 괴담 업로드" subtitle="새로운 작품을 작가실에 등록합니다." />
        <form onSubmit={handleSubmit}>
          <Card className="space-y-4">
            <TextField
              label="제목"
              required
              placeholder="작품의 제목을 입력하세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <SelectField
              label="장르"
              options={CATEGORIES}
              value={genre}
              onChange={(e) => setGenre(e.target.value as Category)}
            />
            <TextArea
              label="본문"
              required
              placeholder="당신의 창작 괴담을 적어주세요..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="flex justify-end">
              <Button type="submit">작가실에 등록</Button>
            </div>
          </Card>
        </form>
      </section>

      {/* 베스트 작가 랭킹 */}
      <section>
        <SectionTitle title="베스트 작가 랭킹" subtitle="누적 추천수 기준 상위 작가" />
        {ranking.length === 0 ? (
          <EmptyState icon="✒️" title="아직 랭킹이 없습니다." />
        ) : (
          <Card className="divide-y divide-line">
            {ranking.map((r, i) => (
              <div key={r.authorName} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                <div className="flex items-center gap-3">
                  <span className="w-6 text-center text-sm font-bold tabular-nums text-blood-bright">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-zinc-100">{r.authorName}</div>
                    <Badge variant="info" className="mt-0.5">
                      {r.grade}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold tabular-nums text-zinc-100">
                    {r.total.toLocaleString("ko-KR")}
                  </div>
                  <div className="text-xs text-ash-faint">총 추천</div>
                </div>
              </div>
            ))}
          </Card>
        )}
      </section>

      {/* 공식 낭독 후보 */}
      <section>
        <SectionTitle title="공식 낭독 후보" subtitle="검은 모자가 낭독을 검토 중인 작품" />
        {officialCandidates.length === 0 ? (
          <EmptyState icon="🎙️" title="아직 공식 낭독 후보가 없습니다." />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {officialCandidates.map((w) => (
              <Card key={w.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-zinc-100">{w.title}</div>
                  <div className="text-xs text-ash-dim">{w.authorName}</div>
                </div>
                <StatusBadge status={w.status} />
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 작품 목록 */}
      <section>
        <SectionTitle title="작가실 작품" subtitle={`총 ${works.length}편`} />
        {works.length === 0 ? (
          <EmptyState
            icon="✒️"
            title="아직 등록된 작품이 없습니다."
            description="위 폼에서 첫 창작 괴담을 등록해보세요."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {works.map((w) => (
              <Card key={w.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-base font-semibold text-zinc-100">{w.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-ash-dim">{w.authorName}</span>
                      <Badge variant="info">{w.authorGrade}</Badge>
                      <Badge variant="neutral">{w.genre}</Badge>
                    </div>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
                <p className="line-clamp-3 text-sm leading-relaxed text-ash">{w.content}</p>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-xs text-ash-faint">
                    <span>공포지수 {w.fearScore}</span>
                    <span>추천 {w.recommendationCount.toLocaleString("ko-KR")}</span>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => handleRecommend(w)}>
                    👍 추천
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
