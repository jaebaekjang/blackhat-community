"use client";

import { useMemo } from "react";
import { useCollection, useCurrentUserId } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockMemberships, mockUsers } from "@/data";
import type { MembershipTier, User } from "@/types";
import { updateItem } from "@/lib/storage";
import { formatPrice, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { LoadingState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

export default function MembershipPage() {
  const { showToast } = useToast();
  const { data: tiers, ready } = useCollection<MembershipTier>(
    STORAGE_KEYS.memberships,
    mockMemberships,
  );
  const { data: users } = useCollection<User>(STORAGE_KEYS.users, mockUsers);
  const { userId } = useCurrentUserId();

  const me = useMemo(() => users.find((u) => u.id === userId), [users, userId]);

  const sortedTiers = useMemo(
    () => [...tiers].sort((a, b) => a.accessLevel - b.accessLevel),
    [tiers],
  );

  const handleSubscribe = (tier: MembershipTier) => {
    updateItem<User>(STORAGE_KEYS.users, userId, { membershipTierId: tier.id });
    showToast(`'${tier.name}' 권한이 활성화되었습니다. (mock 결제)`, "success");
  };

  if (!ready) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">🎫 멤버십</h1>
        <p className="mt-1 text-sm text-ash">
          멤버십은 콘텐츠 구매가 아니라, 라디오국 안에서의 권한입니다.
        </p>
      </div>

      <p className="text-xs text-ash-faint">
        결제는 mock 으로 처리됩니다. 실제 결제는 발생하지 않습니다.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sortedTiers.map((tier) => {
          const isCurrent = me?.membershipTierId === tier.id;
          const isVilla = tier.name === "칠죄빌라 입주자";
          return (
            <Card
              key={tier.id}
              className={cn(
                "flex flex-col gap-3",
                isCurrent && "border-blood bg-blood/5",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="text-base font-semibold text-zinc-100">{tier.name}</div>
                {isCurrent ? (
                  <Badge variant="danger">현재 멤버십</Badge>
                ) : (
                  isVilla && <Badge variant="villa">칠죄빌라</Badge>
                )}
              </div>

              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold text-blood-bright">
                  {formatPrice(tier.price)}
                </span>
                {tier.price > 0 && <span className="text-xs text-ash-dim">/월</span>}
              </div>

              <p className="text-sm leading-relaxed text-ash">{tier.description}</p>

              <ul className="space-y-1.5">
                {tier.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm text-ash">
                    <span className="text-emerald-300">✓</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              <div className="text-xs text-ash-faint">
                현재 {tier.subscriberCount.toLocaleString("ko-KR")}명 이용 중
              </div>

              <div className="mt-auto">
                {isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    이용 중
                  </Button>
                ) : (
                  <Button className="w-full" onClick={() => handleSubscribe(tier)}>
                    이 권한 받기 (mock 결제)
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
