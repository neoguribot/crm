package com.example.crm.trade;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.crm.common.JpaAuditingConfig;
import com.example.crm.customer.Customer;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

@DataJpaTest
@Import(JpaAuditingConfig.class)
class TradeRecordEntityTest {

    @Autowired
    private TestEntityManager entityManager;

    private Customer persistCustomer() {
        Customer customer = new Customer("홍길동", "010-1234-5678", LocalDate.of(2026, 1, 10));
        return entityManager.persistAndFlush(customer);
    }

    @Test
    void 거래_기록을_저장하고_조회하면_고객과_모든_값이_유지된다() {
        Customer customer = persistCustomer();

        TradeRecord trade = new TradeRecord(customer, TradeType.PURCHASE, ItemType.GOLD_BAR,
                new BigDecimal("3.75"), new BigDecimal("350000"), LocalDate.of(2026, 2, 15));
        trade.setPurity(new BigDecimal("99.99"));
        trade.setNote("돌반지 매입");

        Long id = entityManager.persistAndGetId(trade, Long.class);
        entityManager.flush();
        entityManager.clear();

        TradeRecord found = entityManager.find(TradeRecord.class, id);
        assertThat(found.getCustomer().getId()).isEqualTo(customer.getId());
        assertThat(found.getTradeType()).isEqualTo(TradeType.PURCHASE);
        assertThat(found.getItemType()).isEqualTo(ItemType.GOLD_BAR);
        assertThat(found.getPurity()).isEqualByComparingTo("99.99");
        assertThat(found.getWeightInGram()).isEqualByComparingTo("3.75");
        assertThat(found.getAmount()).isEqualByComparingTo("350000");
        assertThat(found.getTradeDate()).isEqualTo(LocalDate.of(2026, 2, 15));
        assertThat(found.getNote()).isEqualTo("돌반지 매입");
        assertThat(found.getCreatedAt()).isNotNull();
        assertThat(found.getUpdatedAt()).isNotNull();
    }

    @Test
    void 순도와_비고는_비워도_저장된다() {
        Customer customer = persistCustomer();

        TradeRecord trade = new TradeRecord(customer, TradeType.SALE, ItemType.JEWELRY_24K,
                new BigDecimal("5.000"), new BigDecimal("600000"), LocalDate.now());

        Long id = entityManager.persistAndGetId(trade, Long.class);
        entityManager.flush();
        entityManager.clear();

        TradeRecord found = entityManager.find(TradeRecord.class, id);
        assertThat(found.getPurity()).isNull();
        assertThat(found.getNote()).isNull();
    }

    @Test
    void 금액은_소수점_없이_중량은_소수점_세자리로_저장된다() {
        Customer customer = persistCustomer();

        TradeRecord trade = new TradeRecord(customer, TradeType.SALE, ItemType.GOLD_18K,
                new BigDecimal("12.3"), new BigDecimal("1500000"), LocalDate.now());

        Long id = entityManager.persistAndGetId(trade, Long.class);
        entityManager.flush();
        entityManager.clear();

        TradeRecord found = entityManager.find(TradeRecord.class, id);
        assertThat(found.getAmount().scale()).isEqualTo(0);
        assertThat(found.getWeightInGram().scale()).isEqualTo(3);
    }
}
