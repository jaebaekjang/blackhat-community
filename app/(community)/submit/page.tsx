"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CATEGORIES,
  STORY_TYPES,
  LOCATION_TYPES,
  REGIONS,
  FEAR_LEVELS,
  BROADCAST_WISHES,
} from "@/types";
import type {
  AdminSettings,
  CaseFile,
  Submission,
  User,
  Category,
  StoryType,
  LocationType,
  Region,
  FearLevel,
  BroadcastWish,
} from "@/types";

interface SubmitForm {
  title: string;
  category: Category;
  storyType: StoryType;
  locationType: LocationType;
  region: Region;
  content: string;
  fearLevel: FearLevel;
  broadcastWish: BroadcastWish;
  isAnonymous: boolean;
  broadcastConsent: boolean;
  privacyConsent: boolean;
  editConsent: boolean;
}
import { STORAGE_KEYS } from "@/lib/constants";
import { mockCases, mockUsers, mockSettings } from "@/data";
import { useCollection, useStorageValue, useCurrentUserId } from "@/hooks/useStorage";
import { createItem } from "@/lib/storage";
import { generateId, generateCaseNumber, nowISO } from "@/lib/utils";
import { detectRiskKeywords } from "@/lib/risk";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField, TextArea, SelectField, Toggle } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";

export default function SubmitPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);
  const { data: users } = useCollection<User>(STORAGE_KEYS.users, mockUsers);
  const { value: settings } = useStorageValue<AdminSettings>(STORAGE_KEYS.settings, mockSettings);
  const { userId } = useCurrentUserId();

  const [form, setForm] = useState<SubmitForm>({
    title: "",
    category: CATEGORIES[0],
    storyType: STORY_TYPES[0],
    locationType: LOCATION_TYPES[0],
    region: REGIONS[0],
    content: "",
    fearLevel: FEAR_LEVELS[1],
    broadcastWish: BROADCAST_WISHES[0],
    isAnonymous: false,
    broadcastConsent: true,
    privacyConsent: true,
    editConsent: true,
  });

  const set = <K extends keyof SubmitForm>(k: K, v: SubmitForm[K]) =>
    setForm((prev) => ({ ...prev, [k]: v }));

  const risk = useMemo(
    () => detectRiskKeywords(`${form.title} ${form.content}`, settings.privacyRiskKeywords),
    [form.title, form.content, settings.privacyRiskKeywords],
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      showToast("제목과 본문을 입력해주세요.", "error");
      return;
    }
    if (!form.privacyConsent) {
      showToast("개인정보 제외 동의가 필요합니다.", "error");
      return;
    }

    const me = users.find((u) => u.id === userId);
    const authorName = form.isAnonymous ? "익명" : me?.nickname ?? "심야 청취자";
    const ts = nowISO();
    const submissionId = generateId("sub");
    const caseId = generateId("case");
    const caseNumber = generateCaseNumber(cases.length);

    const submission: Submission = {
      id: submissionId,
      title: form.title.trim(),
      category: form.category,
      storyType: form.storyType,
      locationType: form.locationType,
      region: form.region,
      content: form.content.trim(),
      authorId: form.isAnonymous ? null : userId,
      authorName,
      isAnonymous: form.isAnonymous,
      fearLevel: form.fearLevel,
      broadcastWish: form.broadcastWish,
      broadcastConsent: form.broadcastConsent,
      editConsent: form.editConsent,
      privacyConsent: form.privacyConsent,
      status: settings.defaultSubmissionStatus,
      riskLevel: risk.level,
      detectedRiskKeywords: risk.matched,
      caseFileId: caseId,
      createdAt: ts,
      updatedAt: ts,
    };

    const caseFile: CaseFile = {
      id: caseId,
      submissionId,
      caseNumber,
      title: form.title.trim(),
      category: form.category,
      storyType: form.storyType,
      locationType: form.locationType,
      region: form.region,
      content: form.content.trim(),
      authorId: form.isAnonymous ? null : userId,
      authorName,
      isAnonymous: form.isAnonymous,
      status: "접수됨",
      fearScore: 40,
      realismScore: 40,
      uneaseScore: 40,
      broadcastRequestCount: 0,
      chillsCount: 0,
      saveCount: 0,
      relatedVideoUrl: null,
      tags: [form.category],
      isPublic: settings.autoPublishSubmissions,
      isLocked: false,
      createdAt: ts,
      updatedAt: ts,
    };

    createItem(STORAGE_KEYS.submissions, submission);
    createItem(STORAGE_KEYS.cases, caseFile);

    showToast(`제보가 접수되었습니다. 사건번호 ${caseNumber}`, "success");
    router.push(`/cases/${caseId}`);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">🖤 검은 제보함</h1>
        <p className="mt-1 text-sm text-ash">
          당신이 겪었거나 들은 이야기를 남겨주세요. 검은 모자가 읽을 수 있습니다.
        </p>
      </div>

      {/* 개인정보 경고 (반드시 표시) */}
      <Card className="border-blood/40 bg-blood/5">
        <div className="flex gap-2 text-sm text-ash">
          <span className="text-blood-bright">⚠️</span>
          <p className="leading-relaxed">
            실명, 정확한 주소, 전화번호, 학교명, 회사명 등 특정 가능한 개인정보는
            작성하지 마세요. 검은 모자 라디오국은 제보자의 익명성과 타인의 권리를
            보호하기 위해 일부 내용을 비공개 또는 수정할 수 있습니다.
          </p>
        </div>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Card className="space-y-4">
          <TextField
            label="제목"
            required
            placeholder="사건의 제목을 입력하세요"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="카테고리"
              options={CATEGORIES}
              value={form.category}
              onChange={(e) => set("category", e.target.value as (typeof CATEGORIES)[number])}
            />
            <SelectField
              label="사건 유형"
              options={STORY_TYPES}
              value={form.storyType}
              onChange={(e) => set("storyType", e.target.value as (typeof STORY_TYPES)[number])}
            />
            <SelectField
              label="발생 장소 유형"
              options={LOCATION_TYPES}
              value={form.locationType}
              onChange={(e) => set("locationType", e.target.value as (typeof LOCATION_TYPES)[number])}
            />
            <SelectField
              label="지역"
              options={REGIONS}
              value={form.region}
              onChange={(e) => set("region", e.target.value as (typeof REGIONS)[number])}
            />
          </div>

          <div>
            <TextArea
              label="본문"
              required
              placeholder="무슨 일이 있었는지 적어주세요..."
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
            />
            {/* 실시간 개인정보 위험 감지 */}
            {risk.matched.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-blood/40 bg-blood/5 p-2 text-xs">
                <Badge variant="danger" dot>
                  개인정보 위험 {risk.level}
                </Badge>
                <span className="text-ash-dim">감지된 패턴:</span>
                {risk.matched.map((m) => (
                  <span key={m} className="text-blood-bright">
                    {m}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SelectField
              label="공포 정도"
              options={FEAR_LEVELS}
              value={form.fearLevel}
              onChange={(e) => set("fearLevel", e.target.value as (typeof FEAR_LEVELS)[number])}
            />
            <SelectField
              label="방송 희망 여부"
              options={BROADCAST_WISHES}
              value={form.broadcastWish}
              onChange={(e) =>
                set("broadcastWish", e.target.value as (typeof BROADCAST_WISHES)[number])
              }
            />
          </div>
        </Card>

        <Card className="space-y-3">
          <SectionTitle title="동의 항목" subtitle="제보 처리를 위한 동의가 필요합니다." />
          <Toggle
            checked={form.isAnonymous}
            onChange={(v) => set("isAnonymous", v)}
            label="익명으로 제보하기"
          />
          <Toggle
            checked={form.broadcastConsent}
            onChange={(v) => set("broadcastConsent", v)}
            label="방송 사용 동의 (검은 모자가 방송에서 다룰 수 있음)"
          />
          <Toggle
            checked={form.editConsent}
            onChange={(v) => set("editConsent", v)}
            label="일부 각색 가능 동의"
          />
          <Toggle
            checked={form.privacyConsent}
            onChange={(v) => set("privacyConsent", v)}
            label="개인정보 제외 동의 (필수)"
          />
        </Card>

        <div className="flex justify-end gap-2">
          <Button type="submit" size="lg">
            검은 제보함에 넣기
          </Button>
        </div>
      </form>
    </div>
  );
}
