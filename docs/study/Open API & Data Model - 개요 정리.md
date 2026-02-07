1. 목적과 범위
TM Forum Open API는 통신 및 디지털 서비스 관리를 위한 표준화된 REST API 모음입니다. 주요 특징:

OpenAPI 3.0 사양 기반
서비스 제공자 생태계 전반의 상호운용성 지원
서비스 이행, 리소스 관리, 고객 운영, 파트너 협업 지원
TMF API 번호로 구성 (예: TMF634, TMF639, TMF676)
2. 저장소 구조
API 도메인 분류


핵심 리소스 관리	TMF634, TMF639	리소스 카탈로그 사양 및 인벤토리 관리
서비스 관리	TMF633, TMF653, TMF657	서비스 카탈로그, 테스트 인프라, 품질 모니터링
재무 운영	TMF676	결제 처리, 승인, 환불
인프라 서비스	TMF688, TMF675, TMF681	이벤트 관리 허브, 지리적 위치, 통신
고급 기능	TMF915, TMF642, TMF644, TMF672	AI 모델 관리, 알람 처리, 개인정보 보호, 권한
3. 핵심 아키텍처 개념
3.1 Specification-Instance 패턴
템플릿 엔티티가 운영 엔티티로 인스턴스화되는 패턴:

리소스 도메인: ResourceSpecification (TMF634) → Resource (TMF639)
서비스 도메인: ServiceSpecification (TMF633) → ServiceInstance
테스트 도메인: ServiceTestSpecification (TMF653) → ServiceTest
AI 도메인: AIModelSpecification (TMF915) → AIModel
3.2 이벤트 기반 통합
TMF688 Event Management를 통한 허브-스포크 아키텍처:

API가 도메인 이벤트 발행 (생성, 업데이트, 삭제, 상태 변경)
외부 시스템이 구독을 통해 이벤트 소비
/hub 엔드포인트로 구독 등록
/listener/*Event 엔드포인트로 콜백 전달
3.3 다형성 확장 모델
모든 TMF 엔티티는 3가지 표준 속성 사용:
 
 
json

{
  "id": "rs-001",
  "@type": "LogicalResourceSpecification",
  "@baseType": "ResourceSpecification",
  "@schemaLocation": "https://example.com/schemas/LogicalResourceSpec.json",
  "name": "Virtual CPU Specification"
}
@type: 구체적인 타입 식별자
@baseType: 상속 계층의 부모 타입
@schemaLocation: JSON 스키마 URI 참조
3.4 공통 엔티티 참조 패턴


EntityRef	id, href, @referredType 포함 경량 참조	RelatedParty, AttachmentRef
RelatedEntity	role 속성으로 역할 의미 추가	RelatedParty(role: "supplier")
Characteristic	유연한 속성 저장용 키-값 쌍	ResourceSpecificationCharacteristic
4. 주요 상호작용 플로우
리소스 정의 및 인스턴스화 흐름
TMF634에서 ResourceSpecification 정의
특성(characteristics) 및 제약사항 설정
TMF639에서 Resource 인스턴스 생성
실제 값으로 특성 채우기
품질 모니터링 및 알람 흐름
TMF653으로 서비스 테스트 실행
TMF657로 SLO 추적
임계값 위반 시 TMF642로 알람 생성
알람 생명주기 관리
5. 학습 순서 권장사항
Core Resource Management - 리소스 카탈로그 및 인벤토리 (기초)
Service Management APIs - 서비스 카탈로그, 테스트, 품질
Infrastructure and Supporting Services - 이벤트, 지리적 데이터, 통신
Financial Operations - 결제 처리 워크플로우
Advanced Capabilities - AI, 알람, 개인정보, 권한
Common Patterns and Best Practices - 모든 API에 공통되는 패턴
