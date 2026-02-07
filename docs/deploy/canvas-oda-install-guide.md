개요
이 가이드는 Kubernetes 클러스터에 ODA Canvas를 설치하고 구성하는 전체 과정을 설명합니다. ODA Canvas는 TMF(TM Forum) ODA 표준을 기반으로 하는 마이크로서비스 기반 플랫폼이며, Istio 서비스 메시시 위에서 동작합니다.

필수 요구사항:

Kubernetes 클러스터 (1.20 이상)
kubectl 설치 및 클러스터 접근 권한
Helm 3.0 이상
1단계: Helm Repository 추가
설치에 필요한 Helm 리포지토리를 추가합니다.
 
 
bash

# ODA Canvas
helm repo add oda-canvas https://tmforum-oda.github.io/oda-canvas

# Cert-Manager (Istio TLS 인증서 관리)
helm repo add jetstack https://charts.jetstack.io

# Bitnami (일반 애플리케이션)
helm repo add bitnami https://charts.bitnami.com/bitnami

# 리포지토리 업데이트
helm repo update
2단계: Istio 설치 및 구성
ODA Canvas는 Istio 서비스 메시를 기반으로 동작하므로 먼저 Istio를 설치해야 합니다.

2.1 Istio Helm Repository 추가

 
 
bash

helm repo add istio https://istio-release.storage.googleapis.com/charts
helm repo update
2.2 Istio 기본 구성 요소 설치

 
 
bash

# istio-system 네임스페이스 생성
kubectl create namespace istio-system

# Istio base 설치
helm install istio-base istio/base -n istio-system

# Istiod (Istio 제어 플레인) 설치
helm install istiod istio/istiod -n istio-system --wait
2.3 Istio Ingress Gateway 설치

 
 
bash

# istio-ingress 네임스페이스 생성
kubectl create namespace istio-ingress

# Sidecar 자동 주입 활성화
kubectl label namespace istio-ingress istio-injection=enabled

# Istio Gateway 설치
helm install istio-ingress istio/gateway -n istio-ingress \
  --set labels.app=istio-ingress \
  --set labels.istio=ingressgateway \
  --wait


2.4 Istio 설치 확인

 
 
bash

kubectl get pods -n istio-system
kubectl get pods -n istio-ingress
모든 포드가 Running 상태인지 확인합니다.

3단계: ODA Canvas 설치
3.1 Canvas 네임스페이스 생성

 
 
bash

kubectl create namespace canvas
3.2 Canvas 기본 설치
기본 설정으로 설치하는 가장 간단한 방법입니다.
 
 
bash

helm install canvas oda-canvas/canvas-oda -n canvas --create-namespace

3.3 사용자 정의 설치 (옵션)
values.yaml을 다운로드하여 수정한 후 설치할 수 있습니다.
 
 
bash

# 기본 values.yaml 다운로드
helm show values oda-canvas/canvas-oda > values.yaml

# values.yaml 편집
# (필요한 설정 수정)

# 사용자 정의 설정으로 설치
helm install canvas oda-canvas/canvas-oda -n canvas \
  --create-namespace \
  -f values.yaml
주요 수정 사항:

Vault 통합 (선택사항 - PoC에서는 일반적으로 비활성화)
외부 Keycloak 연동
데이터베이스 설정
리소스 할당
3.4 ODA Canvas 설치 상태 확인

 
 
bash

# Pod 상태 확인
kubectl get pods -n canvas

# Service 확인
kubectl get svc -n canvas
예상되는 주요 컴포넌트:

api-operator-istio: API 연산자
canvas-depapi-op-*: 의존성 API 연산자
canvas-info-service: 정보 서비스
canvas-keycloak-*: Keycloak 인증 서비스
canvas-pdb-management-operator-*: PDB 관리 연산자
canvas-postgresql-*: PostgreSQL 데이터베이스
canvas-resource-inventory-*: 리소스 인벤토리
canvas-smanop-*: 시크릿 관리 연산자 (Vault 미활성화 시 ConfigError 발생)
component-operator-*: 컴포넌트 연산자
identityconfig-operator-keycloak-*: ID 설정 연산자
주의: Vault를 활성화하지 않으면 canvas-smanop 포드에 CreateContainerConfigError가 발생하지만, PoC 환경에서는 무시해도 됩니다.

4단계: ODA Canvas CRD 확인
ODA Canvas는 다음의 Custom Resource Definition(CRD)을 정의합니다.
 
 
bash

kubectl get crd | grep oda

설치되어야 하는 CRD:

components.oda.tmforum.org - 컴포넌트 정의
exposedapis.oda.tmforum.org - 노출된 API
dependentapis.oda.tmforum.org - 의존 API
identityconfigs.oda.tmforum.org - ID 설정
secretsmanagements.oda.tmforum.org - 시크릿 관리
publishednotifications.oda.tmforum.org - 발행된 알림
subscribednotifications.oda.tmforum.org - 구독된 알림
availabilitypolicies.availability.oda.tmforum.org - 가용성 정책
5단계: Canvas Portal 설치
Canvas Portal은 ODA Canvas 관리 및 모니터링 대시보드입니다.

5.1 Canvas Portal 차트 가져오기

 
 
bash

# 공식 또는 사용자 정의 Canvas Portal Helm 차트 가져오기
# 우선 oda-canvas 전체

git clone <canvas-portal-repository>

git clone https://github.com/tmforum-oda/oda-canvas.git
cd canvas-portal/charts
5.2 Canvas Portal 설치
주의: Canvas Portal 이미지 버전에 따라 지원되는 CRD 버전이 다를 수 있습니다. 최신 버전의 표준 CRD와 호환되는 이미지를 사용하십시오.
 

helm install canvas-portal ./ -f values.yaml \
  -n canvas \
  --set imageCredentials.username=<your-username> \
  --set imageCredentials.password=<your-token>
default : pAssw0rd
values.yaml 수정 항목:

이미지 레지스트리 및 태그
Keycloak 연결 정보
Canvas 백엔드 API 엔드포인트
포탈 관리자 계정정보
 
bash

docker pull docker.io/wctdevops/canvas-portal:20240228 # 이미지 로컬에 다운

kind load docker-image docker.io/wctdevops/canvas-portal:20240228 --name dev-cluster # kind 환경에 구축시 해당 이미지를 다시 kind로 전달

kubectl -n canvas set image deployment/canvas-portal \\n  canvas-portal=wctdevops/canvas-portal:20240228  

kubectl -n canvas patch deployment canvas-portal \\n  -p '{"spec":{"template":{"spec":{"containers":[{"name":"canvas-portal","imagePullPolicy":"Never"}]}}}}'\n  # helm배포한 상황에서 이미지 업데이트

kubectl -n canvas rollout restart deployment/canvas-portal\n

kubectl -n canvas get pod\



5.3 Canvas Portal 접속 (개발 환경)
개발 환경에서는 포트포워딩을 통해 접속합니다.
 
 
bash

kubectl port-forward -n canvas svc/canvas-portal 8080:8080
브라우저에서 다음 주소로 접속합니다:
 
 

http://localhost:8080/canvas-portal
주의: 경로에 /canvas-portal을 명시적으로 포함해야 합니다.

기본 로그인 정보는 values.yaml의 다음 항목을 참고합니다:

env.portal.username - 포탈 사용자명
env.portal.password - 포탈 비밀번호
6단계: ODA 참고 컴포넌트 설치 (선택사항)
TMF에서 제공하는 참고 컴포넌트를 설치하여 ODA Canvas의 동작을 확인할 수 있습니다.

6.1 참고 컴포넌트 Helm Repository 추가

 
 
bash

helm repo add oda-components https://tmforum-oda.github.io/reference-example-components
helm repo update
6.2 사용 가능한 컴포넌트 확인

 
 
bash

helm search repo oda-components

# 출력 예시:
# NAME                                    CHART VERSION   APP VERSION   DESCRIPTION
# oda-components/productcatalog           1.3.0           1.16.0        A reference example TMFC001-ProductCatalogManagement
# oda-components/productinventory         1.2.0           1.16.0        A reference example TMFC005-ProductInventory
6.3 참고 컴포넌트 설치

 
 
bash

# 컴포넌트 설치를 위한 네임스페이스 생성
kubectl create namespace components

# Product Inventory 설치
helm install pi oda-components/productinventory -n components

# Product Catalog 설치 (의존 API 활성화)
helm install pc oda-components/productcatalog \
  --set component.dependentAPIs.enabled=true \
  -n components
6.4 참고 컴포넌트 설치 확인

 
 
bash

kubectl get pods -n components
kubectl get svc -n components
6.5 컴포넌트 CRD 확인

 
 
bash

kubectl get components,exposedapis,dependentapis,identityconfigs -n components
예상되는 출력:

Components: pc-productcatalogmanagement, pi-productinventory
ExposedAPIs: Product Catalog와 Product Inventory의 API 엔드포인트
DependentAPIs: 컴포넌트 간의 API 의존성
IdentityConfigs: Keycloak 통합 설정
Canvas Portal 대시보드 확인
Canvas Portal에 접속하면 다음 정보를 확인할 수 있습니다:

대시보드 주요 메뉴
ODA Status - 전체 시스템 상태
Component Instances - 설치된 컴포넌트 목록
Component Details - 선택된 컴포넌트의 상세 정보
API 엔드포인트
리소스 정보
인스턴스 설정
버전 히스토리
API 엔드포인트 확인
각 컴포넌트의 ExposedAPI를 통해 API 엔드포인트를 확인할 수 있습니다:
 
 
bash

kubectl get exposedapi -n components -o wide
예시:

https://172.20.0.3/pc-productcatalogmanagement/tmf-api/productCatalogManagement/v4
https://172.20.0.3/pi-productinventory/tmf-api/productInventory/v4
일반적인 문제 해결
1. Pod가 CreateContainerConfigError 상태인 경우
증상: canvas-smanop 포드가 CreateContainerConfigError 상태

원인: Vault 설정이 필요하지만 PoC 환경에서 비활성화됨

해결방법: values.yaml에서 Vault 통합을 비활성화하거나, Vault를 별도로 구성합니다.
 
 
bash

# 현재 상태 확인
kubectl describe pod <pod-name> -n canvas
2. ExposedAPI가 준비되지 않은 경우
증상: ExposedAPI의 IMPLEMENTATION_READY 상태가 false

확인:
 
 
bash

kubectl describe exposedapi <api-name> -n components
kubectl logs <component-pod> -n components
3. Keycloak 연결 문제
Keycloak 포드가 실행 중인지 확인합니다:
 
 
bash

kubectl get pod -n canvas -l app=canvas-keycloak
kubectl logs -n canvas <keycloak-pod-name>
4. 포트포워딩이 작동하지 않는 경우

 
 
bash

# 서비스 확인
kubectl get svc -n canvas canvas-portal

# 포트포워딩 재시도
kubectl port-forward -n canvas svc/canvas-portal 8080:8080 --address=0.0.0.0
생산 환경 고려사항
보안
Vault를 사용하여 시크릿 관리
TLS/SSL 인증서 설정
RBAC 정책 구성
NetworkPolicy를 통한 네트워크 격리
성능 및 확장성
각 컴포넌트의 리소스 요청/제한 조정
자동 스케일링 설정 (HPA)
데이터베이스 백업 전략
로깅 및 모니터링 구성
고가용성
Pod Disruption Budget 설정
다중 레플리카 구성
외부 로드 밸런서 설정
재해 복구 계획
유용한 명령어

 
 
bash

# 모든 네임스페이스의 포드 상태 확인
kubectl get pods -A

# 특정 컴포넌트 로그 확인
kubectl logs -n canvas -f <pod-name>

# 컴포넌트 상세 정보 확인
kubectl describe pod <pod-name> -n canvas

# Canvas 네임스페이스의 모든 리소스 확인
kubectl get all -n canvas

# Helm 설치 상태 확인
helm list -n canvas
helm status canvas -n canvas

# Helm 값 확인
helm get values canvas -n canvas

# Helm 설치 업그레이드
helm upgrade canvas oda-canvas/canvas-oda -n canvas -f values.yaml
참고 자료
ODA Canvas GitHub: https://github.com/tmforum-oda/oda-canvas
참고 컴포넌트: https://github.com/tmforum-oda/reference-example-components
Istio 문서: https://istio.io/latest/docs/
Helm 문서: https://helm.sh/docs/
