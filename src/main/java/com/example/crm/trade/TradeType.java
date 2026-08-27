package com.example.crm.trade;

/**
 * 거래구분. 코드값(상수 이름)과 한국어 표시명을 분리한다.
 * 데이터베이스에는 {@code name()} 문자열로 저장한다.
 */
public enum TradeType {

    SALE("판매"),
    PURCHASE("매입");

    private final String displayName;

    TradeType(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
