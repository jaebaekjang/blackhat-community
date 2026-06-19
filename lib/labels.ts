/**
 * 검은 모자 라디오국 - 상태값 → 배지 색상(variant) 매핑
 *
 * Badge 컴포넌트(components/ui/Badge.tsx)가 사용하는 variant 키를 반환한다.
 * 위험/신고/개인정보 관련은 붉은 배지(danger),
 * 진행/대기 상태는 warning, 완료/채택은 success 로 통일한다.
 */

export type BadgeVariant =
  | "neutral"
  | "danger"
  | "warning"
  | "success"
  | "info"
  | "villa"
  | "broadcast";

const DANGER = new Set<string>([
  "위험 파일",
  "금지 파일",
  "높음",
  "긴급",
  "banned",
  "차단",
  "반려됨",
  "반려",
]);

const WARNING = new Set<string>([
  "검토 중",
  "주의",
  "해석 필요",
  "후속 제보 대기",
  "후속 제보 요청",
  "보류",
  "수정 요청",
  "warned",
  "restricted",
  "경고",
  "제한",
  "대기방 오픈",
  "업로드 대기",
  "높은", // priority "높음"과 구분되는 일반 텍스트 방어
]);

const SUCCESS = new Set<string>([
  "방송 완료",
  "채택",
  "조치 완료",
  "업로드 완료",
  "공식 낭독 후보",
  "낮음",
  "active",
  "정상",
  "해석방 오픈",
]);

const BROADCAST = new Set<string>([
  "방송 후보",
  "방송 중",
  "각색 중",
  "녹음 예정",
  "대본 작성",
  "편집 중",
  "유료 공개 후보",
]);

const VILLA = new Set<string>([
  "칠죄빌라",
  "칠죄빌라 연결 의심",
  "칠죄빌라 입주자",
  "칠죄빌라 공지",
]);

const INFO = new Set<string>([
  "접수됨",
  "미확인 제보",
  "제보 접수",
  "방송 전",
  "보통",
]);

export function statusToVariant(status: string): BadgeVariant {
  if (DANGER.has(status)) return "danger";
  if (VILLA.has(status)) return "villa";
  if (BROADCAST.has(status)) return "broadcast";
  if (SUCCESS.has(status)) return "success";
  if (WARNING.has(status)) return "warning";
  if (INFO.has(status)) return "info";
  return "neutral";
}

/** 개인정보 위험도 전용 */
export function riskToVariant(risk: string): BadgeVariant {
  if (risk === "높음") return "danger";
  if (risk === "주의") return "warning";
  return "success";
}

/** 우선순위 전용 */
export function priorityToVariant(priority: string): BadgeVariant {
  if (priority === "긴급") return "danger";
  if (priority === "높음") return "warning";
  if (priority === "낮음") return "neutral";
  return "info";
}

/** 공포지수(0-100) → 표시용 라벨 */
export function fearScoreLabel(score: number): string {
  if (score >= 90) return "혼자 보면 안 됨";
  if (score >= 75) return "잠 못 잠";
  if (score >= 55) return "소름";
  if (score >= 35) return "찝찝함";
  return "잔잔함";
}
