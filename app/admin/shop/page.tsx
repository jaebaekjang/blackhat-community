"use client";

import { useMemo, useState } from "react";
import { PRODUCT_CATEGORIES } from "@/types";
import type { Product, ProductCategory } from "@/types";
import { STORAGE_KEYS } from "@/lib/constants";
import { mockProducts } from "@/data";
import { useCollection } from "@/hooks/useStorage";
import { createItem, updateItem, softDeleteItem } from "@/lib/storage";
import { generateId, nowISO, formatPrice } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { AdminPageHeader } from "@/components/admin/AdminPage";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Card, SectionTitle, StatCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Modal, ConfirmDialog } from "@/components/ui/Modal";
import { TextField, TextArea, SelectField, Toggle } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export default function ShopAdminPage() {
  const { showToast } = useToast();
  const { data: products } = useCollection<Product>(STORAGE_KEYS.products, mockProducts);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("전체");

  // 추가 폼 상태
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>(PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isMemberOnly, setIsMemberOnly] = useState(false);
  const [isSoldOut, setIsSoldOut] = useState(false);

  const summary = useMemo(() => {
    const totalPurchases = products.reduce((s, p) => s + p.purchaseCount, 0);
    const revenue = products.reduce((s, p) => s + p.price * p.purchaseCount, 0);
    return {
      totalProducts: products.length,
      totalPurchases,
      revenue,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const list =
      categoryFilter === "전체" ? products : products.filter((p) => p.category === categoryFilter);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [products, categoryFilter]);

  const selected = products.find((p) => p.id === selectedId) ?? null;
  const deleting = products.find((p) => p.id === deleteId) ?? null;

  const resetForm = () => {
    setName("");
    setCategory(PRODUCT_CATEGORIES[0]);
    setPrice("");
    setDescription("");
    setIsMemberOnly(false);
    setIsSoldOut(false);
  };

  const handleCreate = () => {
    if (!name.trim()) {
      showToast("상품명을 입력해주세요.", "error");
      return;
    }
    const ts = nowISO();
    const product: Product = {
      id: generateId("product"),
      name: name.trim(),
      price: Number(price) || 0,
      category,
      description: description.trim(),
      isMemberOnly,
      isSoldOut,
      purchaseCount: 0,
      createdAt: ts,
      updatedAt: ts,
    };
    createItem(STORAGE_KEYS.products, product);
    showToast("상품을 추가했습니다.", "success");
    resetForm();
  };

  const columns: Column<Product>[] = [
    { key: "name", header: "상품명", render: (p) => <span className="font-medium text-zinc-100">{p.name}</span> },
    { key: "category", header: "카테고리", render: (p) => <Badge variant="neutral">{p.category}</Badge>, hideOnMobile: true },
    { key: "price", header: "가격", render: (p) => formatPrice(p.price) },
    {
      key: "isMemberOnly",
      header: "멤버 전용",
      render: (p) => (p.isMemberOnly ? <Badge variant="villa">멤버 전용</Badge> : "-"),
      hideOnMobile: true,
    },
    {
      key: "isSoldOut",
      header: "품절",
      render: (p) =>
        p.isSoldOut ? <Badge variant="danger">품절</Badge> : <Badge variant="success">판매중</Badge>,
    },
    { key: "purchaseCount", header: "구매 수", render: (p) => p.purchaseCount, hideOnMobile: true },
    {
      key: "actions",
      header: "관리",
      render: (p) => (
        <div className="flex flex-wrap gap-1.5">
          <Button size="sm" variant="secondary" onClick={() => setSelectedId(p.id)}>
            편집
          </Button>
          <Button size="sm" variant="danger" onClick={() => setDeleteId(p.id)}>
            삭제
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="상점 관리" description="상품 등록, 가격, 멤버 전용/품절 여부와 판매 통계를 관리합니다." />

      {/* 요약 통계 */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="총 상품 수" value={summary.totalProducts} />
        <StatCard label="총 구매 수" value={summary.totalPurchases} />
        <StatCard label="매출 (mock)" value={formatPrice(summary.revenue)} sub="가격 × 구매 수" accent />
      </div>

      {/* 카테고리 필터 */}
      <div className="mb-4 flex flex-wrap gap-1.5">
        {["전체", ...PRODUCT_CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              categoryFilter === cat
                ? "border-blood/50 bg-blood/15 text-blood-bright"
                : "border-line text-ash-dim hover:text-zinc-100",
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 상품 추가 */}
      <Card className="mb-6">
        <SectionTitle title="상품 추가" subtitle="새 상품을 상점에 등록합니다." />
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField label="상품명" required value={name} onChange={(e) => setName(e.target.value)} placeholder="상품 이름" />
            <SelectField
              label="카테고리"
              options={PRODUCT_CATEGORIES}
              value={category}
              onChange={(e) => setCategory(e.target.value as ProductCategory)}
            />
          </div>
          <TextField
            label="가격 (원)"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0"
            hint="0 이면 무료로 표시됩니다."
          />
          <TextArea label="설명" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="상품 설명" />
          <div className="flex flex-wrap items-center gap-6">
            <Toggle checked={isMemberOnly} onChange={setIsMemberOnly} label="멤버 전용" />
            <Toggle checked={isSoldOut} onChange={setIsSoldOut} label="품절" />
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreate}>상품 추가</Button>
          </div>
        </div>
      </Card>

      {/* 상품 목록 */}
      <SectionTitle title="상품 목록" subtitle={`${filtered.length}개 상품`} />
      <DataTable columns={columns} rows={filtered} getRowKey={(p) => p.id} emptyLabel="상품이 없습니다." />

      <ProductEditor product={selected} onClose={() => setSelectedId(null)} onToast={showToast} />

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleteId(null)}
        onConfirm={() => {
          if (deleting) {
            softDeleteItem(STORAGE_KEYS.products, deleting.id);
            showToast("상품을 삭제했습니다.", "success");
          }
        }}
        title="상품을 삭제하시겠습니까?"
        description={deleting ? `'${deleting.name}' 상품이 삭제됩니다.` : undefined}
      />
    </div>
  );
}

function ProductEditor({
  product,
  onClose,
  onToast,
}: {
  product: Product | null;
  onClose: () => void;
  onToast: (m: string, t?: "success" | "error" | "info") => void;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>(PRODUCT_CATEGORIES[0]);
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [isMemberOnly, setIsMemberOnly] = useState(false);
  const [isSoldOut, setIsSoldOut] = useState(false);
  const [hydratedId, setHydratedId] = useState<string | null>(null);

  if (!product) return null;
  const p = product;

  // 모달 열릴 때 1회 초기화
  if (hydratedId !== p.id) {
    setName(p.name);
    setCategory(p.category);
    setPrice(String(p.price));
    setDescription(p.description);
    setIsMemberOnly(p.isMemberOnly);
    setIsSoldOut(p.isSoldOut);
    setHydratedId(p.id);
  }

  const handleSave = () => {
    if (!name.trim()) {
      onToast("상품명을 입력해주세요.", "error");
      return;
    }
    updateItem<Product>(STORAGE_KEYS.products, p.id, {
      name: name.trim(),
      price: Number(price) || 0,
      category,
      description: description.trim(),
      isMemberOnly,
      isSoldOut,
    });
    onToast("상품을 저장했습니다.", "success");
    onClose();
  };

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title="상품 편집"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button onClick={handleSave}>저장</Button>
        </>
      }
    >
      <div className="space-y-3 text-sm">
        <TextField label="상품명" required value={name} onChange={(e) => setName(e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="카테고리"
            options={PRODUCT_CATEGORIES}
            value={category}
            onChange={(e) => setCategory(e.target.value as ProductCategory)}
          />
          <TextField label="가격 (원)" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <TextArea label="설명" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="flex flex-wrap items-center gap-6">
          <Toggle checked={isMemberOnly} onChange={setIsMemberOnly} label="멤버 전용" />
          <Toggle checked={isSoldOut} onChange={setIsSoldOut} label="품절" />
        </div>
      </div>
    </Modal>
  );
}
