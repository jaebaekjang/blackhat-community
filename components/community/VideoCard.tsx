"use client";

import Link from "next/link";
import { useState } from "react";
import type { YouTubeVideo } from "@/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function VideoCard({ video }: { video: YouTubeVideo }) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="panel group flex flex-col overflow-hidden p-0">
      <div className="relative aspect-video w-full overflow-hidden bg-ink-800">
        {imgError ? (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink-700 to-ink-900 text-3xl opacity-60">
            🎩
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            onError={() => setImgError(true)}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 to-transparent" />
        <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] text-ash">
          {formatDate(video.publishedAt)}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-3">
        <h3 className="line-clamp-2 text-sm font-medium leading-snug text-zinc-100">
          {video.title}
        </h3>
        <div className="mt-auto flex flex-wrap gap-1.5">
          <a href={video.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="primary">
              ▶ YouTube에서 보기
            </Button>
          </a>
          <Link href={`/radio?video=${video.videoId}`}>
            <Button size="sm" variant="secondary">
              해석방 가기
            </Button>
          </Link>
          <Link href="/cases">
            <Button size="sm" variant="ghost">
              관련 사건파일
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
