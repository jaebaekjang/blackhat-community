/**
 * 검은 모자 라디오국 - 열거형(enum) 정의
 *
 * 모든 열거형은 `as const` 배열로 선언하여
 *  1) 드롭다운 / 필터 UI 에서 그대로 순회할 수 있고
 *  2) 유니온 타입을 파생시킬 수 있도록 한다.
 *
 * 실제 DB 이전 시 이 값들이 그대로 enum / check constraint 의 기준이 된다.
 * (docs/database-schema.md 참고)
 */

// ---------------------------------------------------------------------------
// 시스템 / 구조 enum (영문 snake)
// ---------------------------------------------------------------------------

export const USER_ROLES = ["user", "moderator", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const USER_STATUSES = ["active", "warned", "restricted", "banned"] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const YOUTUBE_SOURCES = ["rss", "api", "mock"] as const;
export type YouTubeSource = (typeof YOUTUBE_SOURCES)[number];

export const REPORT_TARGET_TYPES = ["case_file", "comment", "user", "writer_work"] as const;
export type ReportTargetType = (typeof REPORT_TARGET_TYPES)[number];

export const ADMIN_NOTE_TARGET_TYPES = ["submission", "case_file"] as const;
export type AdminNoteTargetType = (typeof ADMIN_NOTE_TARGET_TYPES)[number];

// ---------------------------------------------------------------------------
// 제보 / 사건파일 분류 enum (한글 — 화면 표기와 동일)
// ---------------------------------------------------------------------------

export const CATEGORIES = [
  "친무썰",
  "실화 괴담",
  "가족 괴담",
  "군대 괴담",
  "학교 괴담",
  "회사 괴담",
  "아파트 괴담",
  "엘리베이터 괴담",
  "꿈/가위눌림",
  "나폴리탄",
  "칠죄빌라",
  "사진/녹음 제보",
  "창작 괴담",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const STORY_TYPES = ["실화 주장", "들은 이야기", "창작 괴담", "각색 가능"] as const;
export type StoryType = (typeof STORY_TYPES)[number];

export const LOCATION_TYPES = [
  "아파트",
  "학교",
  "군부대",
  "회사",
  "병원",
  "모텔",
  "지하철",
  "엘리베이터",
  "폐건물",
  "시골집",
  "기타",
] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];

export const REGIONS = [
  "서울",
  "경기",
  "인천",
  "대구",
  "부산",
  "광주",
  "대전",
  "울산",
  "강원",
  "충청",
  "전라",
  "경상",
  "제주",
  "비공개",
] as const;
export type Region = (typeof REGIONS)[number];

export const FEAR_LEVELS = [
  "찝찝함",
  "소름",
  "잠 못 잠",
  "혼자 보면 안 됨",
  "검은 모자에게만 보낼 수준",
] as const;
export type FearLevel = (typeof FEAR_LEVELS)[number];

export const BROADCAST_WISHES = [
  "친무썰에 읽어주세요",
  "나폴리탄으로 각색해주세요",
  "칠죄빌라 세계관에 넣어주세요",
  "커뮤니티에만 올릴게요",
] as const;
export type BroadcastWish = (typeof BROADCAST_WISHES)[number];

// ---------------------------------------------------------------------------
// 상태(status) enum
// ---------------------------------------------------------------------------

export const SUBMISSION_STATUSES = [
  "접수됨",
  "검토 중",
  "방송 후보",
  "각색 중",
  "녹음 예정",
  "방송 완료",
  "반려됨",
  "후속 제보 요청",
  "해석 필요",
  "위험 파일",
  "칠죄빌라 연결 의심",
  "금지 파일",
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const CASE_STATUSES = [
  "미확인 제보",
  "접수됨",
  "검토 중",
  "방송 후보",
  "방송 완료",
  "해석 필요",
  "후속 제보 대기",
  "위험 파일",
  "칠죄빌라 연결 의심",
  "금지 파일",
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const RISK_LEVELS = ["낮음", "주의", "높음"] as const;
export type RiskLevel = (typeof RISK_LEVELS)[number];

export const COMMENT_TYPES = [
  "해석",
  "비슷한 경험",
  "단서 발견",
  "현실적 설명",
  "더 무서운 가설",
  "후속 요청",
  "방송 요청",
] as const;
export type CommentType = (typeof COMMENT_TYPES)[number];

// ---------------------------------------------------------------------------
// 멤버십 / 등급 enum
// ---------------------------------------------------------------------------

export const MEMBERSHIP_TIERS = [
  "무료 회원",
  "심야 청취자",
  "기록자",
  "칠죄빌라 입주자",
  "라디오국 관계자",
] as const;
export type MembershipTierName = (typeof MEMBERSHIP_TIERS)[number];

export const USER_GRADES = [
  "신입 청취자",
  "심야 청취자",
  "제보자",
  "목격자",
  "기록자",
  "방송 채택자",
  "검은 모자의 단골",
  "금지구역 출입자",
  "칠죄빌라 입주자",
  "라디오국 기록관리자",
] as const;
export type UserGrade = (typeof USER_GRADES)[number];

export const WRITER_GRADES = [
  "신입 작가",
  "심야 작가",
  "채택 작가",
  "공식 낭독 작가",
  "검은 모자 전속 기록자",
] as const;
export type WriterGrade = (typeof WRITER_GRADES)[number];

// ---------------------------------------------------------------------------
// 심야라디오 enum
// ---------------------------------------------------------------------------

export const RADIO_STATUSES = [
  "방송 전",
  "대기방 오픈",
  "방송 중",
  "방송 완료",
  "해석방 오픈",
] as const;
export type RadioStatus = (typeof RADIO_STATUSES)[number];

// ---------------------------------------------------------------------------
// 금지구역 enum
// ---------------------------------------------------------------------------

export const FORBIDDEN_ZONE_TYPES = [
  "칠죄빌라",
  "나폴리탄 문서실",
  "검은 모자의 편지함",
  "열람 제한 파일",
  "사라진 제보자 기록",
  "세계관 이벤트",
] as const;
export type ForbiddenZoneType = (typeof FORBIDDEN_ZONE_TYPES)[number];

// ---------------------------------------------------------------------------
// 작가실 enum
// ---------------------------------------------------------------------------

export const WRITER_WORK_STATUSES = [
  "접수됨",
  "검토 중",
  "공식 낭독 후보",
  "채택",
  "반려",
  "수정 요청",
  "유료 공개 후보",
] as const;
export type WriterWorkStatus = (typeof WRITER_WORK_STATUSES)[number];

// ---------------------------------------------------------------------------
// 상점 enum
// ---------------------------------------------------------------------------

export const PRODUCT_CATEGORIES = [
  "굿즈",
  "디지털 배지",
  "칠죄빌라 입주 카드",
  "사건파일 PDF",
  "한정 포스터",
  "오디오북",
  "멤버 전용 상품",
] as const;
export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

// ---------------------------------------------------------------------------
// 신고 enum
// ---------------------------------------------------------------------------

export const REPORT_REASONS = [
  "개인정보 노출",
  "특정인 비방",
  "허위 사실",
  "혐오/차별",
  "과도한 폭력 묘사",
  "스팸",
  "저작권 문제",
  "기타",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_STATUSES = ["접수됨", "검토 중", "조치 완료", "반려", "보류"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

// ---------------------------------------------------------------------------
// 공지 / 이벤트 enum
// ---------------------------------------------------------------------------

export const NOTICE_TYPES = [
  "일반 공지",
  "방송 공지",
  "제보 안내",
  "멤버십 공지",
  "칠죄빌라 공지",
  "이벤트",
] as const;
export type NoticeType = (typeof NOTICE_TYPES)[number];

export const NOTICE_VISIBILITIES = [
  "전체",
  "무료 회원",
  "심야 청취자 이상",
  "기록자 이상",
  "칠죄빌라 입주자",
  "관리자 전용",
] as const;
export type NoticeVisibility = (typeof NOTICE_VISIBILITIES)[number];

// ---------------------------------------------------------------------------
// 콘텐츠 제작 파이프라인 enum
// ---------------------------------------------------------------------------

export const PIPELINE_STATUSES = [
  "제보 접수",
  "검토 중",
  "방송 후보",
  "각색 중",
  "대본 작성",
  "녹음 예정",
  "편집 중",
  "업로드 대기",
  "업로드 완료",
] as const;
export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const PIPELINE_PRIORITIES = ["낮음", "보통", "높음", "긴급"] as const;
export type PipelinePriority = (typeof PIPELINE_PRIORITIES)[number];
