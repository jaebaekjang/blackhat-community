/**
 * 검은 모자 라디오국 - 전역 상수
 *
 * localStorage key 는 반드시 이 파일을 통해서만 참조한다.
 * (컴포넌트에서 문자열 하드코딩 금지)
 */

export const STORAGE_KEYS = {
  users: "blackhat_users",
  cases: "blackhat_cases",
  submissions: "blackhat_submissions",
  comments: "blackhat_comments",
  badges: "blackhat_badges",
  userBadges: "blackhat_user_badges",
  memberships: "blackhat_memberships",
  radioRooms: "blackhat_radio_rooms",
  forbiddenZone: "blackhat_forbidden_zone",
  writerWorks: "blackhat_writer_works",
  products: "blackhat_products",
  adminNotes: "blackhat_admin_notes",
  reports: "blackhat_reports",
  notices: "blackhat_notices",
  settings: "blackhat_settings",
  adminMode: "blackhat_admin_mode",
  currentUser: "blackhat_current_user",
  contentPipelineItems: "blackhat_content_pipeline_items",
  youtubeSettings: "blackhat_youtube_settings",
  youtubeVideos: "blackhat_youtube_videos",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

/** 기본 YouTube 채널 ID (검은 모자 공포라디오) */
export const DEFAULT_YOUTUBE_CHANNEL_ID = "UCSF-jV2STm5g66JlHBh6MWg";

export const YOUTUBE_RSS_BASE =
  "https://www.youtube.com/feeds/videos.xml?channel_id=";

/** 검은표식(포인트) 획득 기준 */
export const POINT_RULES = {
  attendance: 5,
  comment: 3,
  submission: 20,
  broadcastRequestReceived: 1,
  bestInterpretation: 30,
  broadcastAdopted: 100,
  reportHelp: 10,
} as const;

/** 일반 사용자 커뮤니티 메뉴 (검은 모자식 표현) */
export const COMMUNITY_NAV = [
  { href: "/", label: "홈", icon: "📻" },
  { href: "/submit", label: "검은 제보함", icon: "🖤" },
  { href: "/cases", label: "사건파일", icon: "🗂️" },
  { href: "/radio", label: "심야라디오", icon: "🌙" },
  { href: "/map", label: "공포지도", icon: "🗺️" },
  { href: "/forbidden", label: "금지구역", icon: "🚫" },
  { href: "/writers", label: "작가실", icon: "✒️" },
  { href: "/membership", label: "멤버십", icon: "🎫" },
  { href: "/shop", label: "상점", icon: "🛒" },
  { href: "/profile", label: "내 기록실", icon: "📁" },
] as const;

/** 관리자(라디오국 관리자실) 메뉴 */
export const ADMIN_NAV = [
  { href: "/admin", label: "대시보드", icon: "📊" },
  { href: "/admin/submissions", label: "제보 관리", icon: "📥" },
  { href: "/admin/cases", label: "사건파일 관리", icon: "🗂️" },
  { href: "/admin/content-pipeline", label: "콘텐츠 제작 파이프라인", icon: "🎬" },
  { href: "/admin/radio", label: "심야라디오 관리", icon: "🌙" },
  { href: "/admin/users", label: "유저 관리", icon: "👥" },
  { href: "/admin/memberships", label: "멤버십 관리", icon: "🎫" },
  { href: "/admin/forbidden-zone", label: "금지구역 관리", icon: "🚫" },
  { href: "/admin/writers", label: "작가실 관리", icon: "✒️" },
  { href: "/admin/reports", label: "신고/검수", icon: "🚨" },
  { href: "/admin/notices", label: "공지/이벤트", icon: "📢" },
  { href: "/admin/shop", label: "상점 관리", icon: "🛒" },
  { href: "/admin/analytics", label: "통계 분석", icon: "📈" },
  { href: "/admin/settings", label: "설정", icon: "⚙️" },
] as const;
