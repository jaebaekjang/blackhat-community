"use client";

import { useMemo, useState } from "react";
import { MEMBERSHIP_TIERS } from "@/types";
import type { MembershipTier, User } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockMemberships, mockUsers } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { updateItem } from "@/lib/storage";
import { formatPrice } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { Card, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { TextField, TextArea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export default function MembershipsAdminPage() {
  const { showToast } = useToast();
  const { data: memberships } = useCollection<MembershipTier>(STORAGE_KEYS.memberships, mockMemberships);
  const { data: users } = useCollection<User>(STORAGE_KEYS.users, mockUsers);

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sortedTiers = useMemo(
    () => [...memberships].sort((a, b) => a.accessLevel - b.accessLevel),
    [memberships],
  );

  // 유저 기준 실시간 가입자 수 (티어별)
  const liveCountByTier = useMemo(() => {
    const map: Record<string, number> = {};
    users.forEach((u) => {
      if (u.membershipTierId) map[u.membershipTierId] = (map[u.membershipTierId] || 0) + 1;
    });
    return map;
  }, [users]);

  // 총 가입자 (유료 티어 subscriberCount 합)
  const paidSubscribers = useMemo(
    () => memberships.filter((m) => m.price > 0).reduce((sum, m) => sum + m.subscriberCount, 0),
    [memberships],
  );

  // 월 예상 매출 (mock)
  const monthlyRevenue = useMemo(
    () => memberships.reduce((sum, m) => sum + m.price * m.subscriberCount, 0),
    [memberships],
  );

  const selected = memberships.find((m) => m.id === selectedId) ?? null;

  return (
    <div>
      <AdminPageHeader
        title="멤버십 관리"
        description="멤버십 등급별 가격/혜택/가입자를 관리하고 멤버 전용 콘텐츠를 설정합니다."
      />

      {/* 요약 */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatCard label="총 유료 가입자" value={paidSubscribers.toLocaleString("ko-KR")} sub="유료 티어 합계" />
        <StatCard label="월 예상 매출 (mock)" value={formatPrice(monthlyRevenue)} accent />
        <StatCard label="멤버십 등급 수" value={memberships.length} />
      </div>

      {/* 멤버 전용 도구 (mock) */}
      <Card className="mb-5">
        <div className="mb-2 text-sm font-semibold text-zinc-100">멤버 전용 도구</div>
        <p className="mb-3 text-xs text-ash-dim">
          멤버 전용 공지를 작성하거나, 사건파일/대본을 특정 멤버십 이상에게만 공개하도록 설정합니다. (mock)
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => showToast("멤버 전용 공지 작성 화면을 열었습니다. (mock)", "info")}>
            멤버 전용 공지 작성
          </Button>
          <Button size="sm" variant="secondary" onClick={() => showToast("멤버 전용 파일 공개 설정을 저장했습니다. (mock)", "info")}>
            멤버 전용 파일 공개 설정
          </Button>
        </div>
      </Card>

      {/* 티어 카드 */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sortedTiers.map((tier) => {
          const liveCount = liveCountByTier[tier.id] || 0;
          return (
            <Card key={tier.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-zinc-100">{tier.name}</span>
                    <Badge variant={tier.price > 0 ? "broadcast" : "neutral"}>{formatPrice(tier.price)}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-ash-dim">{tier.description}</p>
                </div>
                <Button size="sm" variant="secondary" onClick={() => setSelectedId(tier.id)}>
                  편집
                </Button>
              </div>

              <ul className="mt-3 space-y-1 text-xs text-ash">
                {tier.benefits.map((b, i) => (
                  <li key={i} className="flex gap-1.5">
                    <span className="text-blood-bright">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-3 flex items-center gap-4 border-t border-line pt-3 text-xs">
                <span className="text-ash-dim">
                  가입자(mock) <span className="tabular-nums text-zinc-100">{tier.subscriberCount.toLocaleString("ko-KR")}</span>
                </span>
                <span className="text-ash-dim">
                  현재 유저 <span className="tabular-nums text-zinc-100">{liveCount}</span>
                </span>
              </div>
            </Card>
          );
        })}
      </div>

      {/* 기준 등급 목록 */}
      <div className="mt-6">
        <div className="mb-2 text-sm font-semibold text-zinc-100">멤버십 등급 기준</div>
        <div className="flex flex-wrap gap-1.5">
          {MEMBERSHIP_TIERS.map((name) => (
            <Badge key={name} variant="neutral">
              {name}
            </Badge>
          ))}
        </div>
      </div>

      <TierEditor tier={selected} onClose={() => setSelectedId(null)} onToast={showToast} />
    </div>
  );
}

function TierEditor({
  tier,
  onClose,
  onToast,
}: {
  tier: MembershipTier | null;
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [price, setPrice] = useState(0);
  const [description, setDescription] = useState("");
  const [benefits, setBenefits] = useState("");
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  if (!tier) return null;
  const t = tier;

  // 모달 열릴 때 1회 초기화
  if (hydratedId !== t.id) {
    setPrice(t.price);
    setDescription(t.description);
    setBenefits(t.benefits.join("\n"));
    setHydratedId(t.id);
  }

  const save = () => {
    const parsedBenefits = benefits
      .split(/[\n,]/)
      .map((b) => b.trim())
      .filter(Boolean);
    updateItem<MembershipTier>(STORAGE_KEYS.memberships, t.id, {
      price: Math.max(0, Number(price)),
      description: description.trim(),
      benefits: parsedBenefits,
    });
    onToast(`'${t.name}' 멤버십을 저장했습니다.`, "success");
    onClose();
  };

  return (
    <Modal open={!!tier} onClose={onClose} title={`${t.name} 편집`}>
      <div className="space-y-4 text-sm">
        <TextField
          label="월 가격 (원)"
          type="number"
          min={0}
          value={price}
          onChange={(e) => setPrice(Number(e.target.value))}
        />
        <TextField
          label="설명"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <TextArea
          label="혜택 (줄바꿈 또는 쉼표 구분)"
          value={benefits}
          onChange={(e) => setBenefits(e.target.value)}
        />
        <div className="flex justify-end border-t border-line pt-3">
          <Button onClick={save}>저장</Button>
        </div>
      </div>
    </Modal>
  );
}
