/** 애플리케이션 공통 상수 */

export const APP_NAME = "고객관리 CRM";

export const APP_DESCRIPTION =
  "고객, 거래, 세그먼트 및 리마인드를 관리하는 CRM";

/** 앞으로 구현할 메뉴 (현재는 자리 표시만) */
export const NAV_ITEMS = [
  { key: "dashboard", label: "대시보드" },
  { key: "customers", label: "고객관리" },
  { key: "trades", label: "거래관리" },
  { key: "segments", label: "세그먼트" },
  { key: "reminders", label: "리마인드" },
] as const;
