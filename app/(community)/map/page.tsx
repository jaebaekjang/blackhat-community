"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCollection } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockCases } from "@/data";
import type { CaseFile, LocationType, Region } from "@/types";
import { REGIONS, LOCATION_TYPES } from "@/types";
import { SectionTitle, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";

const REGION_FILTERS: readonly string[] = ["전체", ...REGIONS];
const LOCATION_FILTERS: readonly string[] = ["전체", ...LOCATION_TYPES];

export default function MapPage() {
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);

  const [region, setRegion] = useState<string>("전체");
  const [locationType, setLocationType] = useState<string>("전체");

  const publicCases = useMemo(() => cases.filter((c) => c.isPublic), [cases]);

  // 지역별 사건 수
  const regionCounts = useMemo(() => {
    const map: Record<string, number> = {};
    REGIONS.forEach((r) => (map[r] = 0));
    publicCases.forEach((c) => {
      map[c.region] = (map[c.region] || 0) + 1;
    });
    return map;
  }, [publicCases]);

  // 장소 유형별 사건 수
  const locationCounts = useMemo(() => {
    const map: Record<string, number> = {};
    publicCases.forEach((c) => {
      map[c.locationType] = (map[c.locationType] || 0) + 1;
    });
    return map;
  }, [publicCases]);

  const topRegion = useMemo<Region | null>(() => {
    let best: Region | null = null;
    let bestCount = -1;
    (REGIONS as readonly Region[]).forEach((r) => {
      if (regionCounts[r] > bestCount) {
        bestCount = regionCounts[r];
        best = r;
      }
    });
    return bestCount > 0 ? best : null;
  }, [regionCounts]);

  const topLocation = useMemo<LocationType | null>(() => {
    let best: LocationType | null = null;
    let bestCount = -1;
    (LOCATION_TYPES as readonly LocationType[]).forEach((t) => {
      const count = locationCounts[t] || 0;
      if (count > bestCount) {
        bestCount = count;
        best = t;
      }
    });
    return bestCount > 0 ? best : null;
  }, [locationCounts]);

  const filtered = useMemo(() => {
    let list = publicCases;
    if (region !== "전체") list = list.filter((c) => c.region === region);
    if (locationType !== "전체") list = list.filter((c) => c.locationType === locationType);
    return list;
  }, [publicCases, region, locationType]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">🗺️ 공포지도</h1>
        <p className="mt-1 text-sm text-ash">
          정확한 위치는 공개하지 않습니다. 지역과 장소 유형으로만 괴담을 분류합니다.
        </p>
      </div>

      <p className="text-xs text-ash-faint">
        정확한 주소 입력 기능은 제공하지 않습니다.
      </p>

      {/* 필터 */}
      <div className="space-y-2">
        <FilterRow values={REGION_FILTERS} active={region} onChange={setRegion} />
        <FilterRow values={LOCATION_FILTERS} active={locationType} onChange={setLocationType} />
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="인기 지역"
          value={topRegion ?? "—"}
          sub={topRegion ? `${regionCounts[topRegion]}건 접수` : "데이터 없음"}
          accent
        />
        <StatCard
          label="인기 장소 유형"
          value={topLocation ?? "—"}
          sub={topLocation ? `${locationCounts[topLocation] || 0}건 접수` : "데이터 없음"}
        />
      </div>

      {/* 지역별 사건 수 */}
      <section>
        <SectionTitle title="지역별 사건 수" subtitle="괴담이 가장 자주 보고된 지역입니다." />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {(REGIONS as readonly Region[]).map((r) => {
            const count = regionCounts[r];
            const isTop = topRegion === r;
            const isActive = region === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(isActive ? "전체" : r)}
                className={cn(
                  "panel p-4 text-left transition-colors hover:border-line-strong hover:bg-surface-alt",
                  isTop && "border-blood/60 bg-blood/5",
                  isActive && "ring-1 ring-blood/40",
                )}
              >
                <div
                  className={cn(
                    "text-3xl font-bold tabular-nums",
                    count > 0 ? "text-blood-bright" : "text-ash-faint",
                  )}
                >
                  {count}
                </div>
                <div className="mt-1 flex items-center gap-1.5 text-sm text-zinc-100">
                  📍 {r}
                  {isTop && <Badge variant="danger">인기 지역</Badge>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 필터된 사건 목록 */}
      <section>
        <SectionTitle title="분류된 사건" subtitle={`총 ${filtered.length}건`} />
        {filtered.length === 0 ? (
          <EmptyState
            icon="🗺️"
            title="해당 조건의 괴담이 없습니다."
            description="지역이나 장소 유형 필터를 바꿔보세요."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {filtered.map((c) => (
              <Link key={c.id} href={`/cases/${c.id}`} className="block">
                <div className="panel h-full p-4 transition-colors hover:border-line-strong hover:bg-surface-alt">
                  <div className="flex items-center justify-between gap-2">
                    <span className="case-no text-xs">{c.caseNumber}</span>
                    <Badge variant="neutral">{c.category}</Badge>
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-semibold leading-snug text-zinc-100">
                    {c.title}
                  </h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ash-dim">
                    <span>📍 {c.region}</span>
                    <span>·</span>
                    <span>🏚️ {c.locationType}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FilterRow({
  values,
  active,
  onChange,
}: {
  values: readonly string[];
  active: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
      {values.map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          className={cn(
            "whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors",
            active === v
              ? "border-blood/50 bg-blood/15 text-blood-bright"
              : "border-line text-ash-dim hover:text-zinc-100",
          )}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
