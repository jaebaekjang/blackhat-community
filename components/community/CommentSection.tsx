"use client";

import { useMemo, useState } from "react";
import { COMMENT_TYPES } from "@/types";
import type { Comment, User } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockComments, mockUsers } from "@/data";
import { useCollection, useCurrentUserId } from "@/hooks/useStorage";
import { createItem, updateItem } from "@/lib/storage";
import { generateId, nowISO, timeAgo } from "@/lib/utils";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SelectField, TextArea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export function CommentSection({ caseFileId }: { caseFileId: string }) {
  const { showToast } = useToast();
  const { data: comments } = useCollection<Comment>(STORAGE_KEYS.comments, mockComments);
  const { data: users } = useCollection<User>(STORAGE_KEYS.users, mockUsers);
  const { userId } = useCurrentUserId();

  const [type, setType] = useState<(typeof COMMENT_TYPES)[number]>(COMMENT_TYPES[0]);
  const [text, setText] = useState("");

  const list = useMemo(
    () =>
      comments
        .filter((c) => c.caseFileId === caseFileId)
        .sort((a, b) => Number(b.isBest) - Number(a.isBest) || b.likes - a.likes),
    [comments, caseFileId],
  );

  const submit = () => {
    if (!text.trim()) {
      showToast("해석을 입력해주세요.", "error");
      return;
    }
    const me = users.find((u) => u.id === userId);
    const ts = nowISO();
    const comment: Comment = {
      id: generateId("cmt"),
      caseFileId,
      userId,
      authorName: me?.nickname ?? "심야 청취자",
      type,
      content: text.trim(),
      likes: 0,
      isBest: false,
      createdAt: ts,
      updatedAt: ts,
    };
    createItem(STORAGE_KEYS.comments, comment);
    setText("");
    showToast("해석이 등록되었습니다. (+3 검은표식)", "success");
  };

  const like = (c: Comment) =>
    updateItem<Comment>(STORAGE_KEYS.comments, c.id, { likes: c.likes + 1 });

  return (
    <section>
      <SectionTitle title="청취자 해석" subtitle={`${list.length}개의 해석`} />

      <Card className="space-y-3">
        <SelectField label="해석 유형" options={COMMENT_TYPES} value={type}
          onChange={(e) => setType(e.target.value as (typeof COMMENT_TYPES)[number])} />
        <TextArea
          label="당신의 해석"
          placeholder="이 사건을 어떻게 해석하시나요?"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="flex justify-end">
          <Button onClick={submit}>해석 남기기</Button>
        </div>
      </Card>

      <div className="mt-4 space-y-3">
        {list.map((c) => (
          <Card key={c.id}>
            <div className="flex items-center gap-2">
              {c.isBest && <Badge variant="success">⭐ 베스트 해석</Badge>}
              <Badge variant="neutral">{c.type}</Badge>
              <span className="text-sm font-medium text-zinc-100">{c.authorName}</span>
              <span className="text-xs text-ash-faint">{timeAgo(c.createdAt)}</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-ash">{c.content}</p>
            <button
              onClick={() => like(c)}
              className="mt-2 text-xs text-ash-dim hover:text-blood-bright"
            >
              ❤️ 좋아요 {c.likes}
            </button>
          </Card>
        ))}
      </div>
    </section>
  );
}
