import type { RadioRoom } from "@/types";

/** 심야라디오 대기방 / 방송 / 해석방 mock. */
export const mockRadioRooms: RadioRoom[] = [
  {
    id: "radio-1",
    title: "오늘 밤 친무썰 - 새벽 3시마다 울리는 초인종",
    caseFileId: "case-1",
    scheduledAt: "2026-06-18T22:00:00.000Z",
    status: "대기방 오픈",
    youtubeUrl: null,
    participantCount: 312,
    pollQuestion: "오늘 혼자 듣나요?",
    createdAt: "2026-06-18T09:00:00.000Z",
    updatedAt: "2026-06-18T09:00:00.000Z",
  },
  {
    id: "radio-2",
    title: "칠죄빌라 101호 해석방",
    caseFileId: "case-8",
    scheduledAt: "2026-06-08T22:00:00.000Z",
    status: "해석방 오픈",
    youtubeUrl: "https://www.youtube.com/watch?v=blackhat0001",
    participantCount: 540,
    pollQuestion: "이 사건 진짜 같나요?",
    createdAt: "2026-06-08T09:00:00.000Z",
    updatedAt: "2026-06-09T09:00:00.000Z",
  },
  {
    id: "radio-3",
    title: "나폴리탄 특집 - 엘리베이터 13층 (예정)",
    caseFileId: "case-7",
    scheduledAt: "2026-06-21T22:00:00.000Z",
    status: "방송 전",
    youtubeUrl: null,
    participantCount: 0,
    pollQuestion: "후속편이 필요하다고 생각하나요?",
    createdAt: "2026-06-15T09:00:00.000Z",
    updatedAt: "2026-06-15T09:00:00.000Z",
  },
];
