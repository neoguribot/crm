package com.example.crm.common;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

/**
 * JPA Auditing 활성화. 별도 설정 클래스로 분리하여 슬라이스 테스트에서 선택적으로 가져올 수 있게 한다.
 */
@Configuration
@EnableJpaAuditing
public class JpaAuditingConfig {
}
