1. 개요
Infrastructure and Supporting Services는 TM Forum API 생태계 전반에 걸쳐 통합, 통신, 데이터 관리를 가능하게 하는 횡단 관심사(cross-cutting concerns)를 제공합니다. 이들 서비스는 비즈니스 도메인 엔티티를 직접 관리하지 않고, 모든 도메인 API가 의존하는 필수 기능을 제공합니다.

1.1 주요 API
TMF688 Event Management - 이벤트 기반 통합 및 알림 허브
TMF675 Geographic Location - 지리공간 데이터 관리
TMF681 Communication Management - 메시지 전달 및 추적
1.2 API 역할 비교


TMF688 Event Management	이벤트 버스 및 알림 라우팅	Topic 기반 필터링을 통한 Pub/Sub 패턴	모든 도메인 API (TMF634, TMF676, TMF653 등)
TMF675 Geographic Location	지리공간 데이터 관리	위치에 대한 GeoJSON 지원	Resource Inventory, Party Management
TMF681 Communication Management	메시지 전달 추적	SMS, email, push 알림 생명주기	Payment, Service, Customer Management
2. TMF688 Event Management
2.1 아키텍처
TMF688은 전체 TMF 생태계의 중앙 이벤트 버스로, 허브-스포크(hub-and-spoke) 발행-구독 패턴을 구현합니다.

다이어그램 1: Event Management 아키텍처
 
 

┌─────────────────────────────────────────────────────────┐
│                   TMF688 Event Hub                      │
│                   (Central Event Bus)                   │
├─────────────────────────────────────────────────────────┤
│  Topic Management                                       │
│  - contentQuery (내용 필터링)                              │
│  - headerQuery (헤더 필터링)                               │
│                                                         │
│  Event Storage & Routing                                │
│  - eventId, eventTime, eventType                        │
│  - domain, priority                                     │
│  - polymorphic event payload                            │
│                                                         │
│  Subscription Management (Hub)                          │
│  - callback URI storage                                 │
│  - query filters                                        │
└─────────────────────────────────────────────────────────┘
         ↑                    │                   ↑
         │ publish            │ notify            │ subscribe
         │                    ↓                   │
┌────────┴────────┐  ┌────────────────┐  ┌────────┴────────┐
│  TMF634/639     │  │  External      │  │  TMF653/657     │
│  Resource Mgmt  │  │  Systems       │  │  Service Mgmt   │
└─────────────────┘  └────────────────┘  └─────────────────┘
2.2 핵심 컴포넌트
Topic (주제)

도메인, 타입, 접근 제어 요구사항별로 이벤트를 조직화하고 필터링하는 이벤트 채널
contentQuery, headerQuery 속성을 통한 필터링 지원
Event (이벤트)

유연한 페이로드 구조를 가진 다형성 이벤트 인스턴스
메타데이터: eventId, eventTime, eventType, domain, priority
다형성 event 페이로드: 모든 도메인별 이벤트 타입 포함 가능
Hub (허브)

이벤트 라우팅을 위한 콜백 URI와 선택적 쿼리 필터를 저장하는 구독 엔드포인트
2.3 이벤트 발행 및 구독 플로우
다이어그램 2: 이벤트 Pub/Sub 플로우
 
 

Publisher                 TMF688              Subscriber
(도메인 API)              Event Hub           (외부 시스템)
    │                        │                      │
    │                        │  1. 구독 등록          │
    │                        │  POST /hub           │
    │                        │  {                   │
    │                        │    callback: "url",  │
    │                        │    query: "filter"   │
    │                        │  }                   │
    │                        │←─────────────────────│
    │                        │                      │
    │                        │  구독 저장             │
    │                        │  (callback + query)  │
    │                        │                      │
    │  2. 이벤트 발생           │                      │
    │  (Resource 생성 등)      │                      │
    │                        │                      │
    │  3. POST /event        │                      │
    │  {                     │                      │
    │    eventType: "...",   │                      │
    │    event: {...}        │                      │
    │  }                     │                      │
    │───────────────────────→│                      │
    │                        │                      │
    │                        │  4. 필터 매칭          │
    │                        │  (query 평가)         │
    │                        │                      │
    │                        │  5. POST {callback}  │
    │                        │  (이벤트 데이터)        │
    │                        │─────────────────────→│
    │                        │                      │
    │                        │       201 OK         │
    │                        │←─────────────────────│
플로우 설명:

구독자가 구독 등록 (callback URL + 필터)
Publisher에서 비즈니스 이벤트 발생
Publisher가 TMF688로 이벤트 발행
TMF688이 구독 필터와 매칭
매칭된 구독자에게 callback 호출
2.4 표준 이벤트 스키마


Event	기본 이벤트 엔티티	id, href, eventId, eventTime, eventType, domain, priority, event (Any)
Event_Create	이벤트 생성 스키마	Event와 동일 (id, href 제외)
EventSubscription	구독 레코드	id, callback, query
EventSubscriptionInput	구독 요청	callback (필수), query (선택)
Any	다형성 페이로드	이벤트 페이로드를 위한 유연한 타입
핵심:

event 속성의 다형성 타입 Any를 통해 TMF688은 스키마 변경 없이 모든 도메인별 이벤트 페이로드 전송 가능
이벤트 발행자는 도메인 이벤트를 이 필드에 직렬화
구독자는 eventType을 기반으로 역직렬화
2.5 모든 TMF API의 표준 구독 패턴
모든 도메인 API는 동일한 구조적 패턴으로 이벤트 발행:
 
 

도메인 API                      이벤트 타입
─────────────────────────────  ────────────────────────────────────
TMF634 Resource Catalog        ResourceCatalogCreateEvent
                               ResourceSpecificationStateChangeEvent

TMF653 Service Test            ServiceTestCreateEvent
                               ServiceTestAttributeValueChangeEvent

TMF676 Payment                 PaymentCreateEvent
                               PaymentStateChangeEvent
                               RefundCreateEvent
모든 API의 공통 구독 엔드포인트:

POST /hub - 리스너 등록
DELETE /hub/{id} - 리스너 등록 해제
클라이언트 리스너 엔드포인트 (구독자가 구현해야 함):

패턴: POST /listener/{entityName}{EventType}Event
예시:
POST /listener/paymentCreateEvent
POST /listener/serviceTestStateChangeEvent
3. TMF675 Geographic Location
3.1 주요 기능
TMF675는 GeoJSON을 지원하는 표준화된 지리공간 데이터 관리를 제공합니다.

핵심 역량:

GeoJSON 지원: Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon 등 모든 GeoJSON 지오메트리 타입 지원
주소 관리: 구조화/비구조화 주소 표현
위치 참조: 도메인 API 전반에서 사용되는 경량 위치 참조 (GeographicLocationRef)
이벤트 구독: 위치 생성/업데이트/삭제 알림을 위한 표준 이벤트 패턴
3.2 통합 포인트
다이어그램 3: Geographic Location 통합
 
 

┌──────────────────────────────────────────────┐
│         TMF675 Geographic Location           │
│  - GeoJSON Geometries                        │
│  - Structured Address                        │
│  - Location References                       │
└────────┬──────────────┬──────────────────────┘
         │              │              
         ↓              ↓              
┌────────────────┐  ┌────────────────┐
│  TMF639        │  │  Party Mgmt    │
│  Resource      │  │  - Organization│
│  Inventory     │  │  - Individual  │
│                │  │    Address     │
│  - Physical    │  │                │
│    Resource    │  └────────────────┘
│    Location    │         
│  - place: {    │         
│      id,       │         
│      href,     │         
│      name      │         
│    }           │         
└────────────────┘
소비자 API별 사용 사례:

TMF639 Resource Inventory	물리적 리소스 위치 추적	LogicalResource.place
Party Management	조직 및 개인 주소	Party.place
TMF634 Resource Catalog	리소스 사양 위치 제약사항	ResourceSpecification.place
3.3 GeographicLocationRef 스키마 예시

json

{
  "id": "geo-001",
  "href": "/geographicLocation/geo-001",
  "name": "Seoul Data Center",
  "@referredType": "GeographicLocation"
}
```

**참조 패턴 특징:**
- 도메인 엔티티는 전체 데이터가 아닌 경량 참조 저장
- 표시 목적에 충분한 메타데이터 (`id`, `href`, `name`) 포함
- 전체 위치 데이터는 TMF675에 유지

---

4. TMF681 Communication Management

4.1 주요 기능

TMF681은 SMS, 이메일, 푸시 알림에 대한 메시지 전달 및 생명주기 추적을 제공합니다.


핵심 역량:


다중 채널 지원	SMS, email, push 알림 및 확장 가능한 채널 타입
메시지 생명주기	pending → sent → delivered → failed 등의 상태 추적
템플릿 관리	변수 치환을 지원하는 메시지 템플릿
전달 확인	이벤트 알림을 통한 비동기 전달 상태 업데이트

4.2 도메인 API와의 통합


1. 비즈니스 이벤트 발생
   Domain API (TMF676, TMF653 등)
          │
          │ Payment Completed
          │ Service Activated
          │ Alarm Raised
          ↓
   POST /event (TMF688)

2. 이벤트 라우팅
   TMF688 Event Hub
          │
          │ 구독 매칭
          ↓
   Event Subscriber
   (Notification Service)

3. 통신 메시지 생성
   POST /communication (TMF681)
          │
          ├─→ SMS Channel
          ├─→ Email Channel
          └─→ Push Channel

4. 메시지 전달
   TMF681 Communication
          │
          ├─→ Message State: pending
          ├─→ Message State: sent
          └─→ Message State: delivered

5. 상태 업데이트
   Delivery Confirmation
          │
          └─→ Event: CommunicationDeliveredEvent
```

Communication Management는 비즈니스 이벤트가 사용자 알림을 필요로 할 때 도메인 API와 통합됩니다






알림 체이닝 플로우:




도메인 이벤트 발생: 결제 완료, 서비스 활성화, 알람 발생
이벤트 발행: 도메인 API가 TMF688에 이벤트 발행
통신 트리거: 이벤트 구독자가 TMF681을 통해 통신 메시지 생성
메시지 전달: TMF681이 적절한 채널로 전달 (SMS, email, push)
상태 업데이트: 전달 확인이 통신 상태를 업데이트하고 이벤트 발행



패턴의 이점:




관심사의 분리: 비즈니스 로직(도메인 API)과 알림 전달(TMF681) 분리
추적성: 엔드-투-엔드 추적 유지
느슨한 결합: 도메인 API는 알림 전달 메커니즘을 알 필요 없음

5. 횡단 통합 패턴 (Cross-API Integration Patterns)

Infrastructure 서비스는 잘 정의된 통합 패턴을 통해 도메인 API 간 느슨한 결합을 가능하게 합니다.


5.1 이벤트 기반 통합 패턴

모든 도메인 API는 동일한 구조적 패턴으로 이벤트를 발행하며, TMF688에 라우팅을 위임합니다.


다이어그램 6: 표준 이벤트 발행 패턴


Domain API (TMF634, TMF653, TMF676 등)
    │
    ├── Entity Created/Updated/Deleted
    │
    └── Publish Event
           │
           └─→ TMF688 /event
                  │
                  ├── Topic Filtering (contentQuery)
                  ├── Header Filtering (headerQuery)
                  │
                  └── Subscription Matching
                         │
                         └─→ Notify Subscribers
                                (callback URLs)


패턴 특징:


도메인 API는 소비자를 알 필요 없음 (loose coupling)
발행자는 토픽에 이벤트만 방출
TMF688이 구독 매칭 및 알림 전달 처리
비동기, fire-and-forget 방식
Topic 레벨과 Hub 레벨에서 필터링 가능

5.2 참조 데이터 패턴

지리적 위치 및 당사자 데이터는 참조 패턴을 따릅니다. 도메인 엔티티가 임베디드 데이터가 아닌 경량 참조를 저장하는 방식입니다.


패턴 구현:


도메인 엔티티: 경량 참조 저장 (id, href, name, @referredType)
참조 대상: TMF675에 전체 데이터 유지
이점: 데이터 중복 방지, 일관성 보장, 표시용 메타데이터 제공

이 패턴은 리소스 사양, 서비스 사양, 인벤토리 항목에 공통적으로 나타납니다.


5.3 알림 체이닝 패턴 (Notification Chaining)

Communication Management는 비즈니스 이벤트가 사용자 알림을 트리거하는 알림 체이닝을 가능하게 합니다.


체이닝 단계:


도메인 이벤트 발생
도메인 API가 TMF688에 이벤트 발행
이벤트 구독자가 TMF681로 통신 메시지 생성
TMF681이 적절한 채널로 메시지 전달
전달 확인이 통신 상태 업데이트

이 패턴은 비즈니스 로직을 알림 전달과 분리하면서도 엔드-투-엔드 추적을 유지합니다.



6. API 비교 및 선택 기준

Infrastructure API는 서로 다른 목적을 가지며, 특정 통합 요구사항에 따라 선택해야 합니다.


서비스 간 비동기 통합	TMF688 Event Management	Pub/Sub 패턴으로 느슨한 결합 가능
실시간 이벤트 스트리밍	TMF688 Event Management	Topic이 대용량 이벤트 플로우 지원
사용자 알림 전달	TMF681 Communication	생명주기 추적을 통한 다중 채널 지원
지리공간 쿼리 및 매핑	TMF675 Geographic Location	복잡한 지오메트리를 위한 GeoJSON 지원
주소 검증	TMF675 Geographic Location	검증 기능이 있는 구조화된 주소 스키마
메시지 템플릿 관리	TMF681 Communication	변수 치환을 지원하는 템플릿
이벤트 필터링 및 라우팅	TMF688 Event Management	Topic 및 Hub 레벨 쿼리 필터

공통점:


세 가지 Infrastructure API 모두 표준 TMF 이벤트 구독 패턴 구현
POST /hub, DELETE /hub/{id} 엔드포인트 제공
자체 생명주기 이벤트에 대한 모니터링 및 감사 기능 제공


요약

Infrastructure and Supporting Services는 분산된 이벤트 기반 TMF API 생태계에 필요한 기초 역량을 제공합니다.


주요 API 기능

TMF688 Event Management:


Topic 기반 Pub/Sub을 통한 확장 가능한 비동기 통합
중앙화된 이벤트 버스 및 라우팅
도메인 API 간 느슨한 결합 제공
다형성 이벤트 페이로드 지원 (타입 Any)

TMF675 Geographic Location:


GeoJSON 지원을 통한 표준화된 지리공간 데이터 관리
구조화된 주소 및 위치 참조
물리적 리소스 및 당사자 위치 추적
Point, LineString, Polygon 등 모든 지오메트리 타입 지원

TMF681 Communication Management:


생명주기 추적을 통한 다중 채널 알림 전달
SMS, email, push 지원
비즈니스 이벤트와 사용자 알림 분리
템플릿 기반 메시지 관리

일관된 패턴

이들 API는 통합 복잡성을 줄이고 도메인 서비스의 독립적 진화를 가능하게 하는 일관된 패턴을 구현합니다:


이벤트 구독 패턴: POST /hub, DELETE /hub/{id} 표준 엔드포인트
엔티티 참조 패턴: 경량 참조를 통한 데이터 중복 방지
확장성 패턴: @type, @baseType, @schemaLocation을 통한 다형성

Infrastructure 서비스는 Core Resource Management와 Service Management 위에서 횡단 기능을 제공하며, 전체 TMF API 생태계의 통합 기반을 형성합니다.
