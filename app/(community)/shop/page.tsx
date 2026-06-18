"use client";

import { useMemo, useState } from "react";
import { useCollection, useCurrentUserId } from "@/hooks/useStorage";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockProducts, mockUsers, mockMemberships } from "@/data";
import { PRODUCT_CATEGORIES } from "@/types";
import type { Product, User, MembershipTier } from "@/types";
import { updateItem } from "@/lib/storage";
import { formatPrice, cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/Toast";

const FILTERS: string[] = ["전체", ...PRODUCT_CATEGORIES];

export default function ShopPage() {
  const { showToast } = useToast();
  const { data: products } = useCollection<Product>(STORAGE_KEYS.products, mockProducts);
  const { data: users } = useCollection<User>(STORAGE_KEYS.users, mockUsers);
  const { data: tiers } = useCollection<MembershipTier>(STORAGE_KEYS.memberships, mockMemberships);
  const { userId } = useCurrentUserId();

  const [category, setCategory] = useState<string>("전체");

  const me = useMemo(() => users.find((u) => u.id === userId), [users, userId]);
  // 유료 멤버 여부: 무료 회원(accessLevel 0) 또는 미가입이면 멤버 아님
  const isMember = useMemo(() => {
    const tier = tiers.find((t) => t.id === me?.membershipTierId);
    return !!tier && tier.accessLevel > 0;
  }, [tiers, me]);

  const filtered = useMemo(() => {
    if (category === "전체") return products;
    return products.filter((p) => p.category === category);
  }, [products, category]);

  const handleBuy = (p: Product) => {
    updateItem<Product>(STORAGE_KEYS.products, p.id, {
      purchaseCount: p.purchaseCount + 1,
    });
    showToast("구매가 완료되었습니다. (mock 결제)", "success");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100">🛒 상점</h1>
        <p className="mt-1 text-sm text-ash">
          검은 모자 라디오국의 굿즈와 디지털 아이템을 만나보세요.
        </p>
      </div>

      <p className="text-xs text-ash-faint">구매는 mock 으로 처리됩니다.</p>

      {/* 카테고리 필터 */}
      <div className="-mx-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setCategory(f)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors",
              category === f
                ? "border-blood/50 bg-blood/15 text-blood-bright"
                : "border-line text-ash-dim hover:text-zinc-100",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="🛒"
          title="해당 카테고리의 상품이 없습니다."
          description="다른 카테고리를 선택해보세요."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const memberLocked = p.isMemberOnly && !isMember;
            return (
              <Card key={p.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-base font-semibold text-zinc-100">{p.name}</div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {p.isMemberOnly && <Badge variant="villa">멤버 전용</Badge>}
                    {p.isSoldOut && <Badge variant="danger">품절</Badge>}
                  </div>
                </div>

                <Badge variant="neutral" className="self-start">
                  {p.category}
                </Badge>

                <p className="text-sm leading-relaxed text-ash">{p.description}</p>

                <div className="flex items-center justify-between gap-3">
                  <span className="text-lg font-bold text-blood-bright">
                    {formatPrice(p.price)}
                  </span>
                  <span className="text-xs text-ash-faint">
                    누적 {p.purchaseCount.toLocaleString("ko-KR")} 구매
                  </span>
                </div>

                <div className="mt-auto">
                  {p.isSoldOut ? (
                    <Button variant="secondary" className="w-full" disabled>
                      품절
                    </Button>
                  ) : memberLocked ? (
                    <div>
                      <Button variant="secondary" className="w-full" disabled>
                        멤버 전용
                      </Button>
                      <p className="mt-1 text-xs text-ash-faint">
                        멤버십 가입 후 구매할 수 있습니다.
                      </p>
                    </div>
                  ) : (
                    <Button className="w-full" onClick={() => handleBuy(p)}>
                      구매 (mock)
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
