package com.example.crm.customer;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.crm.common.JpaAuditingConfig;
import java.time.LocalDate;
import java.util.EnumSet;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jpa.test.autoconfigure.TestEntityManager;
import org.springframework.context.annotation.Import;

@DataJpaTest
@Import(JpaAuditingConfig.class)
class CustomerEntityTest {

    @Autowired
    private TestEntityManager entityManager;

    @Test
    void 고객을_저장하고_조회하면_모든_필드가_유지된다() {
        Customer customer = new Customer("홍길동", "010-1234-5678", LocalDate.of(2026, 1, 10));
        customer.setInflowChannel(InflowChannel.DAANGN);
        customer.setPurchasePurposes(EnumSet.of(PurchasePurpose.WEDDING_GIFT, PurchasePurpose.INVESTMENT_GOLD_BAR));
        customer.setLastContactDate(LocalDate.of(2026, 2, 1));
        customer.setNextEventDate(LocalDate.of(2026, 3, 1));
        customer.setNote("VIP 고객");

        Long id = entityManager.persistAndGetId(customer, Long.class);
        entityManager.flush();
        entityManager.clear();

        Customer found = entityManager.find(Customer.class, id);
        assertThat(found.getName()).isEqualTo("홍길동");
        assertThat(found.getPhoneNumber()).isEqualTo("010-1234-5678");
        assertThat(found.getInflowChannel()).isEqualTo(InflowChannel.DAANGN);
        assertThat(found.getFirstVisitDate()).isEqualTo(LocalDate.of(2026, 1, 10));
        assertThat(found.getPurchasePurposes())
                .containsExactlyInAnyOrder(PurchasePurpose.WEDDING_GIFT, PurchasePurpose.INVESTMENT_GOLD_BAR);
        assertThat(found.getLastContactDate()).isEqualTo(LocalDate.of(2026, 2, 1));
        assertThat(found.getNextEventDate()).isEqualTo(LocalDate.of(2026, 3, 1));
        assertThat(found.getNote()).isEqualTo("VIP 고객");
    }

    @Test
    void 저장하면_생성일시와_수정일시가_자동으로_채워진다() {
        Customer customer = new Customer("김철수", "01099998888", LocalDate.now());

        entityManager.persist(customer);
        entityManager.flush();

        assertThat(customer.getCreatedAt()).isNotNull();
        assertThat(customer.getUpdatedAt()).isNotNull();
    }

    @Test
    void 선택_항목을_비워도_저장된다() {
        Customer customer = new Customer("이영희", "01055554444", LocalDate.now());

        Long id = entityManager.persistAndGetId(customer, Long.class);
        entityManager.flush();
        entityManager.clear();

        Customer found = entityManager.find(Customer.class, id);
        assertThat(found.getInflowChannel()).isNull();
        assertThat(found.getPurchasePurposes()).isEmpty();
        assertThat(found.getLastContactDate()).isNull();
        assertThat(found.getNextEventDate()).isNull();
        assertThat(found.getNote()).isNull();
    }
}
