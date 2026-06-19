"use client";

import { useEffect, useState } from "react";
import type { YouTubeLatestResponse, YouTubeVideo, YouTubeSettings } from "@/types";
import { VideoCard } from "./VideoCard";
import { SectionTitle } from "@/components/ui/Card";
import { LoadingState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { useStorageValue } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import { DEFAULT_YOUTUBE_SETTINGS, setData } from "@/lib/storage";
import { mockYouTubeVideos } from "@/data";

export function YouTubeSection() {
  const { value: ytSettings } = useStorageValue<YouTubeSettings>(
    STORAGE_KEYS.youtubeSettings,
    DEFAULT_YOUTUBE_SETTINGS,
  );
  const count = ytSettings.homeDisplayCount || 6;

  const [videos, setVideos] = useState<YouTubeVideo[]>(mockYouTubeVideos.slice(0, count));
  const [source, setSource] = useState<"rss" | "mock">("mock");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const params = new URLSearchParams({ limit: String(count) });
    if (ytSettings.channelId) params.set("channelId", ytSettings.channelId);

    fetch(`/api/youtube/latest?${params.toString()}`)
      .then((res) => res.json() as Promise<YouTubeLatestResponse>)
      .then((data) => {
        if (cancelled) return;
        setVideos(data.videos);
        setSource(data.source);
        // 불러온 영상을 캐시(localStorage)에 저장 — 관리자 통계에서 사용
        setData(STORAGE_KEYS.youtubeVideos, data.videos);
      })
      .catch(() => {
        if (cancelled) return;
        setVideos(mockYouTubeVideos.slice(0, count));
        setSource("mock");
      })
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [count, ytSettings.channelId]);

  return (
    <section>
      <SectionTitle
        title="검은 모자의 최신 영상"
        subtitle="검은 모자 공포라디오 채널의 최신 업로드"
        action={
          <Badge variant={source === "rss" ? "success" : "warning"} dot>
            {source === "rss" ? "RSS 연동" : "mock 영상"}
          </Badge>
        }
      />
      {loading ? (
        <LoadingState label="최신 영상을 불러오는 중..." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </section>
  );
}
