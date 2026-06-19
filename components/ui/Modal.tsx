"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./Button";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "panel relative z-10 max-h-[90vh] w-full max-w-lg animate-fade-in overflow-y-auto rounded-b-none rounded-t-2xl sm:rounded-2xl",
          className,
        )}
      >
        {title && (
          <div className="mb-3 flex items-center justify-between border-b border-line pb-3">
            <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
            <button
              onClick={onClose}
              className="text-ash-dim hover:text-zinc-100"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        )}
        {children}
        {footer && <div className="mt-4 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}

/** 삭제 등 위험 동작 확인 다이얼로그 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "정말 진행하시겠습니까?",
  description,
  confirmLabel = "삭제",
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            취소
          </Button>
          <Button
            variant={danger ? "primary" : "secondary"}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {description && <p className="text-sm text-ash">{description}</p>}
    </Modal>
  );
}
