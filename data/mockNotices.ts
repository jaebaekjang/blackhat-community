import type { Notice } from "@/types";

/** 검은 모자의 전달사항 (공지) mock 5개. */
export const mockNotices: Notice[] = [
  {
    id: "notice-1",
    title: "검은 모자 라디오국에 오신 것을 환영합니다",
    content:
      "이곳은 검은 모자가 읽은 사건, 아직 방송되지 않은 제보, 그리고 청취자들이 남긴 해석이 모이는 곳입니다. 당신은 지금부터 단순한 시청자가 아닙니다. 심야 청취자입니다.",
    type: "일반 공지",
    visibility: "전체",
    isPinned: true,
    scheduledAt: null,
    createdAt: "2025-01-02T00:00:00.000Z",
    updatedAt: "2025-01-02T00:00:00.000Z",
  },
  {
    id: "notice-2",
    title: "제보 작성 규칙",
    content:
      "제보는 가능한 한 상세하게 적어주세요. 단, 실명·정확한 주소·전화번호·학교명·회사명 등 특정 가능한 개인정보는 작성하지 마세요. 검은 모자 라디오국은 제보자의 익명성과 타인의 권리를 보호하기 위해 일부 내용을 비공개 또는 수정할 수 있습니다.",
    type: "제보 안내",
    visibility: "전체",
    isPinned: true,
    scheduledAt: null,
    createdAt: "2025-01-03T00:00:00.000Z",
    updatedAt: "2025-01-03T00:00:00.000Z",
  },
  {
    id: "notice-3",
    title: "방송 채택 기준",
    content:
      "모든 제보가 방송되는 것은 아닙니다. 현실감, 공포지수, 방송 요청 수, 그리고 청취자들의 해석 참여도를 종합적으로 검토해 방송 후보를 선정합니다.",
    type: "방송 공지",
    visibility: "전체",
    isPinned: false,
    scheduledAt: null,
    createdAt: "2025-02-01T00:00:00.000Z",
    updatedAt: "2025-02-01T00:00:00.000Z",
  },
  {
    id: "notice-4",
    title: "개인정보 보호 안내",
    content:
      "제보에 포함된 개인정보는 관리자 검토 단계에서 비공개 처리되거나 삭제될 수 있습니다. 타인의 신상을 특정할 수 있는 내용은 신고 대상이 됩니다.",
    type: "제보 안내",
    visibility: "전체",
    isPinned: false,
    scheduledAt: null,
    createdAt: "2025-02-10T00:00:00.000Z",
    updatedAt: "2025-02-10T00:00:00.000Z",
  },
  {
    id: "notice-5",
    title: "칠죄빌라 입주 안내",
    content:
      "칠죄빌라는 검은 모자 라디오국의 핵심 세계관입니다. 칠죄빌라 입주자 멤버십에 가입하면 전용 구역과 입주자 번호, 세계관 투표권이 부여됩니다.",
    type: "칠죄빌라 공지",
    visibility: "전체",
    isPinned: false,
    scheduledAt: null,
    createdAt: "2025-03-01T00:00:00.000Z",
    updatedAt: "2025-03-01T00:00:00.000Z",
  },
];
