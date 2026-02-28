#!/bin/bash
# ─────────────────────────────────────────────────────────────────
# PrinParty 개발 서버 시작 스크립트
# 실행: npm start
#
# 자동으로 처리하는 것들:
#   1. 기존 서버(8081) 종료
#   2. iOS 시뮬레이터 부팅 확인
#   3. Android 에뮬레이터 부팅 (꺼져있으면 자동 시작, 네트워크 정상화)
#   4. Expo Metro 서버 시작
#   5. Metro 준비되면 iOS/Android 앱 자동 연결
# ─────────────────────────────────────────────────────────────────

# ── 설정 ──────────────────────────────────────────────────────────
ANDROID_SDK="$HOME/Library/Android/sdk"
ADB="$ANDROID_SDK/platform-tools/adb"
EMULATOR_BIN="$ANDROID_SDK/emulator/emulator"
ANDROID_AVD="Pixel_8"                            # 사용할 AVD 이름
IOS_SIM_ID="93664DA0-283F-46CD-9B3A-7C2B130539BA" # iPhone 16e
APP_BUNDLE="com.younguk.prinparty"
EXPO_DEEP_LINK="exp+prinparty://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"

# ── 색상 출력 ─────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
err()  { echo -e "${RED}  ❌ $1${NC}"; }
step() { echo -e "\n${CYAN}▶ $1${NC}"; }
cmd()  { echo -e "  ${YELLOW}$ $1${NC}"; }

echo -e "${CYAN}"
echo "╔══════════════════════════════════╗"
echo "║     PrinParty Dev 서버 시작       ║"
echo "╚══════════════════════════════════╝"
echo -e "${NC}"

# ── STEP 1. 기존 서버 종료 ────────────────────────────────────────
step "기존 프로세스 정리"
cmd "lsof -ti:8081 | xargs kill -9"
lsof -ti:8081 | xargs kill -9 2>/dev/null && log "포트 8081 종료됨" || log "포트 8081 비어있음"

# ── STEP 2. ADB 재시작 (오프라인 방지) ───────────────────────────
step "ADB 초기화"
cmd "adb kill-server && adb start-server"
"$ADB" kill-server 2>/dev/null
"$ADB" start-server 2>/dev/null
sleep 1
log "ADB 재시작 완료"

# ── STEP 3. iOS 시뮬레이터 확인 ──────────────────────────────────
step "iOS 시뮬레이터 확인"

# 현재 Booted 상태인 시뮬레이터 찾기
BOOTED_IOS=$(xcrun simctl list devices 2>/dev/null | grep "Booted" | grep -oE "[0-9A-F-]{36}" | head -1)

cmd "xcrun simctl list devices | grep Booted"
if [ -n "$BOOTED_IOS" ]; then
  IOS_SIM_ID="$BOOTED_IOS"
  log "iOS 시뮬레이터 이미 실행 중 (ID: $IOS_SIM_ID)"
else
  warn "부팅된 시뮬레이터 없음. iPhone 16e 시작 중..."
  cmd "xcrun simctl boot $IOS_SIM_ID && open -a Simulator"
  xcrun simctl boot "$IOS_SIM_ID" 2>/dev/null || true
  open -a Simulator
  sleep 5
  log "iOS 시뮬레이터 시작됨"
fi

# iOS 앱 설치 여부 확인
cmd "xcrun simctl listapps $IOS_SIM_ID | grep $APP_BUNDLE"
IOS_INSTALLED=$(xcrun simctl listapps "$IOS_SIM_ID" 2>/dev/null | grep "$APP_BUNDLE" | wc -l | tr -d ' ')
if [ "$IOS_INSTALLED" = "0" ]; then
  warn "iOS 앱 미설치. 아래 명령어로 먼저 빌드하세요:"
  warn "  npx expo run:ios"
fi

# ── STEP 4. Android 에뮬레이터 확인 ──────────────────────────────
step "Android 에뮬레이터 확인"

cmd "adb devices | grep emulator"
ANDROID_STATE=$("$ADB" devices 2>/dev/null | grep "emulator" | awk '{print $2}' | head -1)

if [ "$ANDROID_STATE" = "device" ]; then
  log "Android 에뮬레이터 이미 실행 중"
else
  warn "에뮬레이터 없음 또는 오프라인. 콜드부팅 시작 중..."

  # 혹시 zombie 프로세스 정리
  cmd "pkill -f emulator.*$ANDROID_AVD"
  pkill -f "emulator.*$ANDROID_AVD" 2>/dev/null || true
  sleep 2

  # 네트워크 정상화 옵션으로 에뮬레이터 시작
  cmd "emulator -avd $ANDROID_AVD -no-snapshot-load -dns-server 8.8.8.8"
  nohup "$EMULATOR_BIN" -avd "$ANDROID_AVD" -no-snapshot-load -dns-server 8.8.8.8 \
    > /tmp/prinparty-emulator.log 2>&1 &

  step "Android 부팅 대기 중 (최대 2분)..."

  # 에뮬레이터 연결 대기
  WAIT=0
  until "$ADB" devices 2>/dev/null | grep -q "emulator.*device"; do
    sleep 3; WAIT=$((WAIT+3))
    if [ $WAIT -ge 120 ]; then
      err "에뮬레이터 시작 시간 초과. 수동으로 Android Studio에서 에뮬레이터를 켜주세요."
      break
    fi
    printf "."
  done
  echo ""

  # 완전 부팅 대기
  BOOT_WAIT=0
  until [ "$("$ADB" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" = "1" ]; do
    sleep 3; BOOT_WAIT=$((BOOT_WAIT+3))
    if [ $BOOT_WAIT -ge 60 ]; then break; fi
    printf "."
  done
  echo ""

  # 오프라인 방지 adb 재시작
  cmd "adb kill-server && adb start-server"
  "$ADB" kill-server 2>/dev/null
  "$ADB" start-server 2>/dev/null
  sleep 2

  log "Android 에뮬레이터 준비 완료"
fi

# Android 앱 설치 여부 확인
cmd "adb shell pm list packages | grep $APP_BUNDLE"
ANDROID_INSTALLED=$("$ADB" shell pm list packages 2>/dev/null | grep "$APP_BUNDLE" | wc -l | tr -d ' ')
if [ "$ANDROID_INSTALLED" = "0" ]; then
  warn "Android 앱 미설치. 아래 명령어로 먼저 빌드하세요:"
  warn "  npx expo run:android"
fi

# ── STEP 5. Metro 준비 후 앱 자동 연결 (백그라운드) ──────────────
(
  # Metro 서버 포트 열릴 때까지 대기
  printf "\n  ⏳ Metro 서버 대기 중"
  until lsof -i:8081 -sTCP:LISTEN > /dev/null 2>&1; do
    sleep 1; printf "."
  done
  sleep 3 # 안정화 대기
  echo -e "\n"

  # iOS 앱 연결
  echo -e "  ${YELLOW}$ xcrun simctl openurl $IOS_SIM_ID exp+prinparty://...localhost:8081${NC}"
  xcrun simctl openurl "$IOS_SIM_ID" "$EXPO_DEEP_LINK" 2>/dev/null \
    && echo -e "${GREEN}  ✅ iOS 앱 연결됨${NC}" \
    || echo -e "${YELLOW}  ⚠️  iOS 앱 연결 실패 (앱이 설치되어 있는지 확인)${NC}"

  # Android 포트 포워딩 + 앱 연결
  echo -e "  ${YELLOW}$ adb reverse tcp:8081 tcp:8081${NC}"
  "$ADB" reverse tcp:8081 tcp:8081 2>/dev/null
  echo -e "  ${YELLOW}$ adb shell am start ... exp+prinparty://...localhost:8081${NC}"
  "$ADB" shell am start -a android.intent.action.VIEW \
    -d "$EXPO_DEEP_LINK" "$APP_BUNDLE" 2>/dev/null \
    && echo -e "${GREEN}  ✅ Android 앱 연결됨${NC}" \
    || echo -e "${YELLOW}  ⚠️  Android 앱 연결 실패 (앱이 설치되어 있는지 확인)${NC}"
) &

# ── STEP 6. Expo Metro 서버 시작 (포그라운드) ─────────────────────
step "Expo Metro 서버 시작"
cmd "npx expo start --localhost"
echo ""

# CI 모드 비활성화 (watch 모드 활성화)
unset CI
export CI=false

exec npx expo start --localhost
