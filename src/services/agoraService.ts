import {
  createAgoraRtcEngine,
  IRtcEngine,
  ChannelProfileType,
  ClientRoleType,
  VideoSourceType,
  RenderModeType,
  FrameRate,
  OrientationMode,
} from 'react-native-agora';
import { Platform, PermissionsAndroid } from 'react-native';
import CryptoJS from 'crypto-js';

export const AGORA_APP_ID = process.env.EXPO_PUBLIC_AGORA_APP_ID ?? '';
const AGORA_APP_CERTIFICATE = process.env.EXPO_PUBLIC_AGORA_APP_CERTIFICATE ?? '';

// ─── Agora AccessToken v006 구현 (Node.js 없이 순수 JS) ──────────────────────
// 포맷: "006" + appId(32) + Base64(signature(len+bytes) + crc_channel(4) + crc_uid(4) + m(len+bytes))
// m = salt(4) + ts(4) + privileges_count(2) + [key(2) + expire(4)]...
// signature = HMAC-SHA256(key=appCertificate, data=appId+channelName+uid+m)

const PRIVILEGE_JOIN_CHANNEL = 1;

/** 순수 JS CRC32 구현 (Node.js 불필요) */
function crc32(str: string): number {
  let crc = -1;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i);
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) | 0;
}

/** DataView를 쓰는 바이트 빌더 (리틀엔디언) */
class ByteBuffer {
  private buf: number[] = [];

  putUint16(v: number): this {
    this.buf.push(v & 0xff, (v >> 8) & 0xff);
    return this;
  }

  putUint32(v: number): this {
    this.buf.push(
      (v >>> 0) & 0xff,
      (v >>> 8) & 0xff,
      (v >>> 16) & 0xff,
      (v >>> 24) & 0xff,
    );
    return this;
  }

  // 길이(uint16) + 바이트 배열
  putBytes(bytes: number[]): this {
    this.putUint16(bytes.length);
    this.buf.push(...bytes);
    return this;
  }

  // 길이(uint16) + UTF-8 문자열 바이트
  putString(str: string): this {
    const bytes = str.split('').map(c => c.charCodeAt(0));
    return this.putBytes(bytes);
  }

  toArray(): number[] {
    return [...this.buf];
  }
}

/** 바이트 배열 → CryptoJS WordArray */
function toWordArray(bytes: number[]): CryptoJS.lib.WordArray {
  const uint8 = new Uint8Array(bytes);
  const words: number[] = [];
  for (let i = 0; i < uint8.length; i += 4) {
    words.push(
      ((uint8[i] ?? 0) << 24) |
      ((uint8[i + 1] ?? 0) << 16) |
      ((uint8[i + 2] ?? 0) << 8) |
      (uint8[i + 3] ?? 0),
    );
  }
  return CryptoJS.lib.WordArray.create(words, uint8.length);
}

/** WordArray → 바이트 배열 */
function wordArrayToBytes(wa: CryptoJS.lib.WordArray): number[] {
  const bytes: number[] = [];
  const words = wa.words;
  const sigBytes = wa.sigBytes;
  for (let i = 0; i < sigBytes; i++) {
    bytes.push((words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff);
  }
  return bytes;
}

/** 바이트 배열 → Base64 문자열 */
function bytesToBase64(bytes: number[]): string {
  return CryptoJS.enc.Base64.stringify(toWordArray(bytes));
}

/**
 * Agora RTC 토큰 생성 (AccessToken v006, Node.js 불필요)
 * - Certificate 없으면 빈 문자열 반환
 * - 만료: 현재 시간 기준 24시간
 */
function buildToken(channelName: string, uid: number = 0): string {
  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) return '';

  const salt = Math.floor(Math.random() * 0xffffffff);
  const ts = Math.floor(Date.now() / 1000) + 24 * 3600; // 24시간 후
  const expireTs = Math.floor(Date.now() / 1000) + 3600; // 1시간 후
  const uidStr = uid === 0 ? '' : String(uid);

  // m = salt + ts + privileges 맵 { 1: expireTs }
  const m = new ByteBuffer()
    .putUint32(salt)
    .putUint32(ts)
    .putUint16(1)                       // 권한 항목 수
    .putUint16(PRIVILEGE_JOIN_CHANNEL)  // 권한 ID
    .putUint32(expireTs)                // 만료 시간
    .toArray();

  // 서명 데이터 = appId + channelName + uid + m (순수 바이트 연결)
  const toSign = [
    ...AGORA_APP_ID.split('').map((c: string) => c.charCodeAt(0)),
    ...channelName.split('').map((c: string) => c.charCodeAt(0)),
    ...uidStr.split('').map((c: string) => c.charCodeAt(0)),
    ...m,
  ];

  // HMAC-SHA256 서명 (key = appCertificate)
  const hmac = CryptoJS.HmacSHA256(toWordArray(toSign), AGORA_APP_CERTIFICATE);
  const signature = wordArrayToBytes(hmac);

  // CRC32 (부호 없는 32비트로 처리)
  const crcChannel = crc32(channelName) >>> 0;
  const crcUid = crc32(uidStr) >>> 0;

  // 최종 content = signature + crc_channel + crc_uid + m
  const content = new ByteBuffer()
    .putBytes(signature)
    .putUint32(crcChannel)
    .putUint32(crcUid)
    .putBytes(m)
    .toArray();

  return `006${AGORA_APP_ID}${bytesToBase64(content)}`;
}

let engine: IRtcEngine | null = null;

/**
 * Agora 엔진 초기화
 * 멱등 — 이미 초기화된 경우 기존 인스턴스 반환
 */
export function initAgora(): IRtcEngine {
  if (!AGORA_APP_ID) {
    throw new Error(
      '[Agora] EXPO_PUBLIC_AGORA_APP_ID 환경변수가 설정되지 않았습니다.\n' +
        '.env 파일에 EXPO_PUBLIC_AGORA_APP_ID=<your-app-id>를 추가하세요.'
    );
  }

  if (!engine) {
    engine = createAgoraRtcEngine();
    engine.initialize({
      appId: AGORA_APP_ID,
      channelProfile: ChannelProfileType.ChannelProfileCommunication,
    });
    engine.enableVideo();

    // 비디오 인코딩 품질 설정 (기본값이 너무 낮아 픽셀화 발생)
    engine.setVideoEncoderConfiguration({
      dimensions: { width: 640, height: 480 },   // 해상도 640×480
      frameRate: FrameRate.FrameRateFps15,          // 초당 15프레임
      bitrate: 0,                                  // 0 = Agora 표준 비트레이트 자동 설정
      orientationMode: OrientationMode.OrientationModeAdaptive, // 화면 방향 자동
    });
  }
  return engine;
}

/**
 * Agora 엔진 반환 (초기화된 경우)
 */
export function getEngine(): IRtcEngine | null {
  return engine;
}

/**
 * 카메라/마이크 권한 요청 (Android)
 */
export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    const grants = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.CAMERA,
      PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
    ]);
    return (
      grants[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted' &&
      grants[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted'
    );
  }
  // iOS는 Info.plist에서 권한 설정 (자동 처리)
  return true;
}

/**
 * Agora 채널 입장
 * @param channelName - Firebase에서 생성된 채널명
 * @param uid - 숫자형 uid (0이면 자동 할당)
 */
export async function joinChannel(
  channelName: string,
  uid: number = 0
): Promise<void> {
  const rtcEngine = initAgora();
  await requestPermissions();

  // Certificate가 있으면 토큰 생성, 없으면 빈 문자열(테스트 모드)
  const token = buildToken(channelName, uid);

  rtcEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
  rtcEngine.joinChannel(token, channelName, uid, {
    clientRoleType: ClientRoleType.ClientRoleBroadcaster,
  });
}

/**
 * Agora 채널 퇴장
 */
export function leaveChannel(): void {
  if (engine) {
    engine.leaveChannel();
  }
}

/**
 * Agora 엔진 해제 (앱 종료 시 사용)
 */
export function destroyEngine(): void {
  if (engine) {
    engine.release();
    engine = null;
  }
}

/**
 * 마이크 on/off
 */
export function toggleMicrophone(muted: boolean): void {
  if (engine) {
    engine.muteLocalAudioStream(muted);
  }
}

/**
 * 카메라 on/off
 */
export function toggleCamera(disabled: boolean): void {
  if (engine) {
    engine.muteLocalVideoStream(disabled);
  }
}
