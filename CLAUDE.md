# ODA Resource Inventory Component - 개발 가이드
 
## 프로젝트 개요

TMF639 기반 네트워크 자원 인벤토리 ODA 컴포넌트.
통신 인프라 운영(OSS) 환경에서 물리/논리 자원을 관리하는 컴포넌트를 ODA Canvas 위에 구현한다.

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| Runtime | Node.js (Express) |
| API 스펙 | TMF639 v4 (커스텀 확장 가능) |
| DB | MongoDB (개발환경: 인메모리 또는 로컬) |
| 배포 환경 | Rancher Desktop (k3s + Istio) |
| 컨테이너 | Docker |
| 패키지 관리 | Helm |

---

## 디렉토리 구조

```
oda-resource-inventory/
├── CLAUDE.md
├── component.yaml              # ODA Component 스펙
├── helm/                       # Helm chart
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
│       ├── deployment.yaml
│       ├── service.yaml
│       └── component.yaml
├── src/
│   ├── index.js                # 앱 진입점
│   ├── api/
│   │   ├── routes/
│   │   │   ├── resource.js           # TMF639 Resource API
│   │   │   └── resourceSpec.js       # TMF639 ResourceSpecification API
│   │   └── controllers/
│   │       ├── resourceController.js
│   │       └── resourceSpecController.js
│   ├── models/                 # SID 도메인 모델
│   │   ├── Resource.js
│   │   ├── ResourceSpecification.js
│   │   └── ResourceRelationship.js
│   └── openapi/
│       └── TMF639-swagger.yaml # OpenAPI 스펙
├── test/
│   └── ctk/                    # TMF CTK 테스트
├── Dockerfile
└── package.json
```

---

## SID 도메인 모델

TMF SID 기반으로 정의하되 OSS 운영 환경에 맞게 확장 가능하다.

### Resource (핵심 엔티티)
```json
{
  "id": "string",
  "href": "string",
  "name": "string",
  "description": "string",
  "category": "string",          // Physical | Logical
  "resourceType": "string",      // Router | Switch | BTS | OLT | IP | VLAN | Circuit
  "operationalState": "string",  // enable | disable
  "administrativeState": "string", // locked | unlocked | shuttingDown
  "usageState": "string",        // idle | active | busy
  "lifecycleState": "string",    // planning | installing | operating | retiring
  "place": {                     // 위치 정보 (OSS 확장)
    "id": "string",
    "name": "string",
    "role": "string"
  },
  "resourceSpecification": {     // 자원 유형 참조
    "id": "string",
    "href": "string",
    "name": "string"
  },
  "resourceRelationship": [],    // 자원 간 연결 관계
  "characteristic": [],          // 자원 속성 (확장 가능)
  "@type": "Resource",
  "@baseType": "string",
  "@schemaLocation": "string"
}
```

### ResourceSpecification (자원 유형 정의)
```json
{
  "id": "string",
  "href": "string",
  "name": "string",              // Router-Spec | BTS-Spec 등
  "description": "string",
  "version": "string",
  "isBundle": false,
  "resourceSpecCharacteristic": [], // 유형별 속성 정의
  "@type": "ResourceSpecification"
}
```

### ResourceRelationship (자원 간 연결)
```json
{
  "id": "string",
  "relationshipType": "string",  // contains | connectedTo | dependsOn
  "resource": {
    "id": "string",
    "href": "string",
    "name": "string"
  }
}
```

> SID 모델은 비즈니스 요건에 따라 characteristic 배열로 자유롭게 확장한다.

---

## API 엔드포인트 (TMF639 기반)

### Resource
```
GET    /tmf-api/resourceInventoryManagement/v4/resource
GET    /tmf-api/resourceInventoryManagement/v4/resource/{id}
POST   /tmf-api/resourceInventoryManagement/v4/resource
PATCH  /tmf-api/resourceInventoryManagement/v4/resource/{id}
DELETE /tmf-api/resourceInventoryManagement/v4/resource/{id}
```

### ResourceSpecification
```
GET    /tmf-api/resourceInventoryManagement/v4/resourceSpecification
GET    /tmf-api/resourceInventoryManagement/v4/resourceSpecification/{id}
POST   /tmf-api/resourceInventoryManagement/v4/resourceSpecification
PATCH  /tmf-api/resourceInventoryManagement/v4/resourceSpecification/{id}
DELETE /tmf-api/resourceInventoryManagement/v4/resourceSpecification/{id}
```

### 공통 쿼리 파라미터
```
?fields=        # 응답 필드 선택
?offset=        # 페이징
?limit=         # 페이징
?resourceType=  # 필터 (커스텀 확장)
?lifecycleState= # 필터 (커스텀 확장)
```

> TMF 표준 외 OSS 운영에 필요한 API는 `/ext/` prefix로 추가 확장한다.

---

## ODA Component 스펙 (component.yaml)

```yaml
apiVersion: oda.tmforum.org/v1beta3
kind: Component
metadata:
  name: resource-inventory
  namespace: canvas
spec:
  type: TMF639
  version: "1.0.0"
  description: "Network Resource Inventory Management Component"
  maintainers:
    - name: "OSS Team"
  coreFunction:
    exposedAPIs:
      - name: resourceInventoryManagement
        specification: https://tmforum-rand.github.io/TMF639-Resource-Inventory-Management
        implementation: resource-inventory-svc
        path: /tmf-api/resourceInventoryManagement/v4
        port: 8080
  eventNotification:
    publishedEvents: []
    subscribedEvents: []
  managementFunction:
    exposedAPIs: []
  securityFunction:
    controllerRole: "resource-inventory-role"
```

---

## 개발 순서

```
1. SID 모델 확정
   └── models/ 아래 도메인 모델 작성
       OSS 요건에 맞게 characteristic 확장

2. OpenAPI 스펙 작성
   └── TMF639-swagger.yaml
       커스텀 필드 및 확장 API 포함

3. API 구현 (Node.js)
   └── routes → controllers → models 순서로 구현
       TMF 표준 응답 형식 준수

4. 로컬 테스트
   └── npm run dev
       curl 또는 Postman으로 API 검증

5. 컨테이너화
   └── Docker build & push

6. ODA Canvas 배포
   └── helm install

7. Canvas Portal 확인
   └── 컴포넌트 등록 상태 및 API 노출 확인
```

---

## 로컬 개발 환경

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 환경변수
PORT=8080
MONGODB_URI=mongodb://localhost:27017/resource-inventory
NODE_ENV=development
```

---

## 배포 (Rancher Desktop)

```bash
# Docker 빌드
docker build -t resource-inventory:latest .

# Helm 배포
helm install resource-inventory ./helm \
  -n canvas \
  --set image.tag=latest

# 배포 확인
kubectl get component -n canvas
kubectl get svc -n canvas
```

---

## 커스텀 확장 가이드

### SID 모델 확장
- `characteristic` 배열에 OSS 전용 속성 추가
- `@type` 으로 서브타입 정의 (PhysicalResource, LogicalResource 등)

### API 확장
- TMF 표준 유지하면서 `/ext/` prefix로 추가 엔드포인트
- 예: `GET /ext/resource/topology` — 토폴로지 조회

### TMF Component 확장
- `component.yaml`의 `exposedAPIs`에 확장 API 추가
- `subscribedEvents`로 타 컴포넌트 이벤트 구독 가능

---

## 참고

- [TMF639 스펙](https://www.tmforum.org/resources/specification/tmf639-resource-inventory-management-api-rest-specification-r19-0-0/)
- [ODA Canvas GitHub](https://github.com/tmforum-oda/oda-canvas)
- [ODA Component 스펙](https://github.com/tmforum-oda/oda-component-definitions)
