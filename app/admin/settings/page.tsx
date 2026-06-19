"use client";

import { useMemo, useRef, useState } from "react";
import { SUBMISSION_STATUSES } from "@/types";
import type { AdminSettings, YouTubeSettings, YouTubeLatestResponse } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockSettings } from "@/data";
import { useStorageValue } from "@/hooks/useStorage";
import {
  DEFAULT_YOUTUBE_SETTINGS,
  exportAllData,
  importAllData,
  resetMockData,
  clearAllData,
  getDataCounts,
  setData,
  type ExportShape,
} from "@/lib/storage";
import { downloadJson, readJsonFile, nowISO, formatDateTime } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TextField, TextArea, SelectField, Toggle } from "@/components/ui/Field";
import { ConfirmDialog } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

export default function AdminSettingsPage() {
  const { showToast } = useToast();
  const { value: settings } = useStorageValue<AdminSettings>(STORAGE_KEYS.settings, mockSettings);
  const { value: yt } = useStorageValue<YouTubeSettings>(STORAGE_KEYS.youtubeSettings, DEFAULT_YOUTUBE_SETTINGS);

  const [draft, setDraft] = useState<AdminSettings | null>(null);
  const [confirm, setConfirm] = useState<null | "reset" | "clear">(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const s = draft ?? settings;
  const set = <K extends keyof AdminSettings>(k: K, v: AdminSettings[K]) =>
    setDraft({ ...s, [k]: v });

  const counts = useMemo(() => getDataCounts(), [settings, yt]);
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  const saveSettings = () => {
    const next: AdminSettings = { ...s, updatedAt: nowISO() };
    setData(STORAGE_KEYS.settings, next);
    // YouTube 관련 일부를 youtubeSettings 와도 동기화
    setData(STORAGE_KEYS.youtubeSettings, {
      ...yt,
      channelId: next.youtubeChannelId,
      apiKey: next.youtubeApiKey,
      uploadsPlaylistId: next.youtubeUploadsPlaylistId,
      homeDisplayCount: next.youtubeHomeDisplayCount,
      syncIntervalMinutes: next.youtubeSyncInterval,
    });
    setDraft(null);
    showToast("설정을 저장했습니다.", "success");
  };

  const handleExport = () => {
    downloadJson(`blackhat-export-${Date.now()}.json`, exportAllData());
    showToast("전체 데이터를 Export 했습니다.", "success");
  };

  const handleImportFile = async (file: File) => {
    try {
      const data = await readJsonFile<Partial<ExportShape>>(file);
      importAllData(data);
      showToast("데이터를 Import 했습니다.", "success");
    } catch {
      showToast("JSON 파싱에 실패했습니다.", "error");
    }
  };

  const fetchLatest = async () => {
    try {
      const params = new URLSearchParams({ limit: String(s.youtubeHomeDisplayCount || 6) });
      if (s.youtubeChannelId) params.set("channelId", s.youtubeChannelId);
      const res = await fetch(`/api/youtube/latest?${params.toString()}`);
      const data = (await res.json()) as YouTubeLatestResponse;
      setData(STORAGE_KEYS.youtubeVideos, data.videos);
      const syncedAt = nowISO();
      setData(STORAGE_KEYS.settings, { ...settings, youtubeLastSyncedAt: syncedAt, updatedAt: syncedAt });
      setData(STORAGE_KEYS.youtubeSettings, { ...yt, lastSyncedAt: syncedAt });
      showToast(`최신 영상 ${data.videos.length}개를 불러왔습니다. (${data.source})`, "success");
    } catch {
      showToast("최신 영상 불러오기에 실패했습니다.", "error");
    }
  };

  const clearYtCache = () => {
    setData(STORAGE_KEYS.youtubeVideos, []);
    setData(STORAGE_KEYS.settings, { ...settings, youtubeLastSyncedAt: null });
    showToast("YouTube 캐시를 초기화했습니다.", "info");
  };

  return (
    <div>
      <AdminPageHeader
        title="설정"
        description="사이트 운영 설정과 데이터 이전(Export/Import)을 관리합니다."
        actions={
          draft ? (
            <>
              <Button size="sm" variant="ghost" onClick={() => setDraft(null)}>취소</Button>
              <Button size="sm" onClick={saveSettings}>설정 저장</Button>
            </>
          ) : undefined
        }
      />

      {/* 운영 설정 */}
      <SectionTitle title="운영 설정" />
      <Card className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="사이트 이름" value={s.siteName} onChange={(e) => set("siteName", e.target.value)} />
          <TextField label="운영자 닉네임" value={s.operatorName} onChange={(e) => set("operatorName", e.target.value)} />
          <SelectField label="제보 기본 상태" options={SUBMISSION_STATUSES} value={s.defaultSubmissionStatus} onChange={(e) => set("defaultSubmissionStatus", e.target.value as AdminSettings["defaultSubmissionStatus"])} />
          <TextField label="신고 누적 자동 숨김 기준" type="number" value={s.reportHideThreshold} onChange={(e) => set("reportHideThreshold", Number(e.target.value))} />
          <TextField label="방송 요청 기준" type="number" value={s.broadcastRequestThreshold} onChange={(e) => set("broadcastRequestThreshold", Number(e.target.value))} />
        </div>
        <div className="flex flex-wrap gap-6">
          <Toggle checked={s.autoPublishSubmissions} onChange={(v) => set("autoPublishSubmissions", v)} label="제보 자동 공개" />
          <Toggle checked={s.autoPublishComments} onChange={(v) => set("autoPublishComments", v)} label="댓글 자동 공개" />
          <Toggle checked={s.membershipLockEnabled} onChange={(v) => set("membershipLockEnabled", v)} label="멤버십 잠금 기능" />
        </div>
        <TextArea label="금지어 목록 (쉼표 구분)" value={s.forbiddenKeywords.join(", ")} onChange={(e) => set("forbiddenKeywords", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
        <TextArea label="개인정보 위험 키워드 목록 (쉼표 구분)" value={s.privacyRiskKeywords.join(", ")} onChange={(e) => set("privacyRiskKeywords", e.target.value.split(",").map((x) => x.trim()).filter(Boolean))} />
      </Card>

      {/* YouTube 연동 */}
      <SectionTitle title="YouTube 연동 설정" className="mt-6" />
      <Card className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TextField label="YouTube 채널 ID" value={s.youtubeChannelId} onChange={(e) => set("youtubeChannelId", e.target.value)} />
          <TextField label="YouTube API Key (선택)" value={s.youtubeApiKey} onChange={(e) => set("youtubeApiKey", e.target.value)} placeholder="비워두면 RSS → mock fallback" />
          <TextField label="Uploads Playlist ID (선택)" value={s.youtubeUploadsPlaylistId} onChange={(e) => set("youtubeUploadsPlaylistId", e.target.value)} />
          <TextField label="홈 화면 영상 표시 개수" type="number" value={s.youtubeHomeDisplayCount} onChange={(e) => set("youtubeHomeDisplayCount", Number(e.target.value))} />
          <TextField label="자동 갱신 주기 (분)" type="number" value={s.youtubeSyncInterval} onChange={(e) => set("youtubeSyncInterval", Number(e.target.value))} />
        </div>
        <div className="text-xs text-ash-faint">
          마지막 동기화: {settings.youtubeLastSyncedAt ? formatDateTime(settings.youtubeLastSyncedAt) : "미동기화"}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={fetchLatest}>지금 최신 영상 불러오기</Button>
          <Button size="sm" variant="ghost" onClick={clearYtCache}>최신 영상 캐시 초기화</Button>
        </div>
      </Card>

      {/* 데이터 관리 */}
      <SectionTitle title="데이터 관리 / DB 이전" className="mt-6" />
      <Card className="space-y-4">
        <div className="rounded-lg border border-line bg-ink-800 p-3">
          <div className="mb-2 text-xs text-ash-dim">현재 데이터 개수 (총 {totalCount}건)</div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(counts).map(([k, v]) => (
              <span key={k} className="rounded border border-line px-1.5 py-0.5 text-[11px] text-ash">
                {k}: <b className="text-zinc-100">{v}</b>
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={handleExport}>⬇ 전체 데이터 JSON Export</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>⬆ JSON Import</Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImportFile(f);
              e.target.value = "";
            }}
          />
          <a href="/database-schema.md" target="_blank" rel="noopener noreferrer">
            <Button variant="ghost">📄 DB 이전 문서 열기</Button>
          </a>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-line pt-4">
          <Button variant="danger" onClick={() => setConfirm("reset")}>mock 데이터 초기화</Button>
          <Button variant="danger" onClick={() => setConfirm("clear")}>localStorage 전체 초기화</Button>
        </div>
        <p className="text-xs text-ash-faint">
          ⚠️ 초기화는 되돌릴 수 없습니다. 먼저 Export 로 백업하세요.
        </p>
      </Card>

      <ConfirmDialog
        open={confirm === "reset"}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          resetMockData();
          showToast("mock 데이터를 초기화했습니다.", "success");
        }}
        title="mock 데이터를 초기화할까요?"
        description="모든 컬렉션이 초기 mock 데이터로 되돌아갑니다. (관리자 모드/현재 유저는 유지)"
        confirmLabel="초기화"
      />
      <ConfirmDialog
        open={confirm === "clear"}
        onClose={() => setConfirm(null)}
        onConfirm={() => {
          clearAllData();
          showToast("localStorage 를 전체 초기화했습니다.", "success");
        }}
        title="localStorage 를 전체 초기화할까요?"
        description="blackhat_* 키가 모두 삭제됩니다. 새로고침 시 mock 데이터가 다시 시드됩니다."
        confirmLabel="전체 삭제"
      />
    </div>
  );
}
