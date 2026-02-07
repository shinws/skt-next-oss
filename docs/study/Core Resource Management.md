TMF634 Resource Catalog & TMF639 Resource Inventory

1. 개요
Core Resource Management는 TM Forum ODA의 가장 기본이 되는 도메인으로, 리소스의 정의부터 실제 운영까지 전체 생명주기를 관리합니다.

1.1 구성 API
TMF634 Resource Catalog Management - 리소스 템플릿 및 사양 정의
TMF639 Resource Inventory Management - 실제 리소스 인스턴스 관리
1.2 핵심 개념
Specification-Instance 패턴: 카탈로그는 '무엇을 프로비저닝할 수 있는가'를 정의하고, 인벤토리는 '무엇이 프로비저닝되었는가'를 추적합니다.

 

계층

역할

주요 엔티티

정의 계층 (Catalog)

리소스 타입, 기능, 구성 사양

ResourceSpecification

런타임 계층 (Inventory)

운영 생명주기 추적

Resource

 

2. 전체 아키텍처
아래 다이어그램은 Catalog와 Inventory 간의 관계, 그리고 각 계층의 핵심 엔티티를 보여줍니다.

┌─────────────────────────────────────────────────────────────────┐
 │                    TMF634 Resource Catalog                                                                                                                                                                                  │
 │                     (정의/템플릿 계층)                                                                                                                                                                                                   │
├─────────────────────────────────────────────────────────────────┤
│  ResourceCatalog → ResourceCategory → ResourceCandidate                                                                                                                                         │
│                                                                                       ↓                                                                                                                                                         │
│                                                                     ResourceSpecification                                                                                                                                        │
│         ┌──────────┬───────────┐                                                                                                   │
│      Logical                          Physical                            Function                                                                                                                                               │
└─────────────────────────────────────────────────────────────────┘
                            ↓ instantiate
┌──────────────────  ────┐
│                   TMF639 Resource Inventory                     │
│                     (런타임/인스턴스 계층)                                 │
├───────────────  ───────┤
│  Resource (인스턴스)                                                    │
│  - administrativeState (unlock/lock)                            │
│  - operationalState (enable/disable)                            │
│  - usageState (idle/active/busy)                                │
│  - resourceStatus (available/reserved/suspended)     │
└──────────────────────────┘


 

3. TMF634 Resource Catalog Management
3.1 핵심 엔티티
엔티티

목적

주요 관계

ResourceCatalog

프로비저닝 가능한 리소스를 조직화하는 최상위 컨테이너

카테고리와 후보 포함

ResourceCategory

계층적 분류 구조 (예: 클라우드 리소스, 네트워크 장비)

후보 조직화, 부모-자식 계층

ResourceCandidate

생명주기 관리를 통해 카탈로그에서 특정 리소스 사양 제공

하나의 ResourceSpecification 참조

ResourceSpecification

리소스 타입, 특성, 제약사항, 관계 정의 템플릿

추상 타입 + 구체적 서브타입

 

3.2 주요 API 엔드포인트
HTTP 메서드

엔드포인트

작업

GET

/resourceCatalog

카탈로그 목록 조회 (페이징)

GET

/resourceCatalog/{id}

특정 카탈로그 조회

POST

/resourceCatalog

새 카탈로그 생성 (201)

PATCH

/resourceCatalog/{id}

카탈로그 업데이트

DELETE

/resourceCatalog/{id}

카탈로그 삭제 (204)

GET

/resourceSpecification

사양 목록 조회

POST

/resourceSpecification

새 사양 생성

POST

/hub

이벤트 리스너 등록

DELETE

/hub/{id}

리스너 등록 해제

 

참고: 동일한 패턴이 resourceCandidate, resourceCategory 엔드포인트에도 적용됩니다.

 

3.3 ResourceSpecification 타입
ResourceSpecification은 @type 필드로 구분되는 다형성 엔티티입니다. 세 가지 주요 서브타입이 있습니다.

 

타입

설명

예시

LogicalResourceSpecification

물리적 형태가 없는 가상 리소스 템플릿

MSISDN (전화번호), IP 주소, 소프트웨어 라이선스, 가상 스토리지, SIM 프로필

PhysicalResourceSpecification

유형의 하드웨어 리소스 템플릿

라우터, 서버, GPU, 케이블, 안테나, 랙

ResourceFunctionSpecification

리소스가 제공하는 기능적 역량 템플릿

방화벽, 로드 밸런서, NAT 게이트웨이, VPN 집중기

 

ResourceSpecification (@type으로 구분)


        ┌──────────────┐
        │     ResourceSpecification (추상)         │
        └──────┬───────┘
                                  │
         ┌────┼────┐
         ↓             ↓             ↓
    Logical      Physical      Function
    (가상)        (물리)        (기능)
   MSISDN        라우터        방화벽
   IP주소         서버      로드밸런서
   라이선스       GPU       NAT게이트웨이


 

4. TMF639 Resource Inventory Management
4.1 리소스 인스턴스 주요 속성
속성 그룹

속성

설명

기본 정보

id, href, name, description

고유 식별자 및 설명

분류

category, version

리소스 분류 및 버전

값

value

리소스의 주요 값 (예: 전화번호)

운영 기간

startOperatingDate, endOperatingDate

운영 시작/종료 날짜

상태 관리

administrativeState

관리 제어 (unlock/lock)

 

operationalState

운영 준비 (enable/disable)

 

usageState

사용 상태 (idle/active/busy)

 

resourceStatus

가용성 (available/reserved/suspended)

 

4.2 리소스 관계 및 참조
리소스 인스턴스는 다양한 관계 타입을 통해 다른 엔티티들과 연결됩니다.

 

관계 타입

목적

예시

Characteristic

커스텀 속성을 위한 키-값 쌍

{ name: "assignmentdate", value: "2019-07-04" }

RelatedParty

소유권 및 이해관계자 관계

{ role: "owner", name: "Joe Bloggs" }

ResourceSpecification

카탈로그 템플릿 연결

원본 사양 참조

ResourceRelationship

다른 리소스 인스턴스 연결

{ relationshipType: "isTargetedBy" }

Place

지리적 위치 참조 (TMF675 통합)

물리적 위치 정보

 

리소스 인스턴스 관계도


     ┌───────────────────┐
     │         Resource Instance (예: MSISDN)        │
     │  id: 444, value: "07465233456"              │
     └───────┬─┬──┬─┬────┘
                                     │      │       │       │
  ┌────────┘      │      │      └──────┐
  ↓                                      ↓     ↓                                 ↓
Characteristic               Party    Place    ResourceSpecification
키-값 속성                       소유자     위치       템플릿 참조
                                (TMF634)
                                         │
                                         ↓
       ResourceRelationship
  (다른 리소스와 관계)


 

5. Specification-Instance 패턴
Core Resource Management의 핵심은 템플릿-인스턴스 패턴입니다. 카탈로그의 사양이 인벤토리의 인스턴스를 위한 청사진 역할을 합니다.

 

5.1 패턴 특성
불변 템플릿: 카탈로그의 사양은 인스턴스가 따라야 할 구조, 제약사항, 특성을 정의
다중 인스턴스: 단일 사양으로 여러 인벤토리 인스턴스 생성 가능
버전 독립성: 카탈로그 버전 변경이 기존 인스턴스에 영향 없음
타입 다형성: 인스턴스의 @type이 사양의 @type과 일치하거나 확장
특성 바인딩: 사양의 특성 정의가 인스턴스에서 실제 값으로 채워짐
상태 관리: 인스턴스만 운영 상태 보유 (administrativeState, operationalState, usageState, resourceStatus)
 

5.2 Specification → Instance 플로우
@type: LogicalResourceSpecification      
name: MSISDN resource specification
characteristic: [region, operator, ...] 
1단계: ResourceSpecification 정의 (TMF634)
instantiate
@type: LogicalResource  
id: 444 
value: "07465233456"
administrativeState: unlock 
operationalState: enable
resourceStatus: available 
resourceSpecification: 참조 → TMF634
2단계: Resource 인스턴스 생성 (TMF639) 

 

6. 대량 작업: Import/Export Jobs
Resource Catalog API는 대규모 카탈로그 동기화, 백업/복원, 데이터 마이그레이션을 위한 비동기 대량 작업을 제공합니다.

 

6.1 Import Jobs (가져오기 작업)
외부 소스에서 리소스 카탈로그 데이터를 시스템으로 로드합니다.

 

속성

설명

예시

id

작업 식별자

"2341"

url

소스 데이터 URL

"https://my-platform/daily/job/NHCFD6"

path

대상 카탈로그 경로

"/resourceCatalog/3830"

contentType

데이터 형식

"application/json"

status

작업 상태

Running, Succeeded, Failed

creationDate

작업 생성 시간

"2018-08-27T00:00:00.000Z"

completionDate

작업 완료 시간

"2018-08-27T00:05:00.000Z"

errorLog

에러 로그 URL

"http://my-platform/logging/errors.log"

 

6.2 Export Jobs (내보내기 작업)
백업, 보고 또는 마이그레이션을 위해 리소스 카탈로그 데이터를 외부로 추출합니다.

 

속성

설명

예시

id

작업 식별자

"5435"

path

소스 카탈로그 경로

"/Catalog/3830"

query

필터 표현식

"category.id=7757"

contentType

출력 형식

"application/json"

url

다운로드 URL

"https://my-platform/daily/job/EHCFD6"

status

작업 상태

Running, Completed, Failed

 

7. 외부 시스템 통합
Core Resource Management는 여러 TMF API 및 외부 시스템과 통합되어 포괄적인 리소스 생명주기 관리를 제공합니다.

 

Party Management    (소유자, 운영자) 
TMF634 + TMF639 
Core Resource Management
TMF675   Geographic  
Location
TMF688
Event
Hub
Document
Mgmt
(첨부파일)
TMF633
Service
Catalog
TMF675
Quality
Mgmt
 

통합 시스템

목적

사용 예시

Party Management

소유권 및 이해관계자 추적

리소스 소유자, 운영자, 공급자

TMF675 Geographic Location

지리적 위치 참조

물리적 리소스 위치, 지역별 IP 블록

TMF688 Event Management

생명주기 이벤트 발행/구독

Create, StateChange, Delete 이벤트

Document Management

기술 문서 첨부

사양 문서, 다이어그램, 매뉴얼

TMF633 Service Catalog

상위 서비스 정의

리소스 기반 서비스 구성

TMF657 Quality Management

품질 모니터링

리소스 성능 추적

 

8. 이벤트 관리 통합 (TMF688)
TMF634와 TMF639는 생명주기 이벤트를 통해 이벤트 기반 통합을 지원합니다.

 

8.1 TMF634 Resource Catalog 이벤트
ResourceCatalogCreateEvent - 카탈로그 생성
ResourceCatalogStateChangeEvent - 카탈로그 상태 변경
ResourceCatalogDeleteEvent - 카탈로그 삭제
ResourceCandidateCreateEvent - 후보 생성
ResourceSpecificationCreateEvent - 사양 생성
ResourceSpecificationStateChangeEvent - 사양 상태 변경
 

8.2 TMF639 Resource Inventory 이벤트
ResourceCreateEvent - 리소스 생성
ResourceStateChangeEvent - 리소스 상태 변경
ResourceAttributeValueChangeEvent - 속성 값 변경
ResourceDeleteEvent - 리소스 삭제
 

8.3 이벤트 구독 패턴

  

외부 시스템
TMF634/639
이벤트 허브
POST /hub
(구독 등록)
ResourceCreateEvent
POST /listener/resourceCreateEvent
(콜백)


 

9. 요약
Core Resource Management는 TM Forum ODA의 기초를 제공하는 두 개의 핵심 API로 구성됩니다.

 

API

역할

핵심 엔티티

TMF634 Resource Catalog

리소스 템플릿, 사양, 조직 구조 유지

ResourceCatalog, ResourceCategory, ResourceCandidate, ResourceSpecification

TMF639 Resource Inventory

운영 상태 및 관계를 가진 런타임 인스턴스 추적

Resource (LogicalResource, PhysicalResource)

 

9.1 주요 특징
Specification-Instance 패턴: 템플릿과 인스턴스의 명확한 분리
세 가지 리소스 타입: 논리적, 물리적, 기능적 리소스 지원
대량 작업: Import/Export Jobs를 통한 대규모 데이터 관리
광범위한 통합: Party Management, Geographic Location, Event Management, Document Management와 연계
이벤트 기반 아키텍처: 생명주기 이벤트를 통한 느슨한 결합
 

9.2 상위 계층과의 관계
Core Resource Management는 상위 계층의 서비스 관리 기능을 위한 기반을 제공합니다. Service Management APIs (TMF633 Service Catalog 등)는 이 리소스 정의를 기반으로 고수준의 서비스를 구성합니다.




ResourceSpecification
(TMF634)
ServiceSpecification
(TMF633)
리소스 계층
서비스 계층
Resource
(TMF639)
Service
(서비스관리)
