"use client";

import { useCallback, useSyncExternalStore } from "react";
import { ZoomInIcon, ZoomOutIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/** localStorage 키 — 레이아웃의 무플래시 스크립트와 반드시 동일하게. */
export const FONT_SCALE_STORAGE_KEY = "crm:font-scale";
/** 같은 탭 내 변경 알림용 커스텀 이벤트. */
const CHANGE_EVENT = "crm:font-scale-change";

const MIN = 0.8;
const MAX = 1.6;
const STEP = 0.1;
const DEFAULT = 1;

function clamp(value: number): number {
  return Math.min(MAX, Math.max(MIN, Math.round(value * 100) / 100));
}

function readStored(): number {
  try {
    const raw = localStorage.getItem(FONT_SCALE_STORAGE_KEY);
    if (!raw) return DEFAULT;
    const n = Number(raw);
    return Number.isFinite(n) ? clamp(n) : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function applyScale(scale: number): void {
  document.documentElement.style.fontSize =
    scale === DEFAULT ? "" : `${Math.round(scale * 100)}%`;
}

function subscribe(onChange: () => void): () => void {
  const handler = () => {
    applyScale(readStored());
    onChange();
  };
  window.addEventListener("storage", handler);
  window.addEventListener(CHANGE_EVENT, handler);
  return () => {
    window.removeEventListener("storage", handler);
    window.removeEventListener(CHANGE_EVENT, handler);
  };
}

/**
 * 글씨 크기(문서 루트 font-size) 조절. rem 기반이라 전체 화면에 적용된다.
 * 값은 localStorage 에 저장되어 새로고침·다른 페이지·다른 탭에서도 유지된다.
 * (초기 적용은 app/layout.tsx 의 무플래시 스크립트가 담당)
 */
export function FontSizeControl() {
  const scale = useSyncExternalStore(subscribe, readStored, () => DEFAULT);

  const change = useCallback((next: number) => {
    const c = clamp(next);
    applyScale(c);
    try {
      if (c === DEFAULT) localStorage.removeItem(FONT_SCALE_STORAGE_KEY);
      else localStorage.setItem(FONT_SCALE_STORAGE_KEY, String(c));
    } catch {
      // 저장 실패해도 이번 세션 적용은 유지된다.
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const iconBtn =
    "grid size-7 place-items-center rounded-full text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div
      role="group"
      aria-label="글씨 크기 조절"
      className="flex items-center gap-0.5 rounded-full border px-0.5"
    >
      <button
        type="button"
        className={iconBtn}
        aria-label="글씨 작게"
        disabled={scale <= MIN}
        onClick={() => change(scale - STEP)}
      >
        <ZoomOutIcon className="size-4" aria-hidden />
      </button>
      <button
        type="button"
        className={cn(
          "min-w-11 rounded-full px-1 text-center text-xs tabular-nums text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
          scale !== DEFAULT && "font-medium text-foreground",
        )}
        aria-label="글씨 크기 기본값으로"
        onClick={() => change(DEFAULT)}
      >
        {Math.round(scale * 100)}%
      </button>
      <button
        type="button"
        className={iconBtn}
        aria-label="글씨 크게"
        disabled={scale >= MAX}
        onClick={() => change(scale + STEP)}
      >
        <ZoomInIcon className="size-4" aria-hidden />
      </button>
    </div>
  );
}
