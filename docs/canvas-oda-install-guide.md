# Canvas ODA 설치 가이드

Oracle Digital Assistant(ODA) Web SDK를 활용하여 Canvas 채팅 위젯을 웹 애플리케이션에 통합하는 설치 가이드입니다.

---

## 목차

1. [사전 요구사항](#1-사전-요구사항)
2. [ODA 인스턴스 설정](#2-oda-인스턴스-설정)
3. [채널 생성 및 구성](#3-채널-생성-및-구성)
4. [Web SDK 설치](#4-web-sdk-설치)
5. [Canvas 위젯 초기화](#5-canvas-위젯-초기화)
6. [커스터마이징](#6-커스터마이징)
7. [보안 설정](#7-보안-설정)
8. [배포](#8-배포)
9. [문제 해결](#9-문제-해결)

---

## 1. 사전 요구사항

### ODA 환경

| 항목 | 요구사항 |
|------|---------|
| Oracle Cloud 계정 | ODA 서비스 접근 권한이 있는 Oracle Cloud 계정 |
| ODA 인스턴스 | 프로비저닝 완료된 ODA 인스턴스 |
| ODA 버전 | 21.04 이상 권장 |

### 개발 환경

| 항목 | 요구사항 |
|------|---------|
| Node.js | v16.x 이상 |
| npm / yarn | npm v8.x 이상 또는 yarn v1.22.x 이상 |
| 웹 브라우저 | Chrome, Firefox, Safari, Edge 최신 버전 |
| HTTPS | 프로덕션 환경에서 필수 |

---

## 2. ODA 인스턴스 설정

### 2.1 ODA 인스턴스 프로비저닝

1. [Oracle Cloud Console](https://cloud.oracle.com)에 로그인합니다.
2. 좌측 메뉴에서 **Analytics & AI > Digital Assistant**를 선택합니다.
3. **Create Digital Assistant Instance**를 클릭합니다.
4. 아래 정보를 입력합니다:

   | 필드 | 값 |
   |------|-----|
   | Name | 인스턴스 이름 (예: `skt-canvas-oda`) |
   | Compartment | 사용할 Compartment 선택 |
   | Shape | Development 또는 Production |

5. **Create**를 클릭하고 프로비저닝이 완료될 때까지 대기합니다. (약 15-30분 소요)

### 2.2 Skill 생성

1. ODA 인스턴스 콘솔에 접속합니다.
2. 좌측 메뉴에서 **Skills**를 선택합니다.
3. **+ New Skill**을 클릭하여 새 Skill을 생성합니다.
4. Skill 이름과 버전을 입력합니다.

---

## 3. 채널 생성 및 구성

### 3.1 Oracle Web 채널 생성

1. ODA 콘솔에서 좌측 메뉴의 **Channels**를 선택합니다.
2. **+ Add Channel**을 클릭합니다.
3. 아래와 같이 구성합니다:

   | 필드 | 값 |
   |------|-----|
   | Name | 채널 이름 (예: `canvas-web-channel`) |
   | Channel Type | **Oracle Web** |
   | Allowed Domains | 위젯을 사용할 도메인 (예: `*.example.com`) |
   | Client Authentication Enabled | 보안 요구사항에 따라 설정 |

4. **Create**를 클릭합니다.

### 3.2 채널 정보 확인

채널 생성 후 아래 정보를 기록합니다. SDK 초기화에 필요합니다.

- **Channel ID**: 채널 고유 식별자
- **ODA URI**: ODA 인스턴스의 URI (예: `oda-xxxxxxx-xx.data.digitalassistant.oci.oraclecloud.com`)

### 3.3 채널 라우팅

1. 채널 상세 페이지에서 **Route To** 항목에서 연결할 Skill 또는 Digital Assistant를 선택합니다.
2. **Channel Enabled** 토글을 활성화합니다.

---

## 4. Web SDK 설치

### 4.1 CDN 방식 (권장 - 빠른 시작)

HTML 파일의 `<head>` 태그 안에 아래 스크립트를 추가합니다:

```html
<script src="https://cdn.oracle.com/oda/latest/web-sdk.js"></script>
```

특정 버전을 사용하려면:

```html
<script src="https://cdn.oracle.com/oda/24.06/web-sdk.js"></script>
```

### 4.2 npm 패키지 방식

```bash
npm install @anthropic/oda-web-sdk
```

또는 Oracle 제공 패키지:

```bash
npm install @oracle/bots-node-sdk
```

### 4.3 수동 다운로드 방식

1. [Oracle ODA Downloads](https://docs.oracle.com/en/cloud/paas/digital-assistant/sdks.html)에서 Web SDK를 다운로드합니다.
2. 압축을 해제하고 프로젝트의 정적 파일 디렉토리에 배치합니다:

```
project/
├── public/
│   └── scripts/
│       └── web-sdk.js
├── src/
└── ...
```

---

## 5. Canvas 위젯 초기화

### 5.1 기본 초기화

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Canvas ODA</title>
</head>
<body>
    <!-- ODA Web SDK -->
    <script src="https://cdn.oracle.com/oda/latest/web-sdk.js"
            onload="initODA()">
    </script>

    <script>
        function initODA() {
            var chatSettings = {
                URI: 'oda-xxxxxxx-xx.data.digitalassistant.oci.oraclecloud.com',
                channelId: 'your-channel-id-here',
                enableAutocomplete: true,
                enableBotAudioResponse: false,
                enableClearMessage: true,
                showConnectionStatus: true,
                displayActionsAsPills: true,
                i18n: {
                    ko: {
                        chatTitle: 'Canvas 어시스턴트',
                        inputPlaceholder: '메시지를 입력하세요...',
                        send: '전송'
                    }
                },
                locale: 'ko'
            };

            Bots.init(chatSettings);
        }
    </script>
</body>
</html>
```

### 5.2 React/Next.js 프로젝트 통합

```jsx
// components/OdaChat.jsx
import { useEffect, useRef } from 'react';

const ODA_CONFIG = {
  URI: process.env.NEXT_PUBLIC_ODA_URI,
  channelId: process.env.NEXT_PUBLIC_ODA_CHANNEL_ID,
};

export default function OdaChat() {
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;

    const script = document.createElement('script');
    script.src = 'https://cdn.oracle.com/oda/latest/web-sdk.js';
    script.async = true;
    script.onload = () => {
      if (window.Bots) {
        window.Bots.init({
          ...ODA_CONFIG,
          enableAutocomplete: true,
          displayActionsAsPills: true,
          i18n: {
            ko: {
              chatTitle: 'Canvas 어시스턴트',
              inputPlaceholder: '메시지를 입력하세요...',
            },
          },
          locale: 'ko',
        });
        initialized.current = true;
      }
    };

    document.head.appendChild(script);

    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return null; // SDK가 자체적으로 위젯 UI를 렌더링합니다
}
```

### 5.3 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성합니다:

```env
# ODA Configuration
NEXT_PUBLIC_ODA_URI=oda-xxxxxxx-xx.data.digitalassistant.oci.oraclecloud.com
NEXT_PUBLIC_ODA_CHANNEL_ID=your-channel-id-here
```

> **주의:** `.env.local` 파일은 절대 Git에 커밋하지 마세요. `.gitignore`에 포함되어 있는지 확인하세요.

---

## 6. 커스터마이징

### 6.1 위젯 테마 설정

```javascript
var chatSettings = {
    // ... 기본 설정 ...

    colors: {
        branding: '#E4002B',          // SKT 브랜드 컬러
        text: '#212121',              // 텍스트 색상
        textLight: '#757575',         // 보조 텍스트 색상
        headerBackground: '#E4002B',  // 헤더 배경색
        headerText: '#FFFFFF',        // 헤더 텍스트 색상
        botMessageBackground: '#F5F5F5',
        userMessageBackground: '#E4002B',
        userMessageText: '#FFFFFF'
    },

    icons: {
        logo: '/assets/images/canvas-logo.png',
        avatarBot: '/assets/images/bot-avatar.png',
        avatarUser: '/assets/images/user-avatar.png'
    },

    position: {
        bottom: '20px',
        right: '20px'
    }
};
```

### 6.2 위젯 크기 조정

```css
/* ODA 위젯 크기 커스터마이징 */
.oda-chat-wrapper {
    width: 400px !important;
    height: 600px !important;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
    .oda-chat-wrapper {
        width: 100% !important;
        height: 100% !important;
        bottom: 0 !important;
        right: 0 !important;
    }
}
```

### 6.3 커스텀 메시지 핸들러

```javascript
var chatSettings = {
    // ... 기본 설정 ...

    delegate: {
        beforeDisplay: function(message) {
            // 메시지 표시 전 가공
            console.log('수신 메시지:', message);
            return message;
        },
        beforeSend: function(message) {
            // 메시지 전송 전 가공
            return message;
        },
        beforePostbackSend: function(postback) {
            // Postback 전송 전 처리
            return postback;
        }
    }
};
```

---

## 7. 보안 설정

### 7.1 Client Authentication 활성화

프로덕션 환경에서는 반드시 Client Authentication을 활성화해야 합니다.

1. ODA 콘솔에서 채널 설정으로 이동합니다.
2. **Client Authentication Enabled**를 `ON`으로 설정합니다.

### 7.2 JWT 토큰 인증 구현

서버 사이드에서 JWT 토큰을 생성하는 API를 구현합니다:

```javascript
// pages/api/oda-token.js (Next.js API Route)
import jwt from 'jsonwebtoken';

export default function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    const channelId = process.env.ODA_CHANNEL_ID;
    const secretKey = process.env.ODA_SECRET_KEY;

    const token = jwt.sign(
        { channelId: channelId },
        secretKey,
        { expiresIn: '1h' }
    );

    res.status(200).json({ token });
}
```

클라이언트에서 토큰을 사용하여 초기화:

```javascript
var chatSettings = {
    URI: 'oda-xxxxxxx-xx.data.digitalassistant.oci.oraclecloud.com',
    channelId: 'your-channel-id-here',
    clientAuthEnabled: true,

    // JWT 토큰 제공 함수
    tokenGenerator: async function() {
        const response = await fetch('/api/oda-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        const data = await response.json();
        return data.token;
    }
};
```

### 7.3 Allowed Domains 설정

채널 설정에서 허용된 도메인만 지정하여 무단 접근을 방지합니다:

```
허용 도메인 예시:
- https://www.example.com
- https://app.example.com
- https://staging.example.com
```

---

## 8. 배포

### 8.1 배포 전 체크리스트

- [ ] ODA 인스턴스가 Production Shape으로 설정되어 있는지 확인
- [ ] Client Authentication이 활성화되어 있는지 확인
- [ ] Allowed Domains에 프로덕션 도메인이 등록되어 있는지 확인
- [ ] 환경 변수가 올바르게 설정되어 있는지 확인
- [ ] HTTPS가 적용되어 있는지 확인
- [ ] 에러 핸들링이 구현되어 있는지 확인
- [ ] 브라우저 호환성 테스트 완료

### 8.2 환경별 설정

| 환경 | ODA URI | Client Auth | Allowed Domains |
|------|---------|-------------|-----------------|
| Development | dev-oda-instance | OFF (선택) | `localhost:3000` |
| Staging | staging-oda-instance | ON | `staging.example.com` |
| Production | prod-oda-instance | ON | `www.example.com` |

### 8.3 Vercel 배포 (Next.js)

```bash
# 환경 변수 설정
vercel env add NEXT_PUBLIC_ODA_URI
vercel env add NEXT_PUBLIC_ODA_CHANNEL_ID
vercel env add ODA_SECRET_KEY

# 배포
vercel --prod
```

---

## 9. 문제 해결

### 일반적인 오류 및 해결 방법

#### 위젯이 표시되지 않음

```
원인: SDK 스크립트 로딩 실패 또는 초기화 오류
해결:
1. 브라우저 개발자 도구 > Console에서 오류 메시지를 확인합니다.
2. SDK URL이 올바른지 확인합니다.
3. Content Security Policy(CSP)가 Oracle CDN을 차단하고 있지 않은지 확인합니다.
```

CSP 헤더에 아래 도메인을 허용합니다:

```
Content-Security-Policy:
  script-src 'self' https://cdn.oracle.com;
  connect-src 'self' wss://*.data.digitalassistant.oci.oraclecloud.com;
```

#### 연결 실패 (WebSocket 오류)

```
원인: ODA URI 또는 Channel ID가 잘못되었거나 채널이 비활성화 상태
해결:
1. ODA URI와 Channel ID를 다시 확인합니다.
2. ODA 콘솔에서 채널이 Enabled 상태인지 확인합니다.
3. 네트워크 방화벽이 WebSocket 연결을 차단하고 있지 않은지 확인합니다.
```

#### 인증 오류 (401/403)

```
원인: JWT 토큰 만료 또는 Secret Key 불일치
해결:
1. Secret Key가 ODA 콘솔의 값과 일치하는지 확인합니다.
2. 토큰 만료 시간(expiresIn)을 확인합니다.
3. 서버 시간이 올바른지 확인합니다. (시간 차이가 크면 토큰 검증 실패)
```

#### CORS 오류

```
원인: 허용되지 않은 도메인에서의 접근
해결:
1. ODA 채널 설정에서 Allowed Domains에 현재 도메인을 추가합니다.
2. 프로토콜(http/https)을 포함한 전체 도메인을 입력합니다.
```

---

## 참고 자료

- [Oracle Digital Assistant 공식 문서](https://docs.oracle.com/en/cloud/paas/digital-assistant/)
- [ODA Web SDK Reference](https://docs.oracle.com/en/cloud/paas/digital-assistant/use-chatbot/web-channel.html)
- [Oracle Web SDK GitHub](https://github.com/oracle/bots-node-sdk)
