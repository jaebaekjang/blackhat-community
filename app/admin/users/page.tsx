"use client";

import { useMemo, useState } from "react";
import { USER_GRADES } from "@/types";
import type {
  User,
  MembershipTier,
  Badge as BadgeModel,
  UserBadge,
  UserGrade,
} from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockUsers, mockMemberships, mockBadges, mockUserBadges } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { createItem, updateItem } from "@/lib/storage";
import { formatDate, generateId, nowISO } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { TextField, TextArea, SelectField } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export default function UsersAdminPage() {
  const { showToast } = useToast();
  const { data: users } = useCollection<User>(STORAGE_KEYS.users, mockUsers);
  const { data: memberships } = useCollection<MembershipTier>(STORAGE_KEYS.memberships, mockMemberships);
  const { data: badges } = useCollection<BadgeModel>(STORAGE_KEYS.badges, mockBadges);
  const { data: userBadges } = useCollection<UserBadge>(STORAGE_KEYS.userBadges, mockUserBadges);

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const tierNameById = useMemo(() => {
    const map: Record<string, string> = {};
    memberships.forEach((m) => (map[m.id] = m.name));
    return map;
  }, [memberships]);

  const filtered = useMemo(() => {
    let list = users;
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (u) => u.nickname.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [users, query]);

  const selected = users.find((u) => u.id === selectedId) ?? null;

  const columns: Column<User>[] = [
    {
      key: "nickname",
      header: "닉네임",
      render: (u) => <span className="font-medium text-zinc-100">{u.nickname}</span>,
    },
    { key: "email", header: "이메일", render: (u) => <span className="text-xs text-ash">{u.email}</span>, hideOnMobile: true },
    { key: "grade", header: "등급", render: (u) => <Badge variant="neutral">{u.grade}</Badge> },
    {
      key: "membership",
      header: "멤버십",
      render: (u) => (
        <span className="text-xs text-ash">{u.membershipTierId ? tierNameById[u.membershipTierId] ?? "-" : "-"}</span>
      ),
      hideOnMobile: true,
    },
    { key: "submissionCount", header: "제보 수", render: (u) => <span className="tabular-nums">{u.submissionCount}</span>, hideOnMobile: true },
    { key: "commentCount", header: "댓글 수", render: (u) => <span className="tabular-nums">{u.commentCount}</span>, hideOnMobile: true },
    { key: "broadcastAdoptedCount", header: "방송 채택", render: (u) => <span className="tabular-nums">{u.broadcastAdoptedCount}</span>, hideOnMobile: true },
    {
      key: "reportedCount",
      header: "신고 받은 수",
      render: (u) =>
        u.reportedCount >= 3 ? (
          <Badge variant="danger">{u.reportedCount}</Badge>
        ) : (
          <span className="tabular-nums">{u.reportedCount}</span>
        ),
    },
    { key: "createdAt", header: "가입일", render: (u) => <span className="text-xs text-ash-faint">{formatDate(u.createdAt)}</span>, hideOnMobile: true },
    { key: "lastActiveAt", header: "최근 접속", render: (u) => <span className="text-xs text-ash-faint">{formatDate(u.lastActiveAt)}</span>, hideOnMobile: true },
    {
      key: "status",
      header: "상태",
      render: (u) => (u.status === "banned" ? <Badge variant="danger">banned</Badge> : <StatusBadge status={u.status} />),
    },
    {
      key: "actions",
      header: "관리",
      render: (u) => (
        <Button size="sm" variant="secondary" onClick={() => setSelectedId(u.id)}>
          관리
        </Button>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="유저 관리"
        description="유저 등급/멤버십/검은표식/배지/제재를 관리합니다."
      />

      <input
        className="field mb-4"
        placeholder="🔍 닉네임 / 이메일 검색"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(u) => u.id}
        emptyLabel="해당 조건의 유저가 없습니다."
      />

      <UserManager
        user={selected}
        memberships={memberships}
        badges={badges}
        userBadges={selected ? userBadges.filter((ub) => ub.userId === selected.id) : []}
        onClose={() => setSelectedId(null)}
        onToast={showToast}
      />
    </div>
  );
}

function UserManager({
  user,
  memberships,
  badges,
  userBadges,
  onClose,
  onToast,
}: {
  user: User | null;
  memberships: MembershipTier[];
  badges: BadgeModel[];
  userBadges: UserBadge[];
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [grade, setGrade] = useState<UserGrade>(USER_GRADES[0]);
  const [tierName, setTierName] = useState("");
  const [pointDelta, setPointDelta] = useState(0);
  const [badgeName, setBadgeName] = useState("");
  const [memo, setMemo] = useState("");
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  const tierNames = useMemo(() => memberships.map((m) => m.name), [memberships]);
  const badgeNames = useMemo(() => badges.map((b) => b.name), [badges]);

  const ownedBadgeIds = useMemo(() => new Set(userBadges.map((ub) => ub.badgeId)), [userBadges]);

  if (!user) return null;
  const u = user;

  // 모달 열릴 때 1회 초기화
  if (hydratedId !== u.id) {
    setGrade(u.grade);
    setTierName(u.membershipTierId ? memberships.find((m) => m.id === u.membershipTierId)?.name ?? (tierNames[0] ?? "") : (tierNames[0] ?? ""));
    setPointDelta(0);
    setBadgeName(badgeNames[0] ?? "");
    setMemo("");
    setHydratedId(u.id);
  }

  const patch = (updates: Partial<User>, msg: string) => {
    updateItem<User>(STORAGE_KEYS.users, u.id, updates);
    onToast(msg, "success");
  };

  const changeGrade = () => patch({ grade }, `등급을 '${grade}'(으)로 변경했습니다.`);

  const changeMembership = () => {
    const tier = memberships.find((m) => m.name === tierName);
    patch({ membershipTierId: tier ? tier.id : null }, `멤버십을 '${tierName}'(으)로 변경했습니다.`);
  };

  const addPoints = () => {
    const next = u.points + Math.abs(Number(pointDelta));
    patch({ points: next }, `검은표식 ${Math.abs(Number(pointDelta))} 지급 (총 ${next})`);
  };

  const subPoints = () => {
    const next = Math.max(0, u.points - Math.abs(Number(pointDelta)));
    patch({ points: next }, `검은표식 ${Math.abs(Number(pointDelta))} 차감 (총 ${next})`);
  };

  const giveBadge = () => {
    const badge = badges.find((b) => b.name === badgeName);
    if (!badge) {
      onToast("배지를 선택해주세요.", "error");
      return;
    }
    if (ownedBadgeIds.has(badge.id)) {
      onToast("이미 보유한 배지입니다.", "info");
      return;
    }
    const ts = nowISO();
    const ub: UserBadge = {
      id: generateId("ub"),
      userId: u.id,
      badgeId: badge.id,
      earnedAt: ts,
      createdAt: ts,
      updatedAt: ts,
    };
    createItem(STORAGE_KEYS.userBadges, ub);
    onToast(`'${badge.name}' 배지를 지급했습니다.`, "success");
  };

  const giveWarning = () =>
    patch({ warningCount: u.warningCount + 1, status: "warned" }, `경고를 부여했습니다. (누적 ${u.warningCount + 1})`);

  return (
    <Modal open={!!user} onClose={onClose} title={`${u.nickname} 관리`}>
      <div className="space-y-4 text-sm">
        {/* 요약 */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-ash-dim">{u.email}</span>
          {u.status === "banned" ? (
            <Badge variant="danger">banned</Badge>
          ) : (
            <StatusBadge status={u.status} />
          )}
          <Badge variant="neutral">검은표식 {u.points.toLocaleString("ko-KR")}</Badge>
          {u.reportedCount >= 3 && <Badge variant="danger">신고 {u.reportedCount}</Badge>}
        </div>

        {/* 등급 변경 */}
        <div className="flex items-end gap-2">
          <SelectField
            label="등급 변경"
            className="flex-1"
            options={USER_GRADES}
            value={grade}
            onChange={(e) => setGrade(e.target.value as UserGrade)}
          />
          <Button variant="secondary" onClick={changeGrade}>
            적용
          </Button>
        </div>

        {/* 멤버십 변경 */}
        <div className="flex items-end gap-2">
          <SelectField
            label="멤버십 변경"
            className="flex-1"
            options={tierNames}
            value={tierName}
            onChange={(e) => setTierName(e.target.value)}
          />
          <Button variant="secondary" onClick={changeMembership}>
            적용
          </Button>
        </div>

        {/* 검은표식 지급/차감 */}
        <div>
          <div className="field-label">검은표식 지급 / 차감</div>
          <div className="flex items-center gap-2">
            <input
              className="field"
              type="number"
              min={0}
              value={pointDelta}
              onChange={(e) => setPointDelta(Number(e.target.value))}
            />
            <Button size="sm" variant="secondary" onClick={addPoints}>
              지급
            </Button>
            <Button size="sm" variant="secondary" onClick={subPoints}>
              차감
            </Button>
          </div>
        </div>

        {/* 배지 지급 */}
        <div className="flex items-end gap-2">
          <SelectField
            label="배지 지급"
            className="flex-1"
            options={badgeNames}
            value={badgeName}
            onChange={(e) => setBadgeName(e.target.value)}
          />
          <Button variant="secondary" onClick={giveBadge}>
            지급
          </Button>
        </div>
        {userBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {userBadges.map((ub) => {
              const b = badges.find((x) => x.id === ub.badgeId);
              return (
                <Badge key={ub.id} variant="info">
                  {b ? `${b.icon} ${b.name}` : ub.badgeId}
                </Badge>
              );
            })}
          </div>
        )}

        {/* 제재 */}
        <div className="border-t border-line pt-3">
          <div className="field-label">제재 / 상태</div>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={giveWarning}>
              경고 부여
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => patch({ status: "restricted" }, "댓글을 제한했습니다.")}
            >
              댓글 제한
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => patch({ status: "restricted" }, "제보를 제한했습니다.")}
            >
              제보 제한
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => patch({ status: "banned" }, "유저를 차단했습니다.")}
            >
              차단
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => patch({ status: "active" }, "제재를 해제했습니다.")}
            >
              제재 해제
            </Button>
          </div>
        </div>

        {/* 관리자 메모 (mock — User 타입에 필드 없음, 로컬 보관) */}
        <div className="border-t border-line pt-3">
          <TextArea
            label="관리자 메모"
            placeholder="이 유저에 대한 내부 메모... (저장은 mock)"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
          <div className="mt-2 flex justify-end">
            <Button variant="ghost" onClick={() => onToast("메모 저장 (mock)", "info")}>
              메모 저장
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
