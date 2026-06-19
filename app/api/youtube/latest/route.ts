import { NextResponse } from "next/server";
import { fetchLatestVideos } from "@/lib/youtube";
import { DEFAULT_YOUTUBE_CHANNEL_ID } from "@/lib/constants";
import type { YouTubeLatestResponse } from "@/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/youtube/latest?channelId=...&limit=...
 *
 * 검은 모자 공포라디오 채널의 최신 영상을 반환한다.
 *  - channelId 미지정 시 env(YOUTUBE_CHANNEL_ID) -> 기본 상수 순으로 사용.
 *  - RSS 실패 시 mock 영상으로 fallback. (source 로 구분)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const channelId =
    searchParams.get("channelId") ||
    process.env.YOUTUBE_CHANNEL_ID ||
    DEFAULT_YOUTUBE_CHANNEL_ID;
  const limitParam = Number(searchParams.get("limit") || "12");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? limitParam : 12;

  const { videos, source } = await fetchLatestVideos(channelId);

  const body: YouTubeLatestResponse = {
    videos: videos.slice(0, limit),
    source,
    fetchedAt: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
