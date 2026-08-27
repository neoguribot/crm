package com.example.crm.customer;

import com.example.crm.common.BaseTimeEntity;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.EnumSet;
import java.util.Set;

/**
 * 고객. 한 명이 여러 건의 거래 기록({@code TradeRecord})을 가질 수 있다(단방향 일대다).
 * 최근 방문일과 리마인드 상태는 저장하지 않고 조회 시 계산한다.
 */
@Entity
@Table(name = "customer", indexes = {
        @Index(name = "idx_customer_name", columnList = "name"),
        @Index(name = "idx_customer_phone_number", columnList = "phone_number"),
        @Index(name = "idx_customer_first_visit_date", columnList = "first_visit_date"),
        @Index(name = "idx_customer_next_event_date", columnList = "next_event_date")
})
public class Customer extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "이름을 입력해 주세요.")
    @Size(max = 50, message = "이름은 최대 50자까지 입력할 수 있습니다.")
    @Column(name = "name", nullable = false, length = 50)
    private String name;

    @NotBlank(message = "연락처를 입력해 주세요.")
    @Pattern(regexp = "^[0-9-]{7,20}$", message = "연락처를 숫자와 '-' 로 입력해 주세요.")
    @Column(name = "phone_number", nullable = false, length = 20)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    @Column(name = "inflow_channel", length = 30)
    private InflowChannel inflowChannel;

    @NotNull(message = "최초 방문일을 입력해 주세요.")
    @PastOrPresent(message = "최초 방문일은 오늘 이전이어야 합니다.")
    @Column(name = "first_visit_date", nullable = false)
    private LocalDate firstVisitDate;

    @ElementCollection(targetClass = PurchasePurpose.class)
    @CollectionTable(name = "customer_purchase_purpose",
            joinColumns = @JoinColumn(name = "customer_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "purpose", nullable = false, length = 30)
    private Set<PurchasePurpose> purchasePurposes = EnumSet.noneOf(PurchasePurpose.class);

    @PastOrPresent(message = "마지막 연락일은 오늘 이전이어야 합니다.")
    @Column(name = "last_contact_date")
    private LocalDate lastContactDate;

    @Column(name = "next_event_date")
    private LocalDate nextEventDate;

    @Size(max = 500, message = "비고는 최대 500자까지 입력할 수 있습니다.")
    @Column(name = "note", length = 500)
    private String note;

    protected Customer() {
    }

    public Customer(String name, String phoneNumber, LocalDate firstVisitDate) {
        this.name = name;
        this.phoneNumber = phoneNumber;
        this.firstVisitDate = firstVisitDate;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getPhoneNumber() {
        return phoneNumber;
    }

    public void setPhoneNumber(String phoneNumber) {
        this.phoneNumber = phoneNumber;
    }

    public InflowChannel getInflowChannel() {
        return inflowChannel;
    }

    public void setInflowChannel(InflowChannel inflowChannel) {
        this.inflowChannel = inflowChannel;
    }

    public LocalDate getFirstVisitDate() {
        return firstVisitDate;
    }

    public void setFirstVisitDate(LocalDate firstVisitDate) {
        this.firstVisitDate = firstVisitDate;
    }

    public Set<PurchasePurpose> getPurchasePurposes() {
        return purchasePurposes;
    }

    /** 구매목적 집합을 통째로 교체한다. 컬렉션 인스턴스는 유지한다. */
    public void setPurchasePurposes(Set<PurchasePurpose> purchasePurposes) {
        this.purchasePurposes.clear();
        if (purchasePurposes != null) {
            this.purchasePurposes.addAll(purchasePurposes);
        }
    }

    public LocalDate getLastContactDate() {
        return lastContactDate;
    }

    public void setLastContactDate(LocalDate lastContactDate) {
        this.lastContactDate = lastContactDate;
    }

    public LocalDate getNextEventDate() {
        return nextEventDate;
    }

    public void setNextEventDate(LocalDate nextEventDate) {
        this.nextEventDate = nextEventDate;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
