# PrinParty - 영상통화 MVP 구현 계획

## Context

랜덤 매칭 기반 영상통화 모바일 앱의 MVP를 구축한다.
Tinder 어플의 UX/UI 구조를 차용하되 민트색 테마를 적용하며, 최소 페이지 수로 핵심 기능만 구현한다.

---

## 기술 스택

| 항목 | 선택 | 이유 |
|------|------|------|
| 프레임워크 | Expo (React Native) | 빠른 MVP 개발, Expo Go 앱으로 실기기 즉시 테스트 |
| 언어 | TypeScript | 타입 안전성, SDK 자동완성 |
| 영상통화 | Agora.io | 모바일 최적화, React Native SDK, 월 10,000분 무료 |
| 백엔드 | Firebase Realtime Database | 서버리스, 매칭 대기열 실시간 관리 |
| 인증 | Firebase Anonymous Auth | 로그인 화면 없이 즉시 시작 |
| 상태관리 | React Context + useState | 규모가 작아 외부 라이브러리 불필요 |

---

## 페이지 구성 (4개)

```
App
├── IndexScreen        # 메인 화면 - "매칭 시작" 버튼
├── WaitingScreen      # 매칭 대기열 - 로딩 애니메이션
├── VideoCallScreen    # 영상통화 화면
└── (WaitingScreen 재사용) # 통화 종료 후 재대기
```

---

## 구현 단계

### Step 1. 프로젝트 초기화
```bash
npx create-expo-app prinparty --template expo-template-blank-typescript
cd prinparty
```

### Step 2. 의존성 설치
```bash
npm install firebase
npm install react-native-agora
npm install react-native-safe-area-context react-native-screens
```

### Step 3. Firebase 설정
- Firebase 프로젝트 생성
- Realtime Database 활성화
- Anonymous Auth 활성화
- `src/config/firebase.ts` — Firebase 초기화

**매칭 대기열 DB 구조:**
```json
{
  "queue": {
    "userId1": { "uid": "userId1", "joinedAt": 1234567890 }
  },
  "matches": {
    "matchId": {
      "user1": "userId1",
      "user2": "userId2",
      "channelName": "channel_matchId",
      "createdAt": 1234567890
    }
  }
}
```

### Step 4. 매칭 로직 (`src/services/matchingService.ts`)
- `joinQueue(uid)` — 대기열 입장
- `leaveQueue(uid)` — 대기열 이탈
- `listenForMatch(uid, callback)` — 매칭 완료 리스닝
- **매칭 알고리즘**: 대기열에 2명 이상 있을 경우 먼저 들어온 유저끼리 자동 매칭

### Step 5. Agora 영상통화 (`src/services/agoraService.ts`)
- Agora 앱 ID 설정
- `joinChannel(channelName, uid)` — 채널 입장
- `leaveChannel()` — 채널 퇴장
- 카메라/마이크 권한 처리

### Step 6. 화면 구현

#### `src/screens/IndexScreen.tsx`
- 연한 민트색 배경 (#E8F8F5)
- 중앙에 앱 로고/타이틀
- "매칭 시작" 버튼 (민트색, 둥근 모서리, Tinder 스타일)
- 버튼 탭 → 익명 로그인 후 WaitingScreen으로 이동

#### `src/screens/WaitingScreen.tsx`
- 로딩 스피너 애니메이션 (민트색)
- "상대방을 찾고 있어요..." 텍스트
- Firebase 대기열 입장 및 매칭 리스닝
- 매칭 완료 → VideoCallScreen으로 이동
- "취소" 버튼 → 대기열 이탈 후 IndexScreen

#### `src/screens/VideoCallScreen.tsx`
- 전체화면 상대방 영상 (원격)
- 우하단 소형 자신 영상 (로컬, PiP 스타일)
- 하단 컨트롤바: 마이크 on/off, 카메라 on/off, 통화 종료
- 통화 종료 → WaitingScreen으로 이동 (재대기)

### Step 7. 네비게이션 (`src/navigation/AppNavigator.tsx`)
- `useState<Screen>`으로 화면 전환 (expo-router 미사용)
- 화면 전환 상태: `index` → `waiting` → `videoCall`

---

## 디자인 시스템

```typescript
// src/constants/colors.ts
export const Colors = {
  primary: '#4ECDC4',      // 메인 민트
  primaryLight: '#E8F8F5', // 연한 민트 배경
  primaryDark: '#2DB5AB',  // 다크 민트 (버튼 hover)
  white: '#FFFFFF',
  text: '#2C3E50',
  textLight: '#7F8C8D',
  danger: '#E74C3C',       // 통화 종료 버튼
}
```

---

## 프로젝트 파일 구조

```
prinparty/
├── src/
│   ├── screens/
│   │   ├── IndexScreen.tsx
│   │   ├── WaitingScreen.tsx
│   │   └── VideoCallScreen.tsx
│   ├── services/
│   │   ├── matchingService.ts
│   │   └── agoraService.ts
│   ├── config/
│   │   └── firebase.ts
│   ├── constants/
│   │   └── colors.ts
│   └── navigation/
│       └── AppNavigator.tsx
├── app.json
├── App.tsx
└── package.json
```

---ff

## 검증 방법

1. `npm start` 실행 후 Expo Go 앱으로 실기기 테스트
2. 두 기기에서 동시에 앱 실행 → "매칭 시작" 버튼 탭
3. Firebase Console에서 대기열 입/퇴장 실시간 확인
4. 매칭 완료 후 영상통화 화면 진입 확인
5. 영상/음성 양방향 전송 확인
6. 통화 종료 후 WaitingScreen 재진입 확인
