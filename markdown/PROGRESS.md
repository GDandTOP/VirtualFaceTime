# PrinParty - 진행 상황

## 완료된 작업

### ✅ 프로젝트 초기화
- Expo TypeScript 템플릿으로 프로젝트 생성
- 의존성 설치: `firebase`, `react-native-agora`, `react-native-safe-area-context`, `react-native-screens`, `expo-dev-client`

### ✅ 환경변수 설정 (.env)
- Firebase 설정값 6개 항목 입력 완료
- Agora App ID 입력 완료
- `.env.example` 템플릿 파일 생성
- `.gitignore`에 `.env` 추가

### ✅ Firebase 설정
- Realtime Database 활성화 완료
- Anonymous Auth 활성화 완료

### ✅ 소스코드 구현
| 파일 | 상태 |
|------|------|
| `src/constants/colors.ts` | 완료 |
| `src/config/firebase.ts` | 완료 |
| `src/services/matchingService.ts` | 완료 |
| `src/services/agoraService.ts` | 완료 |
| `src/screens/IndexScreen.tsx` | 완료 |
| `src/screens/WaitingScreen.tsx` | 완료 |
| `src/screens/VideoCallScreen.tsx` | 완료 |
| `src/navigation/AppNavigator.tsx` | 완료 |
| `App.tsx` | 완료 |

### ✅ EAS 설정
- `eas.json` 생성
- EAS 프로젝트 연결 완료 (ID: `19e2dadb-1295-4fdc-ab2c-13c6d60d043e`)
- `app.json`에 `bundleIdentifier`, `owner`, `projectId` 추가

### ✅ iOS 로컬 빌드
- `npx expo run:ios`로 빌드 성공
- iPhone 16e 시뮬레이터에서 실행 확인

---

## 남은 작업

- [ ] 실기기 테스트 (두 기기로 매칭 플로우 검증)
- [ ] Firebase DB에서 대기열/매칭 데이터 실시간 확인
- [ ] 영상/음성 양방향 전송 테스트
- [ ] Android 빌드 테스트 (필요 시)
