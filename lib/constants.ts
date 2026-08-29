/** 애플리케이션 공통 상수 */

export const APP_NAME = "고객관리 CRM";

export const APP_DESCRIPTION =
  "금은방 고객·거래·세그먼트·리마인드를 관리하는 CRM";

/** 로그인 후 기본으로 보여줄 화면(=홈). 상단 브랜드 링크가 이 경로로 이동한다. */
export const HOME_PATH = "/home";

/**
 * 로그인 후 공통 네비게이션.
 * - 홈은 별도 항목 없이 상단 "고객관리 CRM" 브랜드 링크로 이동한다.
 * - 거래는 고객 상세 화면에서 관리하므로 별도 항목을 두지 않는다.
 * - 세그먼트(검색·구매목적·유입경로·방문일 필터)는 "고객관리" 화면 상단에 있다.
 */
export const NAV_ITEMS = [
  { href: "/pipeline", label: "파이프라인" },
  { href: "/dashboard", label: "대시보드" },
  { href: "/customers", label: "고객관리" },
  { href: "/reminders", label: "리마인드" },
] as const;
