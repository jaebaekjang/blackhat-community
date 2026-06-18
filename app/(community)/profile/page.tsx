"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useCollection, useCurrentUserId, useAdminMode } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockUsers, mockBadges, mockUserBadges, mockMemberships } from "@/data";
import type { User, Badge as BadgeType, UserBadge, MembershipTier } from "@/types";
import { setCurrentUserId } from "@/lib/storage";
import { compactNumber } from "@/lib/utils";
import { Card, SectionTitle, StatCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/EmptyState";

export default function ProfilePage() {
  const { data: users, ready } = useCollection<User>(STORAGE_KEYS.users, mockUsers);
  const { data: badges } = useCollection<BadgeType>(STORAGE_KEYS.badges, mockBadges);
  const { data: userBadges } = useCollection<UserBadge>(STORAGE_KEYS.userBadges, mockUserBadges);
  const { data: tiers } = useCollection<MembershipTier>(STORAGE_KEYS.memberships, mockMemberships);
  const { userId } = useCurrentUserId();
  const { adminMode, setAdminMode } = useAdminMode();

  const me = useMemo(() => users.find((u) => u.id === userId), [users, userId]);
  const tier = useMemo(
    () => tiers.find((t) => t.id === me?.membershipTierId),
    [tiers, me],
  );
  const myBadges = useMemo(() => {
    const ids = userBadges.filter((ub) => ub.userId === userId).map((ub) => ub.badgeId);
    return badges.filter((b) => ids.includes(b.id));
  }, [userBadges, badges, userId]);

  if (!ready || !me) return <LoadingState />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-100">📁 내 기록실</h1>

      {/* 프로필 카드 */}
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-line bg-ink-800 text-2xl">
              🎭
            </div>
            <div>
              <div className="text-lg font-bold text-zinc-100">{me.nickname}</div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <Badge variant="info">{me.grade}</Badge>
                {tier && <Badge variant="villa">{tier.name}</Badge>}
                <span className="text-xs text-ash-faint">Lv.{me.level}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-ash-dim">검은표식</div>
            <div className="text-2xl font-bold text-blood-bright">
              {compactNumber(me.points)}
            </div>
          </div>
        </div>
      </Card>

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="내 제보 수" value={me.submissionCount} />
        <StatCard label="방송 채택 수" value={me.broadcastAdoptedCount} accent />
        <StatCard label="댓글 수" value={me.commentCount} />
        <StatCard label="저장한 사건 수" value={me.savedCaseCount} />
      </div>

      {/* 보유 배지 */}
      <section>
        <SectionTitle title="보유 배지" subtitle={`${myBadges.length}개`} />
        {myBadges.length === 0 ? (
          <Card>
            <p className="text-sm text-ash-dim">아직 획득한 배지가 없습니다.</p>
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {myBadges.map((b) => (
              <Card key={b.id}>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{b.icon}</span>
                  <div>
                    <div className="text-sm font-medium text-zinc-100">{b.name}</div>
                    <div className="text-xs text-ash-faint">{b.condition}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 내 공포 취향 */}
      <section>
        <SectionTitle title="내 공포 취향" />
        <Card className="border-blood/20 bg-blood/5">
          <p className="text-sm leading-relaxed text-ash">
            당신은 <b className="text-blood-bright">“현실형 공포”</b>를 가장
            무서워합니다. 귀신보다 사람, 폐가보다 아파트, 갑툭튀보다 찝찝한 엔딩에
            강하게 반응합니다.
          </p>
        </Card>
      </section>

      {/* 관리자 모드 + 계정 전환 */}
      <section>
        <SectionTitle title="설정" subtitle="프로토타입 전용 컨트롤" />
        <Card className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-zinc-100">관리자 모드</div>
              <div className="text-xs text-ash-dim">
                라디오국 관리자실 접근을 활성화합니다.
              </div>
            </div>
            <Toggle checked={adminMode} onChange={setAdminMode} />
          </div>
          {adminMode && (
            <Link href="/admin">
              <Button variant="secondary" className="w-full sm:w-auto">
                🛠️ 라디오국 관리자실 입장
              </Button>
            </Link>
          )}

          <div className="border-t border-line pt-4">
            <div className="field-label">계정 전환 (mock)</div>
            <select
              className="field"
              value={userId}
              onChange={(e) => setCurrentUserId(e.target.value)}
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nickname} ({u.role} / {u.grade})
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-ash-faint">
              여러 청취자 시점으로 전환해 테스트할 수 있습니다.
            </p>
          </div>
        </Card>
      </section>
    </div>
  );
}
