/**
 * 검은 모자 라디오국 - 핵심 데이터 모델 정의
 *
 * 원칙
 *  - 모든 주요 모델은 id / createdAt / updatedAt 을 포함한다. (DB 이전 기준)
 *  - 모든 시각(time) 필드는 ISO 8601 문자열로 저장한다.
 *  - 소프트 삭제를 위해 BaseModel 에 deletedAt(optional) 을 둔다.
 *  - 실제 DB 컬럼 매핑은 docs/database-schema.md 참고.
 */

import type {
  AdminNoteTargetType,
  BroadcastWish,
  Category,
  CaseStatus,
  CommentType,
  FearLevel,
  ForbiddenZoneType,
  LocationType,
  MembershipTierName,
  NoticeType,
  NoticeVisibility,
  PipelinePriority,
  PipelineStatus,
  ProductCategory,
  RadioStatus,
  Region,
  ReportReason,
  ReportStatus,
  ReportTargetType,
  RiskLevel,
  StoryType,
  SubmissionStatus,
  UserGrade,
  UserRole,
  UserStatus,
  WriterGrade,
  WriterWorkStatus,
} from "./enums";

/** 모든 모델이 공유하는 기본 필드 */
export interface BaseModel {
  id: string;
  createdAt: string;
  updatedAt: string;
  /** 소프트 삭제 시각. null/undefined 이면 살아있는 레코드 */
  deletedAt?: string | null;
}

// ---------------------------------------------------------------------------
// User
// ---------------------------------------------------------------------------

export interface User extends BaseModel {
  nickname: string;
  email: string;
  role: UserRole;
  /** 등급 (검은표식 누적에 따른 칭호) */
  grade: UserGrade;
  /** 레벨 (숫자) */
  level: number;
  membershipTierId: string | null;
  /** 검은표식 (포인트) */
  points: number;
  status: UserStatus;
  /** 통계용 누적값 */
  submissionCount: number;
  commentCount: number;
  broadcastAdoptedCount: number;
  reportedCount: number;
  savedCaseCount: number;
  lastActiveAt: string;
  /** 관리자 경고 횟수 */
  warningCount: number;
}

// ---------------------------------------------------------------------------
// Submission (검은 제보함 원본 제보)
// ---------------------------------------------------------------------------

export interface Submission extends BaseModel {
  title: string;
  category: Category;
  storyType: StoryType;
  locationType: LocationType;
  region: Region;
  content: string;
  authorId: string | null;
  authorName: string;
  isAnonymous: boolean;
  fearLevel: FearLevel;
  broadcastWish: BroadcastWish;
  /** 방송 사용 동의 */
  broadcastConsent: boolean;
  /** 일부 각색 가능 동의 */
  editConsent: boolean;
  /** 개인정보 제외 동의 */
  privacyConsent: boolean;
  status: SubmissionStatus;
  riskLevel: RiskLevel;
  /** 위험 키워드 감지 결과 */
  detectedRiskKeywords: string[];
  /** 생성된 사건파일 id (1:1 매핑) */
  caseFileId: string | null;
  /** 관리자 검수 메타데이터 (nullable) */
  adminMemo?: string;
  rejectReason?: string;
  followUpQuestion?: string;
}

// ---------------------------------------------------------------------------
// CaseFile (사건파일)
// ---------------------------------------------------------------------------

export interface CaseFile extends BaseModel {
  submissionId: string | null;
  /** GM-YYYY-0001 형식 */
  caseNumber: string;
  title: string;
  category: Category;
  storyType: StoryType;
  locationType: LocationType;
  region: Region;
  content: string;
  authorId: string | null;
  authorName: string;
  isAnonymous: boolean;
  status: CaseStatus;
  /** 공포지수 0-100 */
  fearScore: number;
  /** 현실감 0-100 */
  realismScore: number;
  /** 찝찝함 0-100 */
  uneaseScore: number;
  broadcastRequestCount: number;
  chillsCount: number;
  saveCount: number;
  relatedVideoUrl: string | null;
  tags: string[];
  isPublic: boolean;
  isLocked: boolean;
}

// ---------------------------------------------------------------------------
// Comment
// ---------------------------------------------------------------------------

export interface Comment extends BaseModel {
  caseFileId: string;
  userId: string | null;
  authorName: string;
  type: CommentType;
  content: string;
  likes: number;
  isBest: boolean;
}

// ---------------------------------------------------------------------------
// Badge / UserBadge
// ---------------------------------------------------------------------------

export interface Badge extends BaseModel {
  name: string;
  description: string;
  /** 이모지 또는 아이콘 키 */
  icon: string;
  /** 획득 조건 설명 */
  condition: string;
}

export interface UserBadge extends BaseModel {
  userId: string;
  badgeId: string;
  earnedAt: string;
}

// ---------------------------------------------------------------------------
// MembershipTier
// ---------------------------------------------------------------------------

export interface MembershipTier extends BaseModel {
  name: MembershipTierName;
  /** 월 가격 (원). 0 이면 무료 */
  price: number;
  description: string;
  benefits: string[];
  /** 접근 레벨 (높을수록 상위 권한) */
  accessLevel: number;
  /** 현재 가입자 수 (mock 통계) */
  subscriberCount: number;
}

// ---------------------------------------------------------------------------
// RadioRoom (심야라디오 대기방 / 해석방)
// ---------------------------------------------------------------------------

export interface RadioRoom extends BaseModel {
  title: string;
  caseFileId: string | null;
  scheduledAt: string;
  status: RadioStatus;
  youtubeUrl: string | null;
  participantCount: number;
  /** 방송 전 투표 질문 (mock) */
  pollQuestion?: string;
}

// ---------------------------------------------------------------------------
// ForbiddenZoneItem (금지구역 / 칠죄빌라 / 나폴리탄 문서실 등)
// ---------------------------------------------------------------------------

export interface ForbiddenZoneItem extends BaseModel {
  type: ForbiddenZoneType;
  title: string;
  content: string;
  requiredLevel: number;
  isLocked: boolean;
  isPublic: boolean;
  relatedCaseFileId: string | null;
  /** 칠죄빌라 호실용 메타데이터 (해당 시) */
  roomNumber?: string;
  sin?: string;
  residentName?: string;
  officialLore?: string;
  userSpeculation?: string;
  nextRevealAt?: string;
}

// ---------------------------------------------------------------------------
// WriterWork (작가실 작품)
// ---------------------------------------------------------------------------

export interface WriterWork extends BaseModel {
  title: string;
  authorId: string | null;
  authorName: string;
  authorGrade: WriterGrade;
  genre: string;
  content: string;
  fearScore: number;
  recommendationCount: number;
  status: WriterWorkStatus;
}

// ---------------------------------------------------------------------------
// Product (상점)
// ---------------------------------------------------------------------------

export interface Product extends BaseModel {
  name: string;
  price: number;
  category: ProductCategory;
  description: string;
  isMemberOnly: boolean;
  isSoldOut: boolean;
  /** mock 판매 통계 */
  purchaseCount: number;
}

// ---------------------------------------------------------------------------
// AdminNote (콘텐츠 제작 메모 — 사건파일/제보용)
// ---------------------------------------------------------------------------

export interface AdminNote extends BaseModel {
  targetType: AdminNoteTargetType;
  targetId: string;
  youtubeTitle1: string;
  youtubeTitle2: string;
  youtubeTitle3: string;
  thumbnailCopy1: string;
  thumbnailCopy2: string;
  thumbnailCopy3: string;
  hook: string;
  keyScene: string;
  twist: string;
  ending: string;
  shortsPoint: string;
  communityPollQuestion: string;
  videoDescription: string;
  pinnedComment: string;
  tags: string[];
  adminMemo: string;
}

// ---------------------------------------------------------------------------
// Report (신고)
// ---------------------------------------------------------------------------

export interface Report extends BaseModel {
  targetType: ReportTargetType;
  targetId: string;
  /** 신고 대상 표시용 라벨 (사건번호/닉네임 등) */
  targetLabel: string;
  reporterId: string | null;
  reporterName: string;
  reason: ReportReason;
  /** 동일 대상 누적 신고 횟수 */
  reportCount: number;
  status: ReportStatus;
  adminMemo: string;
}

// ---------------------------------------------------------------------------
// Notice (공지 / 이벤트)
// ---------------------------------------------------------------------------

export interface Notice extends BaseModel {
  title: string;
  content: string;
  type: NoticeType;
  visibility: NoticeVisibility;
  isPinned: boolean;
  scheduledAt: string | null;
}

// ---------------------------------------------------------------------------
// ContentPipelineItem (콘텐츠 제작 파이프라인 칸반 카드)
// ---------------------------------------------------------------------------

export interface ContentPipelineItem extends BaseModel {
  caseFileId: string;
  /** 카드에 표시할 사건 정보 (조인 최소화를 위한 캐시값) */
  caseNumber: string;
  title: string;
  category: Category;
  fearScore: number;
  broadcastRequestCount: number;
  status: PipelineStatus;
  priority: PipelinePriority;
  assignee: string;
  estimatedRuntime: string;
  dueDate: string | null;
  uploadUrl: string | null;
  /** 제작 메모 (AdminNote 와 유사한 필드를 카드 인라인으로 보관) */
  recordingMemo: string;
  editingMemo: string;
}

// ---------------------------------------------------------------------------
// Notification (알림)
// ---------------------------------------------------------------------------

export interface Notification extends BaseModel {
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  /** 클릭 시 이동할 경로 */
  link?: string;
}

// ---------------------------------------------------------------------------
// AdminSettings (사이트 설정 — 단일 레코드)
// ---------------------------------------------------------------------------

export interface AdminSettings extends BaseModel {
  siteName: string;
  operatorName: string;
  defaultSubmissionStatus: SubmissionStatus;
  autoPublishSubmissions: boolean;
  autoPublishComments: boolean;
  reportHideThreshold: number;
  broadcastRequestThreshold: number;
  membershipLockEnabled: boolean;
  forbiddenKeywords: string[];
  privacyRiskKeywords: string[];
  // YouTube 연동 설정
  youtubeChannelId: string;
  youtubeApiKey: string;
  youtubeUploadsPlaylistId: string;
  youtubeHomeDisplayCount: number;
  youtubeSyncInterval: number;
  youtubeLastSyncedAt: string | null;
}
