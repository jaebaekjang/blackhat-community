/**
 * 검은 모자 라디오국 - localStorage 기반 mock DB
 *
 * ⚠️ 컴포넌트는 localStorage 에 직접 접근하지 않는다. 반드시 이 파일을 통한다.
 *
 * 설계 원칙
 *  - SSR 안전: window 가 없으면 fallback 을 반환한다.
 *  - 모든 컬렉션은 배열([])로 저장된다. (DB 의 테이블/로우에 대응)
 *  - 쓰기 시 "blackhat:storage" 커스텀 이벤트를 발생시켜 UI 가 반응할 수 있게 한다.
 *  - 삭제는 즉시 삭제하지 않고 softDeleteItem(deletedAt) 으로 처리한다.
 *  - Export/Import 의 키(camelCase)와 실제 localStorage 키(blackhat_*)의 매핑은
 *    SEED_REGISTRY 한 곳에서 관리한다. (docs/database-schema.md 와 동일)
 */

import { STORAGE_KEYS, DEFAULT_YOUTUBE_CHANNEL_ID } from "./constants";
import { nowISO } from "./utils";
import {
  mockUsers,
  mockSubmissions,
  mockCases,
  mockComments,
  mockBadges,
  mockUserBadges,
  mockMemberships,
  mockRadioRooms,
  mockForbiddenZoneItems,
  mockWriterWorks,
  mockProducts,
  mockAdminNotes,
  mockReports,
  mockNotices,
  mockSettings,
  mockContentPipelineItems,
  mockYouTubeVideos,
} from "@/data";
import type {
  AdminSettings,
  Badge,
  CaseFile,
  Comment,
  ContentPipelineItem,
  ForbiddenZoneItem,
  MembershipTier,
  Notice,
  Product,
  RadioRoom,
  Report,
  Submission,
  User,
  UserBadge,
  WriterWork,
  YouTubeSettings,
  YouTubeVideo,
} from "@/types";

// ---------------------------------------------------------------------------
// 기본값
// ---------------------------------------------------------------------------

export const DEFAULT_YOUTUBE_SETTINGS: YouTubeSettings = {
  channelId: DEFAULT_YOUTUBE_CHANNEL_ID,
  apiKey: "",
  uploadsPlaylistId: "",
  homeDisplayCount: 6,
  syncIntervalMinutes: 60,
  lastSyncedAt: null,
};

export const DEFAULT_CURRENT_USER_ID = "user-1";

/** Export/Import JSON 의 형태 */
export interface ExportShape {
  users: User[];
  submissions: Submission[];
  caseFiles: CaseFile[];
  comments: Comment[];
  badges: Badge[];
  userBadges: UserBadge[];
  memberships: MembershipTier[];
  radioRooms: RadioRoom[];
  forbiddenZoneItems: ForbiddenZoneItem[];
  writerWorks: WriterWork[];
  products: Product[];
  adminNotes: import("@/types").AdminNote[];
  reports: Report[];
  notices: Notice[];
  contentPipelineItems: ContentPipelineItem[];
  youtubeVideos: YouTubeVideo[];
  settings: AdminSettings;
  youtubeSettings: YouTubeSettings;
}

/** 컬렉션(배열) 시드 레지스트리: export 키 ↔ localStorage 키 ↔ mock 시드 */
const SEED_REGISTRY: ReadonlyArray<{
  exportKey: keyof ExportShape;
  storageKey: string;
  seed: unknown[];
}> = [
  { exportKey: "users", storageKey: STORAGE_KEYS.users, seed: mockUsers },
  { exportKey: "submissions", storageKey: STORAGE_KEYS.submissions, seed: mockSubmissions },
  { exportKey: "caseFiles", storageKey: STORAGE_KEYS.cases, seed: mockCases },
  { exportKey: "comments", storageKey: STORAGE_KEYS.comments, seed: mockComments },
  { exportKey: "badges", storageKey: STORAGE_KEYS.badges, seed: mockBadges },
  { exportKey: "userBadges", storageKey: STORAGE_KEYS.userBadges, seed: mockUserBadges },
  { exportKey: "memberships", storageKey: STORAGE_KEYS.memberships, seed: mockMemberships },
  { exportKey: "radioRooms", storageKey: STORAGE_KEYS.radioRooms, seed: mockRadioRooms },
  { exportKey: "forbiddenZoneItems", storageKey: STORAGE_KEYS.forbiddenZone, seed: mockForbiddenZoneItems },
  { exportKey: "writerWorks", storageKey: STORAGE_KEYS.writerWorks, seed: mockWriterWorks },
  { exportKey: "products", storageKey: STORAGE_KEYS.products, seed: mockProducts },
  { exportKey: "adminNotes", storageKey: STORAGE_KEYS.adminNotes, seed: mockAdminNotes },
  { exportKey: "reports", storageKey: STORAGE_KEYS.reports, seed: mockReports },
  { exportKey: "notices", storageKey: STORAGE_KEYS.notices, seed: mockNotices },
  { exportKey: "contentPipelineItems", storageKey: STORAGE_KEYS.contentPipelineItems, seed: mockContentPipelineItems },
  { exportKey: "youtubeVideos", storageKey: STORAGE_KEYS.youtubeVideos, seed: mockYouTubeVideos },
];

// ---------------------------------------------------------------------------
// 기본 read/write
// ---------------------------------------------------------------------------

export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function getData<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setData<T>(key: string, data: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(
      new CustomEvent("blackhat:storage", { detail: { key } }),
    );
  } catch {
    // 용량 초과 등은 무시 (프로토타입)
  }
}

/** soft delete 된 항목을 제외하고 살아있는 컬렉션만 반환 */
export function listAlive<T extends { deletedAt?: string | null }>(
  key: string,
  seed: T[],
): T[] {
  return getData<T[]>(key, seed).filter((item) => !item.deletedAt);
}

// ---------------------------------------------------------------------------
// 컬렉션 CRUD (배열 대상)
// ---------------------------------------------------------------------------

export function createItem<T extends { id: string }>(key: string, item: T): void {
  const list = getData<T[]>(key, []);
  setData(key, [item, ...list]);
}

export function updateItem<T extends { id: string }>(
  key: string,
  id: string,
  updates: Partial<T>,
): void {
  const list = getData<T[]>(key, []);
  setData(
    key,
    list.map((item) =>
      item.id === id ? { ...item, ...updates, updatedAt: nowISO() } : item,
    ),
  );
}

export function softDeleteItem(key: string, id: string): void {
  const list = getData<Array<{ id: string; deletedAt?: string | null; updatedAt?: string }>>(
    key,
    [],
  );
  setData(
    key,
    list.map((item) =>
      item.id === id ? { ...item, deletedAt: nowISO(), updatedAt: nowISO() } : item,
    ),
  );
}

// ---------------------------------------------------------------------------
// 초기화 / 리셋 / 전체 삭제
// ---------------------------------------------------------------------------

/** 비어 있는 키만 mock 으로 시드한다. (기존 사용자 편집 보존) */
export function initializeMockData(): void {
  if (!isBrowser()) return;
  for (const { storageKey, seed } of SEED_REGISTRY) {
    if (window.localStorage.getItem(storageKey) === null) {
      setData(storageKey, seed);
    }
  }
  if (window.localStorage.getItem(STORAGE_KEYS.settings) === null) {
    setData(STORAGE_KEYS.settings, mockSettings);
  }
  if (window.localStorage.getItem(STORAGE_KEYS.youtubeSettings) === null) {
    setData(STORAGE_KEYS.youtubeSettings, DEFAULT_YOUTUBE_SETTINGS);
  }
  if (window.localStorage.getItem(STORAGE_KEYS.adminMode) === null) {
    setData(STORAGE_KEYS.adminMode, false);
  }
  if (window.localStorage.getItem(STORAGE_KEYS.currentUser) === null) {
    setData(STORAGE_KEYS.currentUser, DEFAULT_CURRENT_USER_ID);
  }
}

/** mock 데이터를 강제로 다시 시드한다. (관리자 모드/현재 유저는 유지) */
export function resetMockData(): void {
  if (!isBrowser()) return;
  for (const { storageKey, seed } of SEED_REGISTRY) {
    setData(storageKey, seed);
  }
  setData(STORAGE_KEYS.settings, mockSettings);
  setData(STORAGE_KEYS.youtubeSettings, DEFAULT_YOUTUBE_SETTINGS);
}

/** localStorage 의 blackhat_* 키를 모두 제거한다. */
export function clearAllData(): void {
  if (!isBrowser()) return;
  Object.values(STORAGE_KEYS).forEach((k) => window.localStorage.removeItem(k));
  window.dispatchEvent(new CustomEvent("blackhat:storage", { detail: { key: "*" } }));
}

// ---------------------------------------------------------------------------
// Export / Import
// ---------------------------------------------------------------------------

export function exportAllData(): ExportShape {
  const out: Record<string, unknown> = {};
  for (const { exportKey, storageKey, seed } of SEED_REGISTRY) {
    out[exportKey] = getData(storageKey, seed);
  }
  out.settings = getData(STORAGE_KEYS.settings, mockSettings);
  out.youtubeSettings = getData(STORAGE_KEYS.youtubeSettings, DEFAULT_YOUTUBE_SETTINGS);
  return out as unknown as ExportShape;
}

export function importAllData(data: Partial<ExportShape>): void {
  for (const { exportKey, storageKey } of SEED_REGISTRY) {
    const value = data[exportKey];
    if (value !== undefined) setData(storageKey, value);
  }
  if (data.settings) setData(STORAGE_KEYS.settings, data.settings);
  if (data.youtubeSettings) setData(STORAGE_KEYS.youtubeSettings, data.youtubeSettings);
}

/** 현재 저장된 데이터 개수 (설정 화면 표시용) */
export function getDataCounts(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const { exportKey, storageKey, seed } of SEED_REGISTRY) {
    counts[exportKey] = getData<unknown[]>(storageKey, seed as unknown[]).length;
  }
  return counts;
}

// ---------------------------------------------------------------------------
// 세션 / 설정 헬퍼
// ---------------------------------------------------------------------------

export function getAdminMode(): boolean {
  return getData<boolean>(STORAGE_KEYS.adminMode, false);
}

export function setAdminMode(value: boolean): void {
  setData(STORAGE_KEYS.adminMode, value);
}

export function getCurrentUserId(): string {
  return getData<string>(STORAGE_KEYS.currentUser, DEFAULT_CURRENT_USER_ID);
}

export function setCurrentUserId(id: string): void {
  setData(STORAGE_KEYS.currentUser, id);
}

export function getSettings(): AdminSettings {
  return getData<AdminSettings>(STORAGE_KEYS.settings, mockSettings);
}

export function getYouTubeSettings(): YouTubeSettings {
  return getData<YouTubeSettings>(STORAGE_KEYS.youtubeSettings, DEFAULT_YOUTUBE_SETTINGS);
}
