"use client";

import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/EmptyState";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  /** 모바일 카드에서 숨길지 여부 */
  hideOnMobile?: boolean;
}

/**
 * 반응형 데이터 테이블.
 * - 데스크톱(sm+): 가로 스크롤 가능한 <table>
 * - 모바일: 행을 카드(라벨:값) 형태로 표시
 */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  onRowClick,
  emptyLabel = "데이터가 없습니다.",
}: {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyLabel?: string;
}) {
  if (rows.length === 0) {
    return <EmptyState title={emptyLabel} />;
  }

  return (
    <>
      {/* 데스크톱 테이블 */}
      <div className="panel hidden overflow-hidden p-0 sm:block">
        <div className="table-scroll">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-ash-dim">
                {columns.map((col) => (
                  <th key={col.key} className={cn("px-3 py-2.5 font-medium", col.className)}>
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={getRowKey(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    "border-b border-line/50 last:border-0",
                    onRowClick && "cursor-pointer hover:bg-surface-alt",
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-3 py-3 align-middle text-ash", col.className)}>
                      {col.render ? col.render(row) : (row as Record<string, React.ReactNode>)[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모바일 카드 */}
      <div className="space-y-3 sm:hidden">
        {rows.map((row) => (
          <div
            key={getRowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
            className={cn("panel p-3", onRowClick && "active:bg-surface-alt")}
          >
            {columns
              .filter((col) => !col.hideOnMobile)
              .map((col) => (
                <div
                  key={col.key}
                  className="flex items-start justify-between gap-3 border-b border-line/40 py-1.5 last:border-0"
                >
                  <span className="shrink-0 text-xs text-ash-faint">{col.header}</span>
                  <span className="text-right text-sm text-ash">
                    {col.render ? col.render(row) : (row as Record<string, React.ReactNode>)[col.key]}
                  </span>
                </div>
              ))}
          </div>
        ))}
      </div>
    </>
  );
}
