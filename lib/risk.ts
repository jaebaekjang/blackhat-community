/**
 * 검은 모자 라디오국 - 개인정보 위험 키워드 감지
 *
 * 제보 본문에서 개인정보로 이어질 수 있는 패턴/키워드를 감지한다.
 * 실제 서비스에서는 서버 측 검수/머신러닝으로 대체될 부분(mock 수준).
 */

import type { RiskLevel } from "@/types";

const PHONE_RE = /01[016789]-?\d{3,4}-?\d{4}/;
const ROOM_RE = /\d+\s*동\s*\d+\s*호/; // 102동 1503호 등

export interface RiskResult {
  matched: string[];
  level: RiskLevel;
}

export function detectRiskKeywords(content: string, keywords: string[]): RiskResult {
  const matched = new Set<string>();

  for (const kw of keywords) {
    if (kw && content.includes(kw)) matched.add(kw);
  }
  if (PHONE_RE.test(content)) matched.add("전화번호 패턴");
  if (ROOM_RE.test(content)) matched.add("동/호수 패턴");

  const count = matched.size;
  let level: RiskLevel = "낮음";
  if (PHONE_RE.test(content) || ROOM_RE.test(content) || count >= 3) {
    level = "높음";
  } else if (count >= 1) {
    level = "주의";
  }

  return { matched: Array.from(matched), level };
}
