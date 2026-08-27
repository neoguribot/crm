# CLAUDE.md

이 저장소에서 작업할 때 반드시 따르는 개발 원칙이다.

## 프로젝트 개요

소규모 고객 관리를 위한 CRM MVP. 서버 사이드 렌더링 단일 애플리케이션.

## 기술 스택 (확정)

- Java 21 (17 이상)
- Spring Boot 4.1.1
- Spring Web MVC
- Thymeleaf
- Spring Data JPA
- Jakarta Bean Validation
- H2 Database (파일 모드)
- Maven (Maven Wrapper `./mvnw` 사용)

## 개발 원칙

- Spring Boot, Spring Data JPA, H2 file mode, Thymeleaf를 사용한다.
- React 등 별도 프론트엔드 프레임워크를 추가하지 않는다.
- 한 번에 하나의 작은 기능만 구현한다.
- MVP 범위 밖 기능을 임의로 추가하지 않는다.
- 기존에 정상 작동하는 기능을 깨뜨리지 않는다.
- 구현 후 관련 테스트를 실행한다.
- 금액은 `BigDecimal`을 사용한다.
- 날짜는 `LocalDate`를 사용한다.
- 화면과 검증 오류 메시지는 한국어로 작성한다.
- H2 데이터는 애플리케이션 재시작 후에도 유지되어야 한다.
- 정상 작동이 확인된 단계마다 Git 커밋한다. 단, 사용자가 직접 확인하기 전에는 커밋하지 않는다.

## 작업 시 유의사항

- 기존 파일을 삭제하거나 덮어쓰기 전에 내용을 먼저 확인한다.
- 기존 Git 변경사항이 있다면 임의로 되돌리거나 삭제하지 않는다.
- 최신 버전이라는 이유만으로 새로운 기술이나 라이브러리를 추가하지 않는다.
- 테스트 실패를 숨기거나 건너뛰지 않는다.
- 오류가 발생하면 원인을 확인하고 해당 단계 범위 안에서 최소한으로 수정한다.

## MVP 기능 범위

필수 기능(단계별로 하나씩 구현):

1. 고객 등록·조회·수정
2. 고객별 거래 기록
3. 고객 검색 및 세그먼트 필터
4. 대시보드 요약
5. 리마인드 대상 고객 표시

제외 기능: 로그인·권한관리, 문자·카카오톡 자동발송, 결제·재고 연동,
복잡한 통계·그래프, 별도 프론트엔드 프레임워크, 외부 서버 배포.

## 빌드 / 실행 / 테스트

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@21   # 필요 시
./mvnw test              # 테스트
./mvnw spring-boot:run   # 실행 (http://localhost:8080)
```

## 주요 설정

- H2: `jdbc:h2:file:./data/crm` (`data/` 는 gitignore)
- 스키마: `spring.jpa.hibernate.ddl-auto=update`
- H2 콘솔: `/h2-console` (개발용)

## Spring Boot 4 참고

- 스타터 이름: `spring-boot-starter-web` → `spring-boot-starter-webmvc`
- H2 콘솔 자동설정은 별도 의존성 `spring-boot-h2console`
- 테스트 슬라이스가 모듈별로 분리됨: `spring-boot-starter-webmvc-test`, `spring-boot-starter-data-jpa-test` 등
- `@WebMvcTest`, `@AutoConfigureMockMvc` 패키지: `org.springframework.boot.webmvc.test.autoconfigure`

## 현재 진행 상황

- 0단계: 프로젝트 초기 구성 (진입점, 시작 화면 `/`, 기본 테스트, README, CLAUDE.md). H2 파일 모드 설정 완료.
- 다음: 고객 등록 기능 (Customer 엔티티 + 등록 폼).
