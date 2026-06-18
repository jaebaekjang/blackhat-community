/**
 * 검은 모자 라디오국 - YouTube 연동 로직
 *
 * MVP 는 YouTube RSS Feed 를 서버(API Route)에서 fetch 한다.
 *  - 클라이언트에서 직접 RSS 를 호출하지 않는다. (CORS / 키 노출 방지)
 *  - 실패 시 mock 영상으로 fallback 한다.
 *  - 나중에 YouTube Data API 로 확장할 수 있도록 fetchLatestVideos 한 곳만 교체하면 된다.
 */

import type { YouTubeVideo } from "@/types";
import { mockYouTubeVideos } from "@/data";
import { YOUTUBE_RSS_BASE, DEFAULT_YOUTUBE_CHANNEL_ID } from "./constants";

/** 간단한 XML 엔티티 디코딩 */
function decodeEntities(input: string): string {
  return input
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function tagContent(block: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`);
  const m = block.match(re);
  return m ? decodeEntities(m[1].trim()) : null;
}

function attrValue(block: string, tag: string, attr: string): string | null {
  const re = new RegExp(`<${tag}[^>]*\\b${attr}="([^"]*)"`);
  const m = block.match(re);
  return m ? m[1] : null;
}

/**
 * YouTube 채널 RSS(XML) 문자열을 YouTubeVideo[] 로 파싱한다.
 * 외부 XML 라이브러리 없이 정규식으로 처리한다. (의존성 최소화)
 */
export function parseYouTubeRss(xml: string): YouTubeVideo[] {
  const entries = xml.split(/<entry>/).slice(1).map((e) => e.split(/<\/entry>/)[0]);
  const videos: YouTubeVideo[] = [];

  for (const entry of entries) {
    const videoId =
      tagContent(entry, "yt:videoId") ||
      (tagContent(entry, "id") || "").replace("yt:video:", "");
    if (!videoId) continue;

    const title = tagContent(entry, "title") || "(제목 없음)";
    const author = tagContent(entry, "name") || "검은 모자 공포라디오";
    const publishedAt = tagContent(entry, "published") || new Date().toISOString();
    const description = tagContent(entry, "media:description") || undefined;
    const thumbnailUrl =
      attrValue(entry, "media:thumbnail", "url") ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    const url =
      attrValue(entry, "link", "href") ||
      `https://www.youtube.com/watch?v=${videoId}`;

    videos.push({
      id: `yt-rss-${videoId}`,
      videoId,
      title,
      url,
      thumbnailUrl,
      publishedAt,
      author,
      description,
      source: "rss",
      createdAt: publishedAt,
      updatedAt: new Date().toISOString(),
    });
  }

  return videos;
}

/**
 * 최신 영상을 가져온다. RSS 실패 시 mock 으로 fallback.
 * (서버 사이드 전용 — API Route 에서 호출)
 */
export async function fetchLatestVideos(
  channelId: string = DEFAULT_YOUTUBE_CHANNEL_ID,
): Promise<{ videos: YouTubeVideo[]; source: "rss" | "mock" }> {
  try {
    const res = await fetch(`${YOUTUBE_RSS_BASE}${channelId}`, {
      // 항상 최신을 가져오되, 네트워크 없는 환경에서도 빠르게 실패하도록
      cache: "no-store",
      headers: { "User-Agent": "blackhat-radio-community/0.1" },
    });
    if (!res.ok) throw new Error(`RSS status ${res.status}`);
    const xml = await res.text();
    const videos = parseYouTubeRss(xml);
    if (videos.length === 0) throw new Error("RSS empty");
    return { videos, source: "rss" };
  } catch {
    return { videos: mockYouTubeVideos, source: "mock" };
  }
}
