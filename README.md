<div align="center">

<img src="assets/icon.png" alt="PrinParty 로고" width="120" height="120" style="border-radius: 24px;" />

# PrinParty

**랜덤 영상통화 매칭 앱**

[![플랫폼](https://img.shields.io/badge/플랫폼-iOS%20%7C%20Android-lightgrey?style=flat-square)](https://expo.dev)
[![Expo](https://img.shields.io/badge/Expo-54.0-black?style=flat-square&logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?style=flat-square&logo=react)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org)
[![Firebase](https://img.shields.io/badge/Firebase-12.9-FFCA28?style=flat-square&logo=firebase)](https://firebase.google.com)
[![Agora](https://img.shields.io/badge/Agora.io-SDK-099DFD?style=flat-square)](https://agora.io)

*버튼 하나로 낯선 사람과 실시간 영상통화 — 회원가입 없이, 바로 연결.*

</div>

---

## ✨ 주요 기능

- **원탭 시작** — Firebase 익명 로그인으로 버튼 누르는 순간 자동 로그인. 계정 불필요.
- **실시간 매칭** — Firebase Realtime Database 대기열에 `runTransaction`(원자적 처리)을 적용해 동시 접속 상황에서도 중복 매칭 없이 안전하게 연결.
- **HD 영상통화** — Agora.io RTC로 저지연 고화질 양방향 영상·음성 제공.
- **클라이언트 측 토큰 생성** — Agora AccessToken v006(HMAC-SHA256 + CRC32)을 디바이스에서 직접 생성 — 별도 토큰 서버 불필요.
- **최근 통화 상대 제외** — 직전 3명의 매칭 상대는 다음 매칭 풀에서 제외되어 항상 새로운 사람과 연결.
- **자동 재대기** — 통화 종료 후 별도 조작 없이 자동으로 대기열에 재진입.
- **화면 속 화면(PiP) UI** — 내 화면은 우측 하단 미니 화면으로 고정되고, 상대방 화면이 전체 화면을 채움.
- **중복 통화 방지** — `matchFoundRef`, `callEndedRef`, `cancelledRef` 등 복수의 ref 가드로 Firebase 중복 쓰기와 Agora 중복 동작을 차단.

---

## 🏗️ 기술 스택

| 영역 | 기술 | 비고 |
|------|------|------|
| 프레임워크 | [Expo](https://expo.dev) (React Native) ~54 | Development Build 필요 — Expo Go 미지원 |
| 언어 | TypeScript 5.9 | Strict 모드 활성화 |
| 영상통화 | [Agora.io](https://agora.io) `react-native-agora` ^4.5 | 월 10,000분 무료 |
| 인증 | Firebase 익명 인증 | 가입 없이 즉시 로그인 |
| 실시간 DB | Firebase Realtime Database | 대기열 + 매치 문서 저장 |
| 상태 관리 | React `useState` | 외부 라이브러리 미사용 |
| 네비게이션 | 커스텀 `AppNavigator` (`useState<Screen>`) | expo-router 미사용 |
| 아이콘 | `@expo/vector-icons` (Ionicons) | |
| 빌드 | EAS Build | iOS & Android 클라우드 빌드 |

---

## 📱 화면 흐름

```
IndexScreen  ──▶  WaitingScreen  ──▶  VideoCallScreen
(시작 버튼)       (대기열 + 매칭)       (실시간 통화)
                       ▲                    │
                       └────────────────────┘
                        통화 종료 후 자동 재대기
```

---

## 🚀 빠른 시작

### 사전 준비

| 도구 | 버전 | 설치 방법 |
|------|------|-----------|
| Node.js | ≥ 18 | [nodejs.org](https://nodejs.org) |
| npm | ≥ 9 | Node 설치 시 포함 |
| Expo CLI | 최신 | `npm i -g expo-cli` |
| EAS CLI | 최신 | `npm i -g eas-cli` |
| Xcode | ≥ 15 | Mac App Store (iOS 전용) |
| Android Studio | 최신 | [developer.android.com](https://developer.android.com/studio) (Android 전용) |

### 1. 저장소 클론

```bash
git clone https://github.com/GDandTOP/VirtualFaceTime.git
cd VirtualFaceTime
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경변수 설정

```bash
cp .env.example .env
```

`.env` 파일을 열어 아래 값을 입력하세요:

```env
# Firebase — https://console.firebase.google.com
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_DATABASE_URL=https://your_project-default-rtdb.firebaseio.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id

# Agora — https://console.agora.io
EXPO_PUBLIC_AGORA_APP_ID=your_agora_app_id
EXPO_PUBLIC_AGORA_APP_CERTIFICATE=your_agora_certificate  # 테스트 모드에서는 생략 가능
```

> **참고:** `EXPO_PUBLIC_AGORA_APP_CERTIFICATE`는 선택 사항입니다. 생략하면 테스트 모드(빈 토큰)로 동작합니다. 프로덕션 환경에서는 반드시 설정하세요.

### 4. Firebase 초기 설정 (최초 1회)

1. [Firebase Console](https://console.firebase.google.com) → 프로젝트 선택 → **Authentication** → **익명** 로그인 활성화.
2. **Realtime Database** → 데이터베이스 생성 → 아래 보안 규칙 적용:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

### 5. 앱 실행

> `react-native-agora`는 **Development Build** 필요 — Expo Go에서는 동작하지 않습니다.

```bash
# iOS 시뮬레이터 (macOS 전용)
npm run ios

# Android 에뮬레이터
npm run android

# 개발 서버만 시작
npm start
```

---

## 📁 프로젝트 구조

```
prinparty/
├── App.tsx                        # 진입점 — AppNavigator를 SafeAreaProvider로 감쌈
├── index.ts                       # Expo 앱 등록
├── app.json                       # Expo 설정 (번들 ID, 권한, EAS 프로젝트 ID)
├── eas.json                       # EAS Build 프로파일 (development / preview / production)
├── metro.config.js                # Metro 번들러 설정
├── .env.example                   # 환경변수 템플릿
│
├── assets/                        # 앱 아이콘 및 스플래시 이미지
│
└── src/
    ├── navigation/
    │   └── AppNavigator.tsx        # 화면 상태 머신 (index → waiting → videoCall)
    │
    ├── screens/
    │   ├── IndexScreen.tsx         # 홈 화면 — 익명 로그인 + "매칭 시작" 버튼
    │   ├── WaitingScreen.tsx       # 대기 화면 — 애니메이션 스피너 + 취소 버튼
    │   └── VideoCallScreen.tsx     # 통화 화면 — 전체 화면 원격 영상 + PiP 로컬 미리보기
    │
    ├── services/
    │   ├── matchingService.ts      # Firebase 대기열 로직 (joinQueue, tryMatch, listenForMatch)
    │   └── agoraService.ts         # Agora RTC 엔진 (initAgora, joinChannel, leaveChannel, 토큰)
    │
    ├── config/
    │   └── firebase.ts             # Firebase 앱 초기화
    │
    └── constants/
        └── colors.ts               # 디자인 시스템 (Colors, Typography, Spacing, Radius, Shadows)
```

---

## 🔄 매칭 동작 원리

매칭 파이프라인은 **원자적이고 경쟁 조건 없이** 동작합니다:

```
사용자 A가 "시작" 버튼 누름    사용자 B가 "시작" 버튼 누름
          │                              │
   signInAnonymously()           signInAnonymously()
          │                              │
   joinQueue(uidA)                joinQueue(uidB)
   /queue/{uidA} 기록             /queue/{uidB} 기록
          │                              │
   tryMatch(uidA) ──────────── tryMatch(uidB)
          └────────── runTransaction ────┘
                            │
                  한 트랜잭션만 성공:
                  /queue 정리됨
                  /matches/{id} 생성됨
                            │
               양쪽 클라이언트에 listenForMatch 발화
                            │
                   화면 → 'videoCall'
```

`/queue` 전체 노드에 대한 `runTransaction`은 몇 명이 동시에 `tryMatch`를 호출해도 **단 하나의** 매치 문서만 생성됨을 보장합니다.

---

## 🗄️ Firebase 데이터베이스 스키마

```
Firebase Realtime Database
├── /queue/{uid}
│     ├── uid: string             # Firebase 익명 사용자 ID
│     ├── joinedAt: number        # Unix 타임스탬프 (ms) — FIFO 순서 결정
│     └── recentContacts: string[] # 최근 매칭된 UID 3개 (매칭 제외 대상)
│
└── /matches/{matchId}
      ├── user1: string           # 첫 번째 매칭 사용자 UID
      ├── user2: string           # 두 번째 매칭 사용자 UID
      ├── channelName: string     # "channel_{matchId}" — Agora 채널명
      └── createdAt: number       # Unix 타임스탬프 (ms)
```

---

## 🔧 환경변수 목록

| 변수명 | 필수 여부 | 설명 |
|--------|-----------|------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | ✅ | Firebase 프로젝트 API 키 |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | ✅ | Firebase Auth 도메인 |
| `EXPO_PUBLIC_FIREBASE_DATABASE_URL` | ✅ | Realtime Database URL |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | ✅ | Firebase 프로젝트 ID |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | ✅ | Firebase Storage 버킷 |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ✅ | FCM 발신자 ID |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | ✅ | Firebase 앱 ID |
| `EXPO_PUBLIC_AGORA_APP_ID` | ✅ | Agora 프로젝트 App ID |
| `EXPO_PUBLIC_AGORA_APP_CERTIFICATE` | ⬜ | Agora App Certificate (프로덕션 토큰 서명용) |

> 모든 변수는 React Native 번들에서 런타임에 접근 가능하도록 반드시 `EXPO_PUBLIC_` 접두사를 붙여야 합니다.

---

## 🏗️ 프로덕션 빌드

PrinParty는 클라우드 빌드를 위해 [EAS Build](https://docs.expo.dev/build/introduction/)를 사용합니다.

```bash
# EAS CLI 설치
npm install -g eas-cli

# Expo 계정 로그인
eas login

# iOS 빌드 (TestFlight / App Store)
eas build --platform ios --profile production

# Android 빌드 (Play Store)
eas build --platform android --profile production

# 내부 배포 빌드 (QR 코드로 설치)
eas build --platform all --profile preview
```

---

## 🛡️ 중복 통화 방지 장치

| 위치 | 방지 대상 | 메커니즘 |
|------|-----------|----------|
| `matchingService.ts` | 동시 중복 매칭 | `runTransaction` 원자적 업데이트 |
| `WaitingScreen.tsx` | 매칭 콜백 중복 실행 | `matchFoundRef` boolean 가드 |
| `WaitingScreen.tsx` | 매칭 후 `leaveQueue` 호출 | `cancelledRef` boolean 가드 |
| `VideoCallScreen.tsx` | 버튼과 `onUserOffline` 동시 종료 | `callEndedRef` boolean 가드 |
| `agoraService.ts` | Agora 엔진 중복 초기화 | `if (!engine)` 멱등 패턴 |

---

## 📋 개발 명령어

```bash
# Expo 개발 서버 시작
npm start

# 터널 모드로 시작 (다른 네트워크의 실기기 연결 시)
npm run start:tunnel

# iOS 시뮬레이터 실행
npm run ios

# Android 에뮬레이터 실행
npm run android

# 타입 검사 (@expo/cli 심볼릭 링크 문제 우회)
node node_modules/typescript/lib/tsc.js --noEmit
```

---

## 🎨 디자인 시스템

앱은 차분하고 친근한 UX를 위해 민트 그린 테마를 사용합니다:

| 토큰 | 값 | 사용처 |
|------|----|--------|
| `primary` | `#4ECDC4` | 버튼, 로더, 활성 상태 |
| `primaryLight` | `#E8F8F5` | 배경, 스플래시 화면 |
| `primaryDark` | `#2DB5AB` | 버튼 눌림 상태 |
| `danger` | `#FF4757` | 통화 종료 버튼 |
| `darkBg` | `#0F0F1A` | 영상통화 화면 배경 |

전체 디자인 토큰(Typography, Spacing, Radius, Shadows)은 `src/constants/colors.ts`에 정의되어 있습니다.

---

## 📄 라이선스

이 프로젝트는 비공개 프로젝트로, 공개 배포를 위한 라이선스를 부여하지 않습니다.

---

<div align="center">
  Expo · Firebase · Agora.io 로 만들어졌습니다
</div>
