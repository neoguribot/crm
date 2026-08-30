import { isValidIsoDate } from "@/lib/date";
import {
  FREQUENCY_LABELS,
  INFLOW_CHANNELS,
  PURCHASE_PURPOSES,
  REVENUE_LABELS,
  type FrequencyLabel,
  type InflowChannel,
  type PurchasePurpose,
  type RevenueLabel,
} from "@/lib/types/database";

export const SEARCH_MAX_LENGTH = 100;

export type CustomerFilters = {
  /** 이름·연락처 통합 검색어 (trim 됨, 빈 문자열이면 전체) */
  q: string;
  purpose: PurchasePurpose | null;
  channel: InflowChannel | null;
  /** 빈도 라벨(신규/단골). null 이면 제한 없음. */
  frequencyLabel: FrequencyLabel | null;
  /** 매출 라벨(일반/우수/VIP). null 이면 제한 없음. */
  revenueLabel: RevenueLabel | null;
  /** 방문일 구간 시작 `YYYY-MM-DD` (포함). null 이면 제한 없음. */
  visitFrom: string | null;
  /** 방문일 구간 종료 `YYYY-MM-DD` (포함). null 이면 제한 없음. */
  visitTo: string | null;
};

export const EMPTY_FILTERS: CustomerFilters = {
  q: "",
  purpose: null,
  channel: null,
  frequencyLabel: null,
  revenueLabel: null,
  visitFrom: null,
  visitTo: null,
};

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
}

function parseIsoDate(v: string | string[] | undefined): string | null {
  const raw = firstValue(v).trim();
  return isValidIsoDate(raw) ? raw : null;
}

/**
 * URL 검색 파라미터를 검증된 필터로 변환한다.
 * 알 수 없는 값·음수·허용되지 않은 값은 조용히 무시(기본값)한다.
 */
export function parseCustomerFilters(sp: RawSearchParams): CustomerFilters {
  const q = firstValue(sp.q).trim().slice(0, SEARCH_MAX_LENGTH);

  const purposeRaw = firstValue(sp.purpose);
  const purpose = (PURCHASE_PURPOSES as readonly string[]).includes(purposeRaw)
    ? (purposeRaw as PurchasePurpose)
    : null;

  const channelRaw = firstValue(sp.channel);
  const channel = (INFLOW_CHANNELS as readonly string[]).includes(channelRaw)
    ? (channelRaw as InflowChannel)
    : null;

  const frequencyRaw = firstValue(sp.frequencyLabel);
  const frequencyLabel = (FREQUENCY_LABELS as readonly string[]).includes(frequencyRaw)
    ? (frequencyRaw as FrequencyLabel)
    : null;

  const revenueRaw = firstValue(sp.revenueLabel);
  const revenueLabel = (REVENUE_LABELS as readonly string[]).includes(revenueRaw)
    ? (revenueRaw as RevenueLabel)
    : null;

  let visitFrom = parseIsoDate(sp.visitFrom);
  let visitTo = parseIsoDate(sp.visitTo);
  // 시작이 종료보다 뒤면 뒤바꾼다(사용자 편의).
  if (visitFrom && visitTo && visitFrom > visitTo) {
    [visitFrom, visitTo] = [visitTo, visitFrom];
  }

  return { q, purpose, channel, frequencyLabel, revenueLabel, visitFrom, visitTo };
}

/** 필터를 URL 쿼리스트링으로. 빈 값/기본값은 넣지 않는다. */
export function buildCustomerSearchParams(
  filters: CustomerFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.q) params.set("q", filters.q);
  if (filters.purpose) params.set("purpose", filters.purpose);
  if (filters.channel) params.set("channel", filters.channel);
  if (filters.frequencyLabel) params.set("frequencyLabel", filters.frequencyLabel);
  if (filters.revenueLabel) params.set("revenueLabel", filters.revenueLabel);
  if (filters.visitFrom) params.set("visitFrom", filters.visitFrom);
  if (filters.visitTo) params.set("visitTo", filters.visitTo);
  return params;
}

export function hasActiveFilters(filters: CustomerFilters): boolean {
  return Boolean(
    filters.q ||
      filters.purpose ||
      filters.channel ||
      filters.frequencyLabel ||
      filters.revenueLabel ||
      filters.visitFrom ||
      filters.visitTo,
  );
}
