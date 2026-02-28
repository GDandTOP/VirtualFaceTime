import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  ViewStyle,
  Animated,
} from 'react-native';
import {
  RtcSurfaceView,
  RtcTextureView,
  VideoSourceType,
  RenderModeType,
  IRtcEngineEventHandler,
} from 'react-native-agora';
import {
  initAgora,
  getEngine,
  joinChannel,
  leaveChannel,
  toggleMicrophone,
  toggleCamera,
} from '../services/agoraService';
import { removeMatch, MatchData } from '../services/matchingService';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/colors';

interface Props {
  uid: string;
  matchData: MatchData;
  onCallEnd: (partnerUid: string) => void;
}

interface VideoViewProps {
  uid: number;
  sourceType: VideoSourceType;
  style: ViewStyle | ViewStyle[];
}

/**
 * Android에서 RtcSurfaceView는 Z-order 문제로 검은 화면이 발생함
 * → Android는 RtcTextureView, iOS는 RtcSurfaceView 사용
 */
function AgoraVideoView({ uid, sourceType, style }: VideoViewProps) {
  const canvas = {
    uid,
    sourceType,
    renderMode: RenderModeType.RenderModeHidden,
  };

  if (Platform.OS === 'android') {
    return <RtcTextureView style={style} canvas={canvas} />;
  }
  return <RtcSurfaceView style={style} canvas={canvas} />;
}

export default function VideoCallScreen({ uid, matchData, onCallEnd }: Props) {
  const [remoteUid, setRemoteUid] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventHandlerRef = useRef<IRtcEngineEventHandler | null>(null);
  const callEndedRef = useRef(false);

  // 진입 애니메이션
  const controlFade = useRef(new Animated.Value(0)).current;
  const topBarFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    startCall();
    timerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);

    // UI 등장 애니메이션 (약간의 딜레이 후)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(controlFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(topBarFade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }, 300);

    return () => {
      cleanupCall();
    };
  }, []);

  const startCall = async () => {
    const engine = initAgora();

    const eventHandler: IRtcEngineEventHandler = {
      onUserJoined: (_connection, remoteUidNum) => {
        setRemoteUid(remoteUidNum);
      },
      onUserOffline: (_connection, _remoteUidNum) => {
        setRemoteUid(null);
        endCall();
      },
      onError: (err) => {
        console.error('Agora 에러:', err);
      },
    };

    eventHandlerRef.current = eventHandler;
    engine.registerEventHandler(eventHandler);
    await joinChannel(matchData.channelName, 0);
  };

  const cleanupCall = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    leaveChannel();
    const engine = getEngine();
    if (engine && eventHandlerRef.current) {
      engine.unregisterEventHandler(eventHandlerRef.current);
      eventHandlerRef.current = null;
    }
  };

  const endCall = () => {
    if (callEndedRef.current) return;
    callEndedRef.current = true;

    const partnerUid = matchData.user1 === uid ? matchData.user2 : matchData.user1;

    cleanupCall();
    removeMatch(uid).catch(console.error);
    onCallEnd(partnerUid);
  };

  const handleToggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    toggleMicrophone(newMuted);
  };

  const handleToggleCamera = () => {
    const newDisabled = !isCameraOff;
    setIsCameraOff(newDisabled);
    toggleCamera(newDisabled);
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <View style={styles.container}>
      {/* 원격 영상 (전체화면) */}
      {remoteUid !== null ? (
        <AgoraVideoView
          style={styles.remoteVideo}
          uid={remoteUid}
          sourceType={VideoSourceType.VideoSourceRemote}
        />
      ) : (
        <View style={styles.waitingRemote}>
          <View style={styles.waitingIconWrap}>
            <Ionicons name="wifi-outline" size={36} color={Colors.white} />
          </View>
          <Text style={styles.waitingTitle}>연결 중</Text>
          <Text style={styles.waitingText}>상대방이 곧 나타나요...</Text>
        </View>
      )}

      {/* 로컬 영상 (PiP) */}
      <View style={styles.localVideoContainer}>
        <AgoraVideoView
          style={styles.localVideo}
          uid={0}
          sourceType={VideoSourceType.VideoSourceCamera}
        />
        {isCameraOff && (
          <View style={styles.cameraOffOverlay}>
            <Ionicons name="videocam-off" size={24} color="rgba(255,255,255,0.4)" />
            <Text style={styles.cameraOffLabel}>카메라 꺼짐</Text>
          </View>
        )}
      </View>

      {/* 상단 정보 바 */}
      <SafeAreaView style={styles.topBar}>
        <Animated.View style={[styles.topBarContent, { opacity: topBarFade }]}>
          <View style={styles.durationBadge}>
            <View style={styles.recordDot} />
            <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
          </View>
        </Animated.View>
      </SafeAreaView>

      {/* 하단 컨트롤 바 */}
      <SafeAreaView style={styles.controlBarSafeArea}>
        <Animated.View style={[styles.controlBar, { opacity: controlFade }]}>
          <TouchableOpacity
            style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
            onPress={handleToggleMute}
          >
            <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={22} color={Colors.white} />
            <Text style={styles.controlLabel}>{isMuted ? '음소거' : '마이크'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.endCallBtn}
            onPress={endCall}
          >
            <Ionicons
              name="call"
              size={28}
              color={Colors.white}
              style={{ transform: [{ rotate: '135deg' }] }}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
            onPress={handleToggleCamera}
          >
            <Ionicons name={isCameraOff ? 'videocam-off' : 'videocam'} size={22} color={Colors.white} />
            <Text style={styles.controlLabel}>{isCameraOff ? '꺼짐' : '카메라'}</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },

  // ── 원격 영상 ──
  remoteVideo: {
    ...StyleSheet.absoluteFillObject,
  },
  waitingRemote: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.darkBg,
  },
  waitingIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  waitingTitle: {
    ...Typography.h3,
    color: Colors.white,
    marginBottom: Spacing.xs,
  },
  waitingText: {
    ...Typography.caption,
    color: 'rgba(255,255,255,0.5)',
  },

  // ── 로컬 PiP ──
  localVideoContainer: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: 140,
    width: 110,
    height: 155,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    ...Shadows.xl,
  },
  localVideo: {
    width: '100%',
    height: '100%',
  },
  cameraOffOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.darkSurface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
  },
  cameraOffLabel: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.4)',
  },

  // ── 상단 바 ──
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Platform.OS === 'android' ? Spacing.xl : 0,
  },
  topBarContent: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  durationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkOverlay,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: Spacing.sm,
  },
  recordDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.danger,
  },
  durationText: {
    ...Typography.captionMedium,
    color: Colors.white,
  },

  // ── 하단 컨트롤 ──
  controlBarSafeArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xxxl,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.darkOverlay,
    borderRadius: Radius.xl,
    gap: Spacing.xxxl,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.glassLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: {
    backgroundColor: Colors.glassMedium,
  },
  controlLabel: {
    ...Typography.small,
    color: 'rgba(255,255,255,0.6)',
    marginTop: 2,
  },
  endCallBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.danger,
  },
});
