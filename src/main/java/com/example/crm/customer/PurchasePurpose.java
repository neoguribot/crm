package com.example.crm.customer;

/**
 * 고객의 구매목적. 한 고객이 복수로 가질 수 있다.
 * 코드값(상수 이름)과 한국어 표시명을 분리하며, 데이터베이스에는 {@code name()} 문자열로 저장한다.
 */
public enum PurchasePurpose {

    WEDDING_GIFT("예물"),
    FIRST_BIRTHDAY_RING("돌반지"),
    INVESTMENT_GOLD_BAR("투자·골드바"),
    BUY_BACK("매입"),
    OTHER("기타");

    private final String displayName;

    PurchasePurpose(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
