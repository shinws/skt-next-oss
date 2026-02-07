1. 개요
Service Management 도메인은 서비스 정의, 테스트, 모니터링을 위한 3개의 주요 API로 구성됩니다:

TMF633 Service Catalog - 서비스 사양 및 오퍼링 정의
TMF653 Service Test Management - 프로비저닝된 서비스 테스트 관리
TMF657 Service Quality Management - SLO/SLA를 통한 서비스 품질 모니터링
2. 아키텍처
2.1 전체 계층 구조
Service Management APIs는 Core Resource Management(TMF634/TMF639) 위에 구축되어 서비스 레벨 추상화를 제공합니다. 서비스는 리소스 사양을 빌딩 블록으로 사용하고 비즈니스 로직, 가격 정책, 고객 대면 기능을 추가합니다.

다이어그램 1: Service Management 계층 구조
 

┌─────────────────────────────────────────────────────────┐
│           Service Management Layer                      │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐ │
│  │   TMF633     │   │   TMF653     │   │   TMF657     │ │
│  │   Service    │   │   Service    │   │   Service    │ │
│  │   Catalog    │   │     Test     │   │   Quality    │ │
│  └──────┬───────┘   └──────┬───────┘   └──────┬───────┘ │
└─────────┼──────────────────┼──────────────────┼─────────┘
          │                  │                  │
          └──────────────────┼──────────────────┘
                             ↓
┌─────────────────────────────────────────────────────────┐
│        Core Resource Management Layer                   │
│  ┌──────────────┐              ┌──────────────┐         │
│  │   TMF634     │              │   TMF639     │         │
│  │   Resource   │─────────────→│   Resource   │         │
│  │   Catalog    │              │   Inventory  │         │
│  └──────────────┘              └──────────────┘         │
└─────────────────────────────────────────────────────────┘

 


설명:

상위: Service Management - 고객 대면 서비스 정의/테스트/품질 관리
하위: Resource Management - 물리적/논리적 리소스 관리
Service는 Resource를 참조하여 구성됨
2.2 Specification-Instance 패턴
모든 Service Management API는 Specification-Instance 패턴을 따릅니다.



다이어그램 2: Specification-Instance 패턴

Specification (템플릿)              Instance (실행/운영)
────────────────────────           ──────────────────────

TMF633:
ServiceSpecification      ─────→   ServiceInstance
  - characteristics               - state
  - constraints                   - startDate
  - resources                     - actualValues

TMF653:
ServiceTestSpecification  ─────→   ServiceTest
  - testCharacteristics           - state (pending/running/completed)
  - constraints                   - testMeasure[] (결과)
  - thresholds                    - startDateTime, endDateTime

TMF657:
ServiceLevelSpecification ─────→   ServiceLevelObjective (SLO)
  - sloTemplate                   - currentValue
  - validFor                      - thresholdValue
                                  - conformanceComparator
설명:

왼쪽: 재사용 가능한 템플릿 정의
오른쪽: 실제 운영 인스턴스 (상태, 값, 측정치 보유)
화살표: 인스턴스화 관계
3. TMF633 Service Catalog
3.1 핵심 엔티티


ServiceSpecification	서비스 특성을 정의하는 템플릿	TMF634의 ResourceSpecificationRef 참조
ServiceCandidate	시장에 판매 가능한 서비스 오퍼링	하나 이상의 ServiceSpecification 구현
ServiceCategory	계층적 분류	ServiceCandidate를 카테고리로 조직화
3.2 주요 엔드포인트
GET/POST /serviceSpecification - 서비스 사양 관리
GET/POST /serviceCandidate - 서비스 후보 관리
GET/POST /serviceCategory - 서비스 카테고리 관리
다이어그램 3: Service Catalog 구조 

ServiceCatalog
    │
    ├── ServiceCategory (계층적)
    │      ├── "클라우드 서비스"
    │      │      └── ServiceCandidate
    │      └── "네트워크 서비스"
    │             └── ServiceCandidate
    │
    └── ServiceCandidate (판매 가능한 오퍼링)
           │
           └── ServiceSpecification (템플릿)
                  │
                  ├── Characteristics
                  ├── Constraints
                  └── ResourceSpecificationRef (TMF634 참조)
                         │
                         └── 예: "VM 인스턴스", "네트워크 대역폭"
4. TMF653 Service Test Management
4.1 핵심 엔티티


ServiceTestSpecification	재사용 가능한 테스트 템플릿	characteristicSpecification[], constraint[], relatedServiceSpecification
ServiceTest	테스트 실행 인스턴스	state, testMeasure[], relatedService, startDateTime, endDateTime
TestMeasure	테스트 결과 측정치	value, unitOfMeasure, accuracy
AppliedConsequence	임계값 위반 시 조치	appliedAction, repeatAction
4.2 주요 엔드포인트
GET/POST /serviceTestSpecification - 테스트 템플릿 관리
GET/POST/PATCH/DELETE /serviceTest - 테스트 실행 및 관리
POST /hub - 테스트 이벤트 구독
4.3 테스트 실행 플로우
다이어그램 4: Service Test 실행 플로우 

1. 준비 단계
   ServiceTestSpecification (템플릿)
          │
          │ define test parameters
          │
          ↓
   POST /serviceTest
          │
          ↓
   ServiceTest (state: pending)

2. 실행 단계
   ServiceTest (state: running)
          │
          │ execute against
          ↓
   Service Instance (실제 서비스)
          │
          │ collect measurements
          ↓
   TestMeasure[] 
     - latency: 50ms
     - throughput: 100Mbps
     - packet_loss: 0.1%

3. 평가 단계
   Compare with Thresholds
          │
          ├─→ PASS → ServiceTest (state: completed)
          │
          └─→ FAIL → AppliedConsequence
                         - Send Alert
                         - Create Ticket
                         - Publish Event
5. TMF657 Service Quality Management
5.1 핵심 엔티티


ServiceLevelSpecification	SLA 템플릿	SLO 모음, 유효 기간
ServiceLevelObjective (SLO)	성능 목표	파라미터, 임계값, 결과 조치
ServiceLevelObjectiveParameter	측정 KPI/KQI	name, value, unitOfMeasure
ServiceLevelObjectiveConsequence	위반 조치	페널티, 알림, 에스컬레이션
5.2 주요 엔드포인트
GET/POST /serviceLevelSpecification - SLA 템플릿 관리
GET/POST /serviceLevelObjective - SLO 관리
5.3 SLO 모니터링 플로우
다이어그램 5: SLO 모니터링 및 위반 처리
 
 

ServiceLevelSpecification (SLA 템플릿)
    │
    └── ServiceLevelObjective (SLO)
           │
           ├── Parameter: "Availability"
           │      - targetValue: 99.9%
           │      - unitOfMeasure: percentage
           │
           ├── Parameter: "Response Time"
           │      - targetValue: 200
           │      - unitOfMeasure: milliseconds
           │
           └── Threshold Monitoring
                  │
                  ├─→ Within SLO → Continue Monitoring
                  │
                  └─→ SLO Violated
                         │
                         └── ServiceLevelObjectiveConsequence
                                │
                                ├── Penalty
                                ├── Notification
                                └── Escalation
                                       │
                                       └── Publish Event:
                                           ServiceLevelObjectiveViolationEvent
6. 이벤트 기반 통합
모든 Service Management API는 hub/listener 이벤트 알림 패턴을 구현합니다.

6.1 이벤트 구독 플로우
다이어그램 6: 이벤트 구독 및 알림 패턴
 
 

External System          TMF API (633/653/657)        Event Hub
      │                          │                         │
      │ 1. POST /hub             │                         │
      │ (구독 등록)                │                         │
      │─────────────────────────→│                         │
      │                          │                         │
      │                          │ 2. Service Activity     │
      │                          │    (create/update/test) │
      │                          │                         │
      │                          │ 3. Publish Event        │
      │                          │────────────────────────→│
      │                          │                         │
      │ 4. POST /listener/*Event                           │
      │    (Callback)                                      │
      │←───────────────────────────────────────────────────│
      │                          │                         │
      │ 5. Process Event         │                         │
      │    - Update Dashboard    │                         │
      │    - Trigger Workflow    │                         │
      │    - Send Notification   │                         │
6.2 API별 이벤트 타입


TMF633	ServiceCandidateCreateEvent
ServiceSpecificationCreateEvent
ServiceCategoryCreateEvent	카탈로그 변경 알림
TMF653	ServiceTestCreateEvent
ServiceTestAttributeValueChangeEvent
ServiceTestDeleteEvent
ServiceTestSpecificationCreateEvent	테스트 생명주기 추적
TMF657	ServiceLevelObjectiveCreateEvent
ServiceLevelObjectiveViolationEvent	SLO 위반 알림
7. 특성 기반 확장성 (Characteristic Pattern)
Service Management API는 Characteristic 패턴을 사용하여 스키마 변경 없이 런타임 커스터마이징을 지원합니다.

7.1 주요 속성


configurable	인스턴스가 사양 값을 재정의할 수 있는지 여부	true/false
extensible	런타임에 새 값을 추가할 수 있는지 여부	true/false
minCardinality / maxCardinality	허용되는 값 인스턴스 수	1, 1..*, 0..1
valueType	데이터 타입	numeric, text, boolean
다이어그램 7: Characteristic 확장 패턴
 
 

ServiceTestSpecification
    │
    └── CharacteristicSpecification
           ├── name: "bandwidth"
           ├── valueType: "numeric"
           ├── unitOfMeasure: "Mbps"
           ├── configurable: true
           ├── minCardinality: 1
           └── characteristicValueSpecification[]
                  ├── value: "100"
                  ├── value: "500"
                  └── value: "1000"
                         │
                         ↓ instantiate
ServiceTest
    │
    └── Characteristic
           ├── name: "bandwidth"
           └── value: "500"  (선택된 값)
8. 임계값 및 결과 관리
TMF653과 TMF657은 임계값 기반 모니터링과 구성 가능한 결과 조치를 구현합니다.

8.1 Consequence 속성


appliedAction	string	실행할 액션의 하이퍼링크 또는 설명
repeatAction	boolean	true: 매 위반마다 적용
false: 상태 변경 시에만 적용
name	string	사람이 읽을 수 있는 결과 이름
description	string	결과에 대한 상세 설명
다이어그램 8: 임계값 모니터링 및 Consequence 실행
 
 

ServiceTest or SLO
    │
    └── Threshold Definition
           ├── Parameter: "latency"
           ├── Value: 100
           └── UnitOfMeasure: "ms"
                  │
                  ↓ monitoring
           Current Measurement
                  │
                  ├─→ latency < 100ms → OK
                  │
                  └─→ latency >= 100ms → VIOLATED
                         │
                         └── AppliedConsequence
                                │
                                ├── if repeatAction = true
                                │      └── Execute every violation
                                │
                                └── if repeatAction = false
                                       └── Execute only on state change
                                              (OK → VIOLATED)
                                              │
                                              └── Actions:
                                                  - Send Alert
                                                  - Create Incident
                                                  - Escalate to Operator
                                                  - Apply Penalty
9. 다형성 및 타입 확장성
모든 Service Management 엔티티는 @type, @baseType, @schemaLocation 패턴을 통해 다형성을 지원합니다.

9.1 확장 패턴
다이어그램 9: 다형성 확장 메커니즘
 
 

Base Entity
    │
    ├── @type: "BaseServiceTest"
    ├── @baseType: null
    └── @schemaLocation: "http://example.com/schemas/BaseServiceTest.json"
           │
           └── Common Properties:
                  - id, href, name
                  - state, startDateTime
                  │
                  ↓ extend
Extended Entity
    │
    ├── @type: "NetworkPerformanceTest"
    ├── @baseType: "BaseServiceTest"
    └── @schemaLocation: "http://example.com/schemas/NetworkPerformanceTest.json"
           │
           └── Additional Properties:
                  - packetLossRate
                  - jitter
                  - throughput
                  - protocolType
확장 프로세스:

@type을 새 서브클래스 이름으로 설정
@baseType을 부모 클래스 이름으로 설정
@schemaLocation을 추가 속성을 정의하는 JSON 스키마 URI로 설정
API가 기본 및 확장 스키마 모두에 대해 검증
10. Resource Management와의 통합
Service Management API는 Core Resource Management(TMF634)에 의존하여 기본 리소스 사양을 사용합니다.

10.1 통합 포인트
다이어그램 10: Service-Resource 통합
 
 

Service Layer (TMF633)
    │
    ServiceSpecification
    ├── name: "Cloud VPN Service"
    ├── serviceCharacteristic[]
    └── resourceSpecification[] (참조)
           │
           ├── ResourceSpecificationRef
           │      - id: "vm-spec-001"
           │      - name: "Virtual Machine"
           │
           ├── ResourceSpecificationRef
           │      - id: "network-spec-002"
           │      - name: "Virtual Network"
           │
           └── ResourceSpecificationRef
                  - id: "storage-spec-003"
                  - name: "Block Storage"
                         │
                         ↓ references
Resource Layer (TMF634)
    │
    ResourceSpecification
    ├── LogicalResourceSpecification (VM)
    ├── LogicalResourceSpecification (Network)
    └── PhysicalResourceSpecification (Storage)
           │
           ↓ instantiate when service activated
Resource Inventory (TMF639)
    │
    Resource Instances
    ├── VM Instance (id: vm-001)
    ├── Network Instance (id: net-001)
    └── Storage Instance (id: storage-001)
주요 통합 사항:

서비스 사양은 필요한 리소스를 나타내기 위해 ResourceSpecificationRef 참조
서비스 활성화 시 TMF639에서 리소스 인스턴스화 발생
서비스 테스트(TMF653)는 기본 리소스가 성능 요구사항을 충족하는지 검증
서비스 품질 모니터링(TMF657)이 리소스 레벨 모니터링으로 연계될 수 있음
11. REST API 패턴
모든 Service Management API는 표준 TM Forum REST API 설계 패턴을 따릅니다.

11.1 공통 HTTP 상태 코드


200 OK	성공적인 조회 또는 업데이트	GET, PATCH
201 Created	성공적인 생성	POST
204 No Content	성공적인 삭제	DELETE
400 Bad Request	잘못된 입력	유효성 검증 실패
404 Not Found	엔티티를 찾을 수 없음	존재하지 않는 ID
500 Internal Server Error	서버 오류	내부 처리 오류
요약
Service Management APIs는 3개의 보완적인 API를 통해 포괄적인 서비스 관리 기능을 제공합니다:

TMF633 Service Catalog: 서비스 사양, 후보, 카테고리 관리
TMF653 Service Test Management: 서비스 테스트 정의 및 실행
TMF657 Service Quality Management: SLO/SLA를 통한 품질 모니터링
핵심 특징:

Specification-Instance 패턴
이벤트 기반 통합 (hub/listener)
Characteristic 기반 확장성
임계값 및 Consequence 관리
다형성 지원
Resource Management와의 긴밀한 통합
