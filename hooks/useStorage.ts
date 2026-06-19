"use client";

/**
 * 검은 모자 라디오국 - localStorage 반응형 hook 모음
 *
 * - 모든 hook 은 첫 렌더에서 seed/fallback 을 사용한다. (SSR 하이드레이션 일치)
 * - mount 이후 initializeMockData() 를 호출하고 localStorage 값을 읽어 갱신한다.
 * - "blackhat:storage"(같은 탭) / "storage"(다른 탭) 이벤트를 구독해 자동 재조회한다.
 */

import { useCallback, useEffect, useState } from "react";
import {
  getData,
  getAdminMode,
  setAdminMode as persistAdminMode,
  getCurrentUserId,
  initializeMockData,
} from "@/lib/storage";

/** 컬렉션(배열) hook — soft delete 항목은 제외하고 반환 */
export function useCollection<T extends { id: string; deletedAt?: string | null }>(
  key: string,
  seed: T[],
): { data: T[]; ready: boolean; reload: () => void } {
  const [data, setStateData] = useState<T[]>(seed);
  const [ready, setReady] = useState(false);

  const reload = useCallback(() => {
    const all = getData<T[]>(key, seed);
    setStateData(all.filter((item) => !item?.deletedAt));
  }, [key, seed]);

  useEffect(() => {
    initializeMockData();
    reload();
    setReady(true);
    const handler = (e: Event) => {
      const detailKey = (e as CustomEvent<{ key?: string }>).detail?.key;
      if (!detailKey || detailKey === "*" || detailKey === key) reload();
    };
    window.addEventListener("blackhat:storage", handler);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("blackhat:storage", handler);
      window.removeEventListener("storage", reload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, ready, reload };
}

/** 단일 값(설정/세션 등) hook */
export function useStorageValue<T>(
  key: string,
  fallback: T,
): { value: T; ready: boolean; reload: () => void } {
  const [value, setValue] = useState<T>(fallback);
  const [ready, setReady] = useState(false);

  const reload = useCallback(() => {
    setValue(getData<T>(key, fallback));
  }, [key, fallback]);

  useEffect(() => {
    initializeMockData();
    reload();
    setReady(true);
    const handler = (e: Event) => {
      const detailKey = (e as CustomEvent<{ key?: string }>).detail?.key;
      if (!detailKey || detailKey === "*" || detailKey === key) reload();
    };
    window.addEventListener("blackhat:storage", handler);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("blackhat:storage", handler);
      window.removeEventListener("storage", reload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { value, ready, reload };
}

/** 관리자 모드 (blackhat_admin_mode) */
export function useAdminMode(): {
  adminMode: boolean;
  ready: boolean;
  setAdminMode: (v: boolean) => void;
  toggle: () => void;
} {
  const [adminMode, setState] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeMockData();
    setState(getAdminMode());
    setReady(true);
    const handler = () => setState(getAdminMode());
    window.addEventListener("blackhat:storage", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("blackhat:storage", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setAdminMode = useCallback((v: boolean) => {
    persistAdminMode(v);
    setState(v);
  }, []);

  const toggle = useCallback(() => setAdminMode(!getAdminMode()), [setAdminMode]);

  return { adminMode, ready, setAdminMode, toggle };
}

/** 현재 유저 id (blackhat_current_user) */
export function useCurrentUserId(): { userId: string; ready: boolean } {
  const [userId, setUserId] = useState("user-1");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeMockData();
    setUserId(getCurrentUserId());
    setReady(true);
    const handler = () => setUserId(getCurrentUserId());
    window.addEventListener("blackhat:storage", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("blackhat:storage", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  return { userId, ready };
}

/** 클라이언트 mount 여부 (SSR 가드용) */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}
