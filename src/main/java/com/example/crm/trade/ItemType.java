package com.example.crm.trade;

/**
 * 거래 품목. 코드값(상수 이름)과 한국어 표시명을 분리한다.
 * 데이터베이스에는 {@code name()} 문자열로 저장한다.
 */
public enum ItemType {

    GOLD_BAR("골드바"),
    JEWELRY_24K("24K 주얼리"),
    GOLD_18K("18K"),
    GOLD_14K("14K"),
    SILVER("은"),
    OTHER("기타");

    private final String displayName;

    ItemType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
