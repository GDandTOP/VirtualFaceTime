#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# PrinParty iOS 페어 테스트 서버 시작 스크립트
# 실행: npm run start:ios-pair
#
# 일반 start.sh와 차이점:
#   - --lan 모드 사용 → Mac 로컬 IP로 실기기(아이폰)도 접속 가능
#   - USB 연결된 아이폰 자동 감지 및 앱 실행 시도
#   - 시뮬레이터 + 실기기를 동시에 연결해 1:1 영상통화 테스트 가능
#
# 사전 조건:
#   - 실기기와 Mac이 같은 Wi-Fi에 연결되어 있어야 함 (Wi-Fi 방식)
#   - 또는 USB 케이블로 Mac에 직접 연결 (USB 방식, 더 안정적)
#   - 실기기에 Expo Development Build(PrinParty 앱)가 설치되어 있어야 함
# ─────────────────────────────────────────────────────────────────────────────

# ── 설정 ──────────────────────────────────────────────────────────────────────
IOS_SIM_ID="93664DA0-283F-46CD-9B3A-7C2B130539BA"   # iPhone 16e (기본값)
APP_BUNDLE="com.younguk.prinparty"                   # 앱 번들 ID
EXPO_URL_SCHEME="exp+prinparty"                      # Expo 딥링크 스킴

# ── 색상 출력 ─────────────────────────────────────────────────────────────────
# 터미널에서 색깔 있는 글자를 출력하기 위한 코드들
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'  # No Color (색상 초기화)

log()  { echo -e "${GREEN}  ✅ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠️  $1${NC}"; }
err()  { echo -e "${RED}  ❌ $1${NC}"; }
step() { echo -e "\n${CYAN}${BOLD}▶ $1${NC}"; }
info() { echo -e "  ${CYAN}ℹ️  $1${NC}"; }
cmd()  { echo -e "  ${YELLOW}$ $1${NC}"; }

echo -e "${CYAN}${BOLD}"
echo "╔══════════════════════════════════════════════╗"
echo "║   PrinParty 시뮬레이터 + 실기기 페어 테스트  ║"
echo "║   (영상통화 2인 동시 테스트용)                ║"
echo "╚══════════════════════════════════════════════╝"
echo -e "${NC}"

# ── STEP 1. 기존 서버 종료 ────────────────────────────────────────────────────
# 이미 8081 포트에서 뭔가 실행 중이면 먼저 종료해야 새로 시작할 수 있음
step "기존 Metro 서버 정리"
cmd "lsof -ti:8081 | xargs kill -9"
lsof -ti:8081 | xargs kill -9 2>/dev/null \
  && log "포트 8081 종료됨" \
  || log "포트 8081 비어있음 (정상)"

# ── STEP 2. Mac의 로컬 IP 확인 ────────────────────────────────────────────────
# --lan 모드에서는 Mac의 실제 IP 주소로 Metro 서버에 접속함
# 실기기가 같은 Wi-Fi에 있어야 이 IP로 접근 가능
step "Mac 로컬 IP 주소 확인"
cmd "ipconfig getifaddr en0"

# Wi-Fi(en0) → 유선(en1) 순서로 IP 확인
LAN_IP=$(ipconfig getifaddr en0 2>/dev/null)
if [ -z "$LAN_IP" ]; then
  warn "en0(Wi-Fi)에 IP 없음. en1(유선) 확인 중..."
  LAN_IP=$(ipconfig getifaddr en1 2>/dev/null)
fi
if [ -z "$LAN_IP" ]; then
  err "로컬 IP를 찾을 수 없습니다."
  err "Mac이 Wi-Fi 또는 유선 네트워크에 연결되어 있는지 확인하세요."
  exit 1
fi

log "Mac 로컬 IP: ${BOLD}$LAN_IP${NC}"
warn "실기기도 같은 Wi-Fi 네트워크에 연결되어 있어야 합니다!"

# URL 인코딩: http://192.168.x.x:8081 → http%3A%2F%2F192.168.x.x%3A8081
# (딥링크 URL 파라미터에 넣으려면 특수문자를 %XX 형식으로 변환해야 함)
LAN_IP_ENCODED=$(python3 -c \
  "import urllib.parse; print(urllib.parse.quote('http://${LAN_IP}:8081'))" \
  2>/dev/null || echo "http%3A%2F%2F${LAN_IP}%3A8081")

# 시뮬레이터 & 실기기 공통으로 사용할 딥링크 (LAN IP 사용)
EXPO_DEEP_LINK="${EXPO_URL_SCHEME}://expo-development-client/?url=${LAN_IP_ENCODED}"

info "딥링크: ${EXPO_URL_SCHEME}://...?url=http://${LAN_IP}:8081"

# ── STEP 3. iOS 시뮬레이터 확인 & 시작 ──────────────────────────────────────
step "iOS 시뮬레이터 확인"
cmd "xcrun simctl list devices | grep Booted"

# 현재 켜져 있는(Booted) 시뮬레이터 찾기
BOOTED_IOS=$(xcrun simctl list devices 2>/dev/null \
  | grep "Booted" \
  | grep -oE "[0-9A-F-]{36}" \
  | head -1)

if [ -n "$BOOTED_IOS" ]; then
  # 이미 켜져있으면 그대로 사용
  IOS_SIM_ID="$BOOTED_IOS"
  log "iOS 시뮬레이터 이미 실행 중 (ID: $IOS_SIM_ID)"
else
  # 꺼져있으면 기본값(iPhone 16e) 부팅
  warn "부팅된 시뮬레이터 없음 → iPhone 16e 시작 중..."
  cmd "xcrun simctl boot $IOS_SIM_ID && open -a Simulator"
  xcrun simctl boot "$IOS_SIM_ID" 2>/dev/null || true
  open -a Simulator   # Simulator.app 창 띄우기
  sleep 5
  log "iOS 시뮬레이터 시작됨"
fi

# 시뮬레이터에 앱이 설치되어 있는지 확인
IOS_INSTALLED=$(xcrun simctl listapps "$IOS_SIM_ID" 2>/dev/null \
  | grep "$APP_BUNDLE" | wc -l | tr -d ' ')
if [ "$IOS_INSTALLED" = "0" ]; then
  warn "시뮬레이터에 앱이 설치되어 있지 않습니다!"
  warn "먼저 아래 명령어로 빌드하세요: npx expo run:ios"
fi

# ── STEP 4. USB 연결된 아이폰 실기기 감지 ────────────────────────────────────
step "USB 연결된 아이폰 실기기 감지"
cmd "xcrun xctrace list devices (실기기만 필터링)"

DEVICE_CONNECTED=false
REAL_DEVICE_UDID=""
REAL_DEVICE_NAME=""

# xcrun xctrace로 연결된 기기 목록 가져오기 (Xcode 12 이상)
#
# 출력 예시:
#   == Devices ==
#   김영욱의 MacBook Pro (61622A1E-2547-505D-AFD8-32EFBE47557B)   ← Mac (제외)
#   Ruby lover❤️ (26.3) - Connecting (00008150-001151E436A1401C) ← 실기기 ✅
#
#   == Simulators ==
#   iPhone 16e Simulator (26.2) (93664DA0-283F-46CD-9B3A-7C2B130539BA) ← 시뮬레이터 (제외)
#
# 실기기 UDID 형식: XXXXXXXX-XXXXXXXXXXXXXXXX (8자리-16자리 hex) ← 핵심 구분 포인트!
# 시뮬레이터/Mac UUID 형식: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX (표준 UUID, 5개 그룹)
# → 두 형식의 차이로 실기기만 정확하게 추출 가능

# "== Simulators ==" 이후는 무시, Mac 라인도 제외
DEVICES_SECTION=$(xcrun xctrace list devices 2>/dev/null \
  | awk '/== Simulators ==/{ exit } { print }' \
  | grep -v "^==" \
  | grep -v "^$" \
  | grep -v "MacBook\|Mac Pro\|Mac mini\|Mac Studio\|iMac\|macOS")

if [ -n "$DEVICES_SECTION" ]; then
  # 실기기 UDID만 추출: 8자리hex-16자리hex 형식 (XXXXXXXX-XXXXXXXXXXXXXXXX)
  # 표준 UUID(XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX)와 다른 점으로 실기기 구분
  REAL_DEVICE_UDID=$(echo "$DEVICES_SECTION" \
    | grep -oE "[0-9A-Fa-f]{8}-[0-9A-Fa-f]{16}" \
    | head -1)

  # 장치 이름 추출: UDID 포함 줄에서 괄호 제거
  if [ -n "$REAL_DEVICE_UDID" ]; then
    REAL_DEVICE_NAME=$(echo "$DEVICES_SECTION" \
      | grep "$REAL_DEVICE_UDID" \
      | sed 's/ - Connecting//g; s/ - Connected//g; s/ ([^)]*)//g' \
      | xargs)
    log "실기기 감지됨: ${BOLD}$REAL_DEVICE_NAME${NC}"
    log "UDID: $REAL_DEVICE_UDID"
    DEVICE_CONNECTED=true
  fi
fi

if [ "$DEVICE_CONNECTED" = "false" ]; then
  warn "USB로 연결된 아이폰이 없습니다."
  echo ""
  echo -e "  ${CYAN}📱 실기기 연결 방법 2가지:${NC}"
  echo ""
  echo -e "  ${BOLD}방법 1) USB 연결 (권장)${NC}"
  echo -e "  • 아이폰을 USB 케이블로 Mac에 연결"
  echo -e "  • 아이폰에서 '신뢰' 버튼 누르기"
  echo -e "  • 이 스크립트를 다시 실행"
  echo ""
  echo -e "  ${BOLD}방법 2) Wi-Fi 연결 (같은 네트워크 필요)${NC}"
  echo -e "  • 아이폰과 Mac이 같은 Wi-Fi에 연결된 상태에서"
  echo -e "  • 아이폰의 PrinParty 앱(Expo Dev Client) 실행"
  echo -e "  • 하단 'Enter URL manually' 탭 → 아래 URL 입력:"
  echo -e "  ${GREEN}  http://${LAN_IP}:8081${NC}"
  echo ""
fi

# ── STEP 5. Metro 준비 후 앱 자동 연결 (백그라운드 실행) ─────────────────────
# 이 블록은 백그라운드(&)로 실행되어, Metro 서버가 켜질 때까지 기다렸다가
# 시뮬레이터와 실기기에 앱을 자동으로 연결함
(
  # Metro 서버 포트(8081)가 열릴 때까지 대기
  printf "\n  ⏳ Metro 서버(LAN 모드) 준비 대기 중"
  until lsof -i:8081 -sTCP:LISTEN > /dev/null 2>&1; do
    sleep 1; printf "."
  done
  sleep 3  # 안정화를 위해 3초 추가 대기
  echo -e "\n"

  # ── 시뮬레이터 앱 연결 ──────────────────────────────────────────────────────
  # xcrun simctl openurl: 시뮬레이터에서 특정 URL을 여는 명령어
  # 딥링크를 열면 Expo Dev Client가 해당 Metro 서버에 자동으로 접속함
  echo -e "  ${CYAN}${BOLD}[1/2] 시뮬레이터 연결 중...${NC}"
  cmd "xcrun simctl openurl $IOS_SIM_ID \"${EXPO_URL_SCHEME}://...${LAN_IP}:8081\""
  xcrun simctl openurl "$IOS_SIM_ID" "$EXPO_DEEP_LINK" 2>/dev/null \
    && log "iOS 시뮬레이터 앱 연결됨!" \
    || warn "시뮬레이터 앱 연결 실패 (앱 설치 여부 확인: npx expo run:ios)"

  # ── 실기기 앱 연결 (USB 연결된 경우) ─────────────────────────────────────────
  if [ "$DEVICE_CONNECTED" = "true" ] && [ -n "$REAL_DEVICE_UDID" ]; then
    echo ""
    echo -e "  ${CYAN}${BOLD}[2/2] 실기기($REAL_DEVICE_NAME) 연결 중...${NC}"

    # xcrun devicectl: Xcode 15 이상에서 실기기를 제어하는 명령어
    # process launch: 앱을 실행시킴 (--terminate-existing-process: 이미 실행 중이면 종료 후 재시작)
    cmd "xcrun devicectl device process launch --device $REAL_DEVICE_UDID $APP_BUNDLE"
    xcrun devicectl device process launch \
      --device "$REAL_DEVICE_UDID" \
      --terminate-existing-process \
      "$APP_BUNDLE" 2>/dev/null \
      && log "실기기 앱 실행됨!" \
      || warn "실기기 앱 자동 실행 실패 → 수동으로 앱을 실행한 뒤 아래 URL 입력:"

    echo ""
    echo -e "  ${YELLOW}실기기에서 Metro 연결이 안 되면 앱 내에서 직접 입력:${NC}"
    echo -e "  ${GREEN}${BOLD}  http://${LAN_IP}:8081${NC}"
  fi

  # ── 연결 완료 요약 ───────────────────────────────────────────────────────────
  echo ""
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════════${NC}"
  echo -e "${CYAN}${BOLD}  📊 연결 현황 요약${NC}"
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════════${NC}"
  echo -e "  ${GREEN}🖥  시뮬레이터:  자동 연결 시도 완료${NC}"
  if [ "$DEVICE_CONNECTED" = "true" ]; then
    echo -e "  ${GREEN}📱  실기기($REAL_DEVICE_NAME): 자동 연결 시도 완료${NC}"
  else
    echo -e "  ${YELLOW}📱  실기기: 수동 연결 필요 (Wi-Fi)${NC}"
  fi
  echo ""
  echo -e "  ${CYAN}Metro 서버 주소:${NC}"
  echo -e "  ${GREEN}${BOLD}  http://${LAN_IP}:8081${NC}"
  echo ""
  echo -e "  ${CYAN}💡 영상통화 테스트 방법:${NC}"
  echo -e "  • 시뮬레이터에서 PrinParty 앱 실행 → '시작' 버튼 클릭"
  echo -e "  • 실기기에서 PrinParty 앱 실행 → '시작' 버튼 클릭"
  echo -e "  • 두 기기가 매칭되면 영상통화 시작!"
  echo -e "${CYAN}${BOLD}══════════════════════════════════════════════${NC}"
  echo ""
) &

# ── STEP 6. Expo Metro 서버 시작 (LAN 모드 - 포그라운드) ─────────────────────
# --lan 모드: Mac의 로컬 IP(예: 192.168.x.x)로 Metro 서버를 공개함
# --localhost와 달리 같은 네트워크의 실기기도 접속 가능
step "Expo Metro 서버 시작 (LAN 모드)"
cmd "npx expo start --lan"
echo ""
info "--lan 모드: 실기기도 http://${LAN_IP}:8081 로 접속 가능"
info "터미널에서 'i' 키: 시뮬레이터 앱 열기 / 's' 키: QR코드 표시"
echo ""

unset CI
export CI=false

# exec: 이 스크립트 프로세스를 Expo 프로세스로 교체 (별도 자식 프로세스 생성 없음)
exec npx expo start --lan
