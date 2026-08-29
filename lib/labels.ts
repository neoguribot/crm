/**
 * DB 코드값 → 한국어 표시명 매핑.
 * DB 에는 항상 코드값(대문자 영문)을 저장하고, 화면 표시에만 이 매핑을 사용한다.
 */

import type {
  CustomerStage,
  InflowChannel,
  ItemType,
  PurchasePurpose,
  TradeType,
} from "@/lib/types/database";

export const INFLOW_CHANNEL_LABELS: Record<InflowChannel, string> = {
  CARROT_MARKET: "당근 마켓",
  NAVER_PLACE: "네이버 플레이스",
  KAKAO_MAP: "카카오맵",
  KAKAO_CHANNEL: "카카오채널",
  GOOGLE: "구글",
  TMAP: "티맵",
  REFERRAL: "지인 추천",
  WALK_IN: "워크인",
  OTHER: "기타",
};

/** 방문 목적 (다중). */
export const PURCHASE_PURPOSE_LABELS: Record<PurchasePurpose, string> = {
  PURCHASE: "매입",
  GOLD_BAR: "골드바",
  STONE_PRODUCT: "돌제품",
  CUSTOM_JEWELRY: "주얼리 맞춤",
  OTHER: "기타",
};

/** 코드값 → 표시명 (알 수 없으면 코드 그대로). */
export function inflowChannelLabel(code: string): string {
  return INFLOW_CHANNEL_LABELS[code as InflowChannel] ?? code;
}
export function purchasePurposeLabel(code: string): string {
  return PURCHASE_PURPOSE_LABELS[code as PurchasePurpose] ?? code;
}

export const TRADE_TYPE_LABELS: Record<TradeType, string> = {
  SALE: "판매",
  PURCHASE: "매입",
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  GOLD_BAR: "골드바",
  SILVER_BAR: "실버바",
  GOLD_24K: "24K",
  GOLD_24K_STONE: "24K(돌제품)",
  GOLD_24K_JEWELRY: "24K(주얼리)",
  GOLD_18K: "18K",
  GOLD_14K: "14K",
  SILVER_JEWELRY: "은제품(은주얼리)",
  SILVER_SPOON: "은제품(은수저)",
  SCRAP_GOLD: "치금",
  OTHER: "기타",
};

/** 코드값 → 표시명. 알 수 없는 값이면 코드값을 그대로 돌려준다(옛 데이터 방어). */
export function itemTypeLabel(code: string): string {
  return ITEM_TYPE_LABELS[code as ItemType] ?? code;
}

export const CUSTOMER_STAGE_LABELS: Record<CustomerStage, string> = {
  NEW_INQUIRY: "신규 문의",
  CONSULTING: "상담 중",
  QUOTE_SENT: "견적 발송",
  PURCHASE_CONFIRMED: "구매 확정",
  AFTER_CARE: "사후 관리",
};
