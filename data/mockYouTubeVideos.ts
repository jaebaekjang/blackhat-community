import type { YouTubeVideo } from "@/types";
import { DEFAULT_YOUTUBE_CHANNEL_ID } from "@/lib/constants";

/**
 * YouTube mock 영상 6개.
 * RSS / API 호출 실패 시 fallback 으로 사용된다.
 *
 * videoId 는 mock 값이므로 실제 영상과 매칭되지 않을 수 있다.
 * 실제 RSS 연동 시 /api/youtube/latest 가 실제 데이터로 덮어쓴다.
 */
const CHANNEL = DEFAULT_YOUTUBE_CHANNEL_ID;

function mockVideo(
  index: number,
  videoId: string,
  title: string,
  publishedAt: string,
  description: string,
): YouTubeVideo {
  return {
    id: `yt-mock-${index}`,
    videoId,
    title,
    url: `https://www.youtube.com/watch?v=${videoId}`,
    thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    publishedAt,
    author: "검은 모자 공포라디오",
    description,
    source: "mock",
    createdAt: publishedAt,
    updatedAt: publishedAt,
  };
}

export const mockYouTubeVideos: YouTubeVideo[] = [
  mockVideo(
    1,
    "blackhat0001",
    "칠죄빌라 1편｜탐욕의 방에 들어간 남자",
    "2026-06-14T12:00:00.000Z",
    "칠죄빌라 101호, 탐욕의 방에 들어간 남자의 이야기. 검은 모자가 읽는 첫 번째 칠죄빌라 사건.",
  ),
  mockVideo(
    2,
    "blackhat0002",
    "친구가 들려준 무서운 썰｜새벽마다 울리는 초인종",
    "2026-06-10T12:00:00.000Z",
    "새벽 3시, 아무도 없는 집의 초인종이 울린다. 친구가 직접 겪었다는 이야기.",
  ),
  mockVideo(
    3,
    "blackhat0003",
    "무인사진관 3번 부스 이용수칙",
    "2026-06-05T12:00:00.000Z",
    "나폴리탄 괴담. 무인사진관 3번 부스에는 지켜야 할 규칙이 있다.",
  ),
  mockVideo(
    4,
    "blackhat0004",
    "군대 야간근무 중 본 사람",
    "2026-05-29T12:00:00.000Z",
    "야간 경계근무 중 초소 밖에 서 있던 사람. 그러나 그곳엔 아무도 없어야 했다.",
  ),
  mockVideo(
    5,
    "blackhat0005",
    "엘리베이터 13층 호출 금지 안내문",
    "2026-05-22T12:00:00.000Z",
    "나폴리탄 괴담. 13층이 없는 건물의 엘리베이터에 붙은 안내문.",
  ),
  mockVideo(
    6,
    "blackhat0006",
    "친구가 이사 간 집에서 들은 노크 소리",
    "2026-05-15T12:00:00.000Z",
    "이사한 첫날 밤, 벽 안쪽에서 들려오는 규칙적인 노크 소리.",
  ),
];
