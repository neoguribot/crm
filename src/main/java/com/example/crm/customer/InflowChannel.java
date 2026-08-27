package com.example.crm.customer;

/**
 * 고객 유입경로. 코드값(상수 이름)과 한국어 표시명을 분리한다.
 * 데이터베이스에는 {@code name()} 문자열로 저장한다.
 */
public enum InflowChannel {

    DAANGN("당근마켓"),
    NAVER_PLACE("네이버플레이스"),
    ACQUAINTANCE_REFERRAL("지인추천"),
    WALK_IN("워크인"),
    OTHER("기타");

    private final String displayName;

    InflowChannel(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
