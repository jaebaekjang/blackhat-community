"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCollection } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockRadioRooms, mockCases } from "@/data";
import type { CaseFile, RadioRoom } from "@/types";
import { formatDateTime } from "@/lib/utils";
import { Card, SectionTitle, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toggle } from "@/components/ui/Field";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

interface ChatMessage {
  id: string;
  nickname: string;
  text: string;
}

const SEED_CHAT: ChatMessage[] = [
  { id: "chat-1", nickname: "새벽세시", text: "방금 우리집 초인종 울렸는데... 저만 그런가요?" },
  { id: "chat-2", nickname: "303호", text: "불 끄고 대기 중입니다. 이어폰 챙기세요." },
  { id: "chat-3", nickname: "겁많은청취자", text: "오늘은 진짜 혼자 못 듣겠어요 ㅠㅠ" },
  { id: "chat-4", nickname: "골목의기록", text: "이 사건 후속 제보 들어온 거 있다던데" },
];

/** 방송까지 남은 시간 문자열 계산 */
function remainingText(scheduledAt: string): string {
  const target = new Date(scheduledAt).getTime();
  if (Number.isNaN(target)) return "—";
  const diff = target - Date.now();
  if (diff <= 0) return "방송 중 / 종료";
  const totalSec = Math.floor(diff / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function RadioPage() {
  const { data: rooms } = useCollection<RadioRoom>(STORAGE_KEYS.radioRooms, mockRadioRooms);
  const { data: cases } = useCollection<CaseFile>(STORAGE_KEYS.cases, mockCases);

  // 오늘의 대기방: "대기방 오픈" 우선, 없으면 완료가 아닌 첫 방
  const featured = useMemo(() => {
    return (
      rooms.find((r) => r.status === "대기방 오픈") ??
      rooms.find((r) => r.status !== "방송 완료") ??
      rooms[0] ??
      null
    );
  }, [rooms]);

  const caseTitle = useMemo(() => {
    const map: Record<string, string> = {};
    cases.forEach((c) => (map[c.id] = c.title));
    return map;
  }, [cases]);

  // 방송 카운트다운 (SSR 안전: 효과 안에서만 계산, 초기값 "—")
  const [countdown, setCountdown] = useState("—");
  useEffect(() => {
    if (!featured) {
      setCountdown("—");
      return;
    }
    setCountdown(remainingText(featured.scheduledAt));
    const timer = setInterval(() => {
      setCountdown(remainingText(featured.scheduledAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [featured]);

  // 같이 듣기 모드 (코스메틱)
  const [listenTogether, setListenTogether] = useState(false);

  // 출석 체크
  const [attended, setAttended] = useState(false);
  const { showToast } = useToast();
  const handleAttend = () => {
    setAttended(true);
    showToast("출석 완료! +5 검은표식", "success");
  };

  // 방송 전 투표 (로컬 카운트)
  const [pollYes, setPollYes] = useState(7);
  const [pollNo, setPollNo] = useState(3);
  const [voted, setVoted] = useState(false);
  const pollTotal = pollYes + pollNo;
  const yesPct = pollTotal === 0 ? 0 : Math.round((pollYes / pollTotal) * 100);
  const noPct = pollTotal === 0 ? 0 : 100 - yesPct;
  const vote = (yes: boolean) => {
    if (yes) setPollYes((v) => v + 1);
    else setPollNo((v) => v + 1);
    setVoted(true);
  };

  // 실시간 채팅 (로컬)
  const [chat, setChat] = useState<ChatMessage[]>(SEED_CHAT);
  const [chatInput, setChatInput] = useState("");
  const sendChat = () => {
    const text = chatInput.trim();
    if (!text) return;
    setChat((prev) => [
      ...prev,
      { id: `chat-local-${prev.length}-${Date.now()}`, nickname: "나", text },
    ]);
    setChatInput("");
  };

  // 해석방 오픈 목록
  const interpretRooms = useMemo(
    () => rooms.filter((r) => r.status === "해석방 오픈"),
    [rooms],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">🌙 심야라디오</h1>
        <p className="mt-1 text-sm text-ash">
          불을 끄고 이어폰을 챙기세요. 오늘 밤, 검은 모자가 사건파일 하나를 읽습니다.
        </p>
      </div>

      {/* 오늘의 대기방 + 카운트다운 */}
      <section>
        <SectionTitle title="오늘의 대기방" subtitle="방송 시작 전까지 함께 기다립니다." />
        {featured ? (
          <Card className="border-blood/30 bg-blood/5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <StatusBadge status={featured.status} dot />
                <h3 className="mt-2 text-lg font-bold leading-snug text-zinc-100">
                  {featured.title}
                </h3>
                <p className="mt-1 text-sm text-ash-dim">
                  🕒 {formatDateTime(featured.scheduledAt)} 예정 · 👥{" "}
                  {featured.participantCount.toLocaleString("ko-KR")}명 대기 중
                </p>
              </div>
              <div className="text-right">
                <div className="text-xs text-ash-dim">방송까지</div>
                <div className="font-mono text-2xl font-bold tabular-nums text-blood-bright">
                  {countdown}
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-line pt-4">
              <Toggle
                checked={listenTogether}
                onChange={setListenTogether}
                label="같이 듣기 모드"
              />
              <Button
                size="sm"
                variant={attended ? "secondary" : "primary"}
                onClick={handleAttend}
                disabled={attended}
              >
                {attended ? "✔ 출석 완료" : "🖤 출석 체크"}
              </Button>
            </div>
            {listenTogether && (
              <p className="mt-3 text-sm text-blood-bright">
                🕯️ 불을 끄고 함께 듣는 중
              </p>
            )}
          </Card>
        ) : (
          <EmptyState
            icon="🌙"
            title="예정된 대기방이 없습니다."
            description="다음 방송이 편성되면 이곳에 가장 먼저 열립니다."
          />
        )}
      </section>

      {/* 방송 전 투표 */}
      <section>
        <SectionTitle title="방송 전 투표" subtitle="방송이 시작되기 전, 청취자들의 분위기를 확인합니다." />
        <Card>
          <p className="text-sm font-medium text-zinc-100">
            {featured?.pollQuestion ?? "이 사건 진짜 같나요?"}
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              size="sm"
              variant={voted ? "secondary" : "outline"}
              onClick={() => vote(true)}
            >
              그렇다
            </Button>
            <Button
              size="sm"
              variant={voted ? "secondary" : "outline"}
              onClick={() => vote(false)}
            >
              아니다
            </Button>
          </div>
          {voted && (
            <div className="mt-4 space-y-2">
              <PollBar label="그렇다" pct={yesPct} count={pollYes} />
              <PollBar label="아니다" pct={noPct} count={pollNo} />
              <p className="text-xs text-ash-faint">총 {pollTotal}표</p>
            </div>
          )}
        </Card>
      </section>

      {/* 유튜브 영상 플레이스홀더 */}
      <section>
        <SectionTitle title="방송 영상" subtitle="방송이 시작되면 이곳에서 실시간으로 공개됩니다." />
        <div className="panel flex aspect-video items-center justify-center text-center">
          <span className="text-sm text-ash-dim">▶ 방송 영상 (방송 시작 시 공개)</span>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="ghost" onClick={() => showToast("소름 +1 😱")}>
            😱 소름
          </Button>
          <Link href="/submit">
            <Button size="sm" variant="ghost">
              🖤 후속 제보
            </Button>
          </Link>
        </div>
      </section>

      {/* 실시간 채팅 (mock) */}
      <section>
        <SectionTitle title="실시간 채팅" subtitle="대기방에 모인 청취자들의 대화" />
        <Card className="space-y-3">
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {chat.map((m) => (
              <div key={m.id} className="text-sm">
                <span
                  className={cn(
                    "font-medium",
                    m.nickname === "나" ? "text-blood-bright" : "text-zinc-100",
                  )}
                >
                  {m.nickname}
                </span>
                <span className="ml-2 text-ash">{m.text}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-line pt-3">
            <input
              className="field"
              placeholder="채팅을 입력하세요 (로컬에만 표시됩니다)"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChat();
              }}
            />
            <Button size="md" onClick={sendChat} className="shrink-0">
              전송
            </Button>
          </div>
        </Card>
      </section>

      {/* 방송 후 해석방 */}
      <section>
        <SectionTitle title="방송 후 해석방" subtitle="방송이 끝난 사건의 해석이 이어집니다." />
        {interpretRooms.length === 0 ? (
          <EmptyState
            icon="💬"
            title="열린 해석방이 없습니다."
            description="방송이 끝나면 해석방이 이곳에 열립니다."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {interpretRooms.map((r) => (
              <Card key={r.id} hover>
                <StatusBadge status={r.status} />
                <h3 className="mt-2 font-semibold leading-snug text-zinc-100">
                  {r.title}
                </h3>
                {r.caseFileId && caseTitle[r.caseFileId] && (
                  <p className="mt-1 text-xs text-ash-dim">
                    🗂️ {caseTitle[r.caseFileId]}
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.youtubeUrl && (
                    <a href={r.youtubeUrl} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="ghost">
                        ▶ YouTube에서 보기
                      </Button>
                    </a>
                  )}
                  {r.caseFileId && (
                    <Link href={`/cases/${r.caseFileId}`}>
                      <Button size="sm" variant="outline">
                        💬 해석 남기기
                      </Button>
                    </Link>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 안내 통계 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="현재 대기 인원" value={featured?.participantCount ?? 0} accent />
        <StatCard label="열린 해석방" value={interpretRooms.length} />
        <StatCard label="편성된 방송" value={rooms.length} />
      </div>
    </div>
  );
}

function PollBar({ label, pct, count }: { label: string; pct: number; count: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-ash-dim">
        <span>{label}</span>
        <span className="tabular-nums">
          {pct}% · {count}표
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-ink-700">
        <div className="h-full rounded-full bg-blood" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
