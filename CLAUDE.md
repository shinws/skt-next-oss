# ODA Resource Inventory Component - CLAUDE.md
> 이 파일은 Claude와의 바이브 코딩 세션 이력을 추적합니다.
> Git에 커밋하여 대화 맥락을 유지하세요.

---

## 📌 프로젝트 개요

**목표**: TMForum ODA 표준 기반 Resource Inventory 컴포넌트 구현  
**컴포넌트 ID**: TMFC012 - Resource Inventory  
**핵심 기능**: 통신 기지국(BTS) 장비 정보를 등록하고, 지역 기반으로 조회  
**표준 API**: TMF639 Resource Inventory Management API v4.0  

---

## 🏗️ 기술 스택

| 영역 | 선택 | 비고 |
|------|------|------|
| Runtime | Node.js (Express) | TMForum 레퍼런스 구현과 동일 |
| Database | MongoDB | Resource 도큐먼트 모델에 적합 |
| Container | Docker | |
| Orchestration | Kubernetes + Helm | ODA Canvas 배포 대상 |
| ODA Canvas | minikube (로컬) | 추후 연동 |
| API 스펙 | TMF639 v4.0 | |

---

## 📁 프로젝트 구조

```
oda-resource-inventory/
├── CLAUDE.md                    ← 이 파일 (이력 관리)
├── README.md
├── src/
│   ├── app.js                   ← Express 앱 진입점
│   ├── routes/
│   │   └── resource.js          ← TMF639 REST 엔드포인트
│   ├── models/
│   │   └── Resource.js          ← MongoDB 스키마
│   ├── controllers/
│   │   └── resourceController.js
│   └── middleware/
│       └── tmfResponse.js       ← TMF 표준 응답 포맷
├── helm/
│   └── resource-inventory/
│       ├── Chart.yaml
│       ├── values.yaml
│       └── templates/
│           ├── deployment.yaml
│           ├── service.yaml
│           └── component.yaml   ← ODA Component Envelope
├── data/
│   └── seed-bts.json            ← 기지국 샘플 데이터
├── docs/
│   └── api-design.md            ← API 설계 문서
├── Dockerfile
├── docker-compose.yml           ← 로컬 개발용
└── package.json
```

---

## 🗂️ 데이터 모델 (기지국 특화 TMF639)

```json
{
  "id": "BTS-SEL-GN-001",
  "href": "/tmf-api/resourceInventoryManagement/v4/resource/BTS-SEL-GN-001",
  "name": "서울-강남-LTE-001",
  "@type": "PhysicalResource",
  "category": "BaseStation",
  "resourceStatus": "available",
  "resourceCharacteristic": [
    { "name": "technology",    "value": "LTE" },
    { "name": "frequency",     "value": "2100MHz" },
    { "name": "vendor",        "value": "Samsung" },
    { "name": "model",         "value": "5G-NR-3.5G" },
    { "name": "installDate",   "value": "2022-03-15" },
    { "name": "maxCapacity",   "value": "1000" }
  ],
  "place": [{
    "@type": "GeographicAddress",
    "role": "location",
    "name": "강남구 테헤란로 기지국",
    "region": "서울",
    "district": "강남구",
    "street": "테헤란로 152",
    "lat": 37.498095,
    "lng": 127.027610
  }],
  "startOperatingDate": "2022-04-01T00:00:00Z",
  "lastUpdate": "2024-01-15T09:00:00Z"
}
```

---

## 🔌 API 엔드포인트 설계

### Core (TMF639 표준)
```
GET    /tmf-api/resourceInventoryManagement/v4/resource
POST   /tmf-api/resourceInventoryManagement/v4/resource
GET    /tmf-api/resourceInventoryManagement/v4/resource/{id}
PATCH  /tmf-api/resourceInventoryManagement/v4/resource/{id}
DELETE /tmf-api/resourceInventoryManagement/v4/resource/{id}
```

### 주요 쿼리 파라미터 (지역 기반 조회)
```
?place.region=서울
?place.district=강남구
?category=BaseStation
?resourceStatus=available
?resourceCharacteristic.name=technology&resourceCharacteristic.value=5G
?fields=id,name,place,resourceStatus     ← 필드 선택
?offset=0&limit=20                       ← 페이지네이션
```

---

## 📋 구현 진행 현황

### ✅ 완료
- [ ] 없음 (시작 전)

### 🔄 진행 중
- [ ] 없음

### 📅 예정
- [ ] Phase 0: 프로젝트 초기 구조 생성
- [ ] Phase 1: MongoDB Resource 스키마 구현
- [ ] Phase 2: TMF639 REST API 구현 (CRUD + 지역 필터)
- [ ] Phase 3: 샘플 기지국 데이터 시딩
- [ ] Phase 4: Docker + docker-compose 로컬 환경
- [ ] Phase 5: ODA Component Envelope (component.yaml)
- [ ] Phase 6: Helm Chart 패키징
- [ ] Phase 7: ODA CTK 검증

---

## 📝 세션 이력

### 세션 #1 - 프로젝트 셋업
- **날짜**: 2026-03-02
- **작업**: 프로젝트 구조 설계, CLAUDE.md 초기화
- **결정 사항**:
  - Node.js + Express + MongoDB 스택 채택
  - TMF639 v4.0 기준 구현
  - 지역(region/district) 기반 필터링을 핵심 기능으로 설정
  - ODA Component ID: TMFC012 기반으로 커스텀 구현
- **다음 할 일**: Phase 0 - 프로젝트 파일 생성 시작

---

## 🧠 Claude와의 작업 컨텍스트 규칙

1. **이 파일을 항상 대화 시작 시 붙여넣기** → Claude가 맥락 파악
2. **세션 종료 전 CLAUDE.md 업데이트** → 완료 항목 체크, 이력 추가
3. **Git 커밋 메시지 형식**: `[ODA] Phase N - 작업내용`
4. **변경 파일은 항상 세션 이력에 기록**

---

## ⚠️ 주요 결정 사항 & 제약

- TMF639 스펙 중 `Resource` 리소스만 우선 구현 (ResourceSpecification은 2차)
- 지역 필드는 한국 행정구역 기준: `region`(시/도), `district`(구/군)
- `resourceCharacteristic` 배열 내 필터링 지원 필요 (MongoDB에서 까다로움)
- ODA Canvas 연동은 Phase 5 이후 진행 (로컬 API 서버 먼저)

---

## 🔗 참고 링크

- [TMF639 API 스펙](https://www.tmforum.org/oda/open-apis/directory/resource-inventory-management-api-TMF639/v4.0)
- [TMFC012 Component Spec](https://www.tmforum.org/oda/directory/components-map/production/TMFC012)
- [ODA Component 설계 가이드](https://tmforum-oda.github.io/oda-ca-docs/docs/ODAComponentDesignGuidelines.html)
- [ODA CTK GitHub](https://github.com/tmforum-oda/oda-component-ctk)
- [TMF639 GitHub](https://github.com/tmforum-apis/TMF639_ResourceInventory)
