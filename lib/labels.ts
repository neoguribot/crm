/**
 * DB 코드값 → 한국어 표시명 매핑.
 * DB 에는 항상 코드값(대문자 영문)을 저장하고, 화면 표시에만 이 매핑을 사용한다.
 */

import type {
  InflowChannel,
  ItemType,
  PurchasePurpose,
  TradeType,
} from "@/lib/types/database";

export const INFLOW_CHANNEL_LABELS: Record<InflowChannel, string> = {
  CARROT_MARKET: "당근마켓",
  NAVER_PLACE: "네이버플레이스",
  REFERRAL: "지인추천",
  WALK_IN: "워크인",
  OTHER: "기타",
};

export const PURCHASE_PURPOSE_LABELS: Record<PurchasePurpose, string> = {
  WEDDING: "예물",
  FIRST_BIRTHDAY: "돌반지",
  INVESTMENT: "투자·골드바",
  SELLING: "매입",
  OTHER: "기타",
};

export const TRADE_TYPE_LABELS: Record<TradeType, string> = {
  SALE: "판매",
  PURCHASE: "매입",
};

export const ITEM_TYPE_LABELS: Record<ItemType, string> = {
  GOLD_BAR: "골드바",
  GOLD_24K_JEWELRY: "24K 주얼리",
  GOLD_18K: "18K",
  GOLD_14K: "14K",
  SILVER: "은",
  OTHER: "기타",
};
