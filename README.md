# 고객관리 CRM (MVP)

소규모 고객 관리를 위한 CRM MVP입니다. 서버 사이드 렌더링(Thymeleaf) 기반의 단일 애플리케이션입니다.

## 기술 스택

| 항목 | 버전 / 선택 |
| --- | --- |
| Java | 21 (17 이상) |
| Spring Boot | 4.1.1 |
| 빌드 도구 | Maven (Maven Wrapper 포함) |
| 웹 | Spring Web MVC |
| 화면 | Thymeleaf |
| 영속성 | Spring Data JPA / Hibernate |
| 데이터베이스 | H2 (파일 모드, 재시작 후 데이터 유지) |
| 검증 | Jakarta Bean Validation |

## 사전 준비

- JDK 21 설치 (macOS Homebrew 예: `brew install openjdk@21`)
- `JAVA_HOME` 설정이 필요할 수 있습니다.

  ```bash
  export JAVA_HOME=/opt/homebrew/opt/openjdk@21
  ```

Maven은 별도 설치가 필요 없습니다. 저장소에 포함된 `./mvnw` 를 사용합니다.

## 실행 방법

```bash
# 애플리케이션 실행
./mvnw spring-boot:run
```

실행 후 브라우저에서 접속합니다.

- 시작 화면: http://localhost:8080/
- H2 콘솔(개발용): http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:file:./data/crm`
  - 사용자: `sa` / 비밀번호: (없음)

## 테스트

```bash
./mvnw test
```

## 빌드

```bash
./mvnw clean package
java -jar target/crm-0.0.1-SNAPSHOT.jar
```

## 데이터베이스 (H2 file 모드)

메모리 모드(`jdbc:h2:mem:`)가 아닌 **file 모드**를 사용하여 애플리케이션을 종료했다가
다시 실행해도 데이터가 유지됩니다.

| 설정 | 값 |
| --- | --- |
| `spring.datasource.url` | `jdbc:h2:file:./data/crm;AUTO_SERVER=TRUE` |
| `spring.datasource.username` | `sa` |
| `spring.datasource.password` | (없음) |
| `spring.datasource.driver-class-name` | `org.h2.Driver` |
| `spring.jpa.hibernate.ddl-auto` | `update` (스키마 유지, 재시작 시 초기화 안 함) |
| `spring.jpa.show-sql` | `true` (개발 디버깅용) |
| `spring.h2.console.enabled` | `true` |
| `spring.h2.console.path` | `/h2-console` |

- 데이터베이스 파일 위치: 프로젝트 루트의 `data/` 디렉터리 (`data/crm.mv.db`).
  애플리케이션을 처음 실행할 때 자동 생성됩니다.
- `data/` 디렉터리와 `*.db` 파일은 `.gitignore` 에 포함되어 버전 관리에서 제외됩니다.
- `AUTO_SERVER=TRUE` 는 애플리케이션 실행 중에도 외부 도구(예: IDE의 DB 클라이언트)에서
  같은 파일에 접속할 수 있게 해 줍니다.

### H2 Console 접속 방법

1. 애플리케이션을 실행합니다: `./mvnw spring-boot:run`
2. 브라우저에서 http://localhost:8080/h2-console 접속
3. 로그인 화면에 아래 값을 입력합니다.

   | 항목 | 값 |
   | --- | --- |
   | JDBC URL | `jdbc:h2:file:./data/crm` |
   | User Name | `sa` |
   | Password | (비워 둠) |

4. **Connect** 클릭

> H2 Console 은 개발·시연용입니다. 운영 보안 설정은 이 프로젝트 범위에 포함하지 않습니다.

## 프로젝트 구조

```
src/main/java/com/example/crm/
  CrmApplication.java     # 애플리케이션 진입점
  HomeController.java     # 시작 화면(/)
src/main/resources/
  application.properties  # H2 파일 모드, JPA, H2 콘솔 설정
  templates/index.html    # 시작 화면 템플릿
src/test/java/com/example/crm/
  CrmApplicationTests.java # 컨텍스트 로드 테스트
  HomeControllerTest.java  # 시작 화면 응답 테스트
```
