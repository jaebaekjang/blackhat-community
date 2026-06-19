/**
 * 검은 모자 라디오국 - YouTube 연동 타입
 */

import type { YouTubeSource } from "./enums";

export interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  publishedAt: string;
  author: string;
  description?: string;
  source: YouTubeSource;
  createdAt: string;
  updatedAt: string;
}

/** /api/youtube/latest 응답 형식 */
export interface YouTubeLatestResponse {
  videos: YouTubeVideo[];
  source: "rss" | "mock";
  fetchedAt: string;
}

/** localStorage(blackhat_youtube_settings) 에 저장되는 사용자 조정 설정 */
export interface YouTubeSettings {
  channelId: string;
  apiKey: string;
  uploadsPlaylistId: string;
  homeDisplayCount: number;
  /** 자동 갱신 주기 (분) */
  syncIntervalMinutes: number;
  lastSyncedAt: string | null;
}
