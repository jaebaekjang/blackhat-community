import type { MembershipTier } from "@/types";

/**
 * 멤버십 등급 mock.
 * 멤버십은 콘텐츠 구매가 아니라 라디오국 안에서의 권한이다.
 */
export const mockMemberships: MembershipTier[] = [
  {
    id: "tier-free",
    name: "무료 회원",
    price: 0,
    description: "검은 모자 라디오국의 기본 청취자입니다.",
    benefits: ["제보 가능", "댓글 가능", "사건파일 열람", "방송 요청 가능"],
    accessLevel: 0,
    subscriberCount: 1842,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tier-night",
    name: "심야 청취자",
    price: 2900,
    description: "밤마다 라디오국에 접속하는 단골 청취자.",
    benefits: ["멤버 배지", "선공개 사건파일", "방송 전 투표", "멤버 전용 댓글 뱃지"],
    accessLevel: 1,
    subscriberCount: 312,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tier-recorder",
    name: "기록자",
    price: 7900,
    description: "사건을 기록하고 해석하는 깊은 청취자.",
    benefits: [
      "미공개 대본",
      "방송 후보 사건 먼저 보기",
      "검은 모자 해석 노트",
      "멤버 전용 해석방",
    ],
    accessLevel: 2,
    subscriberCount: 128,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tier-villa",
    name: "칠죄빌라 입주자",
    price: 14900,
    description: "칠죄빌라 세계관의 정식 입주자.",
    benefits: [
      "칠죄빌라 전용 구역",
      "입주자 번호",
      "세계관 투표권",
      "외전 선공개",
      "한정 굿즈 우선권",
    ],
    accessLevel: 3,
    subscriberCount: 47,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
  {
    id: "tier-staff",
    name: "라디오국 관계자",
    price: 29900,
    description: "라디오국 운영에 가장 가까이 있는 청취자.",
    benefits: [
      "비공개 라이브",
      "기획 회의 투표",
      "다음 시리즈 방향 투표",
      "엔딩 크레딧 닉네임",
      "특별 사건파일 열람",
    ],
    accessLevel: 4,
    subscriberCount: 19,
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: "2025-01-01T00:00:00.000Z",
  },
];
