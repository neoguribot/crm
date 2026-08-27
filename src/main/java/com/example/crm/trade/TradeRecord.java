package com.example.crm.trade;

import com.example.crm.common.BaseTimeEntity;
import com.example.crm.customer.Customer;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * 거래 기록. 반드시 고객 한 명에게 속한다(단방향 {@code @ManyToOne}).
 * 금액·순도·중량은 정확한 계산을 위해 {@link BigDecimal}을 사용한다.
 */
@Entity
@Table(name = "trade_record", indexes = {
        @Index(name = "idx_trade_record_customer_id", columnList = "customer_id"),
        @Index(name = "idx_trade_record_customer_trade_date", columnList = "customer_id, trade_date"),
        @Index(name = "idx_trade_record_trade_date", columnList = "trade_date")
})
public class TradeRecord extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "고객 정보가 필요합니다.")
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @NotNull(message = "거래구분을 선택해 주세요.")
    @Enumerated(EnumType.STRING)
    @Column(name = "trade_type", nullable = false, length = 20)
    private TradeType tradeType;

    @NotNull(message = "품목을 선택해 주세요.")
    @Enumerated(EnumType.STRING)
    @Column(name = "item_type", nullable = false, length = 20)
    private ItemType itemType;

    @DecimalMin(value = "0.00", message = "순도는 0에서 100 사이여야 합니다.")
    @DecimalMax(value = "100.00", message = "순도는 0에서 100 사이여야 합니다.")
    @Column(name = "purity", precision = 5, scale = 2)
    private BigDecimal purity;

    @NotNull(message = "중량을 입력해 주세요.")
    @DecimalMin(value = "0.0", inclusive = false, message = "중량은 0보다 커야 합니다.")
    @Column(name = "weight_in_gram", nullable = false, precision = 10, scale = 3)
    private BigDecimal weightInGram;

    @NotNull(message = "금액을 입력해 주세요.")
    @DecimalMin(value = "0", message = "금액은 0 이상이어야 합니다.")
    @Column(name = "amount", nullable = false, precision = 15, scale = 0)
    private BigDecimal amount;

    @NotNull(message = "거래일을 입력해 주세요.")
    @PastOrPresent(message = "거래일은 오늘 이전이어야 합니다.")
    @Column(name = "trade_date", nullable = false)
    private LocalDate tradeDate;

    @Size(max = 500, message = "비고는 최대 500자까지 입력할 수 있습니다.")
    @Column(name = "note", length = 500)
    private String note;

    protected TradeRecord() {
    }

    public TradeRecord(Customer customer, TradeType tradeType, ItemType itemType,
                       BigDecimal weightInGram, BigDecimal amount, LocalDate tradeDate) {
        this.customer = customer;
        this.tradeType = tradeType;
        this.itemType = itemType;
        this.weightInGram = weightInGram;
        this.amount = amount;
        this.tradeDate = tradeDate;
    }

    public Long getId() {
        return id;
    }

    public Customer getCustomer() {
        return customer;
    }

    public void setCustomer(Customer customer) {
        this.customer = customer;
    }

    public TradeType getTradeType() {
        return tradeType;
    }

    public void setTradeType(TradeType tradeType) {
        this.tradeType = tradeType;
    }

    public ItemType getItemType() {
        return itemType;
    }

    public void setItemType(ItemType itemType) {
        this.itemType = itemType;
    }

    public BigDecimal getPurity() {
        return purity;
    }

    public void setPurity(BigDecimal purity) {
        this.purity = purity;
    }

    public BigDecimal getWeightInGram() {
        return weightInGram;
    }

    public void setWeightInGram(BigDecimal weightInGram) {
        this.weightInGram = weightInGram;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public void setAmount(BigDecimal amount) {
        this.amount = amount;
    }

    public LocalDate getTradeDate() {
        return tradeDate;
    }

    public void setTradeDate(LocalDate tradeDate) {
        this.tradeDate = tradeDate;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}
