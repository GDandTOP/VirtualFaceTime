import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { joinQueue, leaveQueue, listenForMatch, MatchData } from '../services/matchingService';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/colors';

interface Props {
  uid: string;
  // 최근 만난 유저 uid 목록 — 매칭 시 이 사람들은 제외됨 (선택적)
  recentContacts?: string[];
  onMatched: (matchData: MatchData) => void;
  onCancel: () => void;
}

export default function WaitingScreen({ uid, recentContacts = [], onMatched, onCancel }: Props) {
  const insets = useSafeAreaInsets();

  const pulseAnim1 = useRef(new Animated.Value(1)).current;
  const pulseAnim2 = useRef(new Animated.Value(1)).current;
  const pulseAnim3 = useRef(new Animated.Value(1)).current;
  const matchFoundRef = useRef(false);
  // 취소 버튼으로 이미 leaveQueue를 호출했는지 추적
  const cancelledRef = useRef(false);
  const [dots, setDots] = useState('');
  const [elapsed, setElapsed] = useState(0);

  // 진입 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // 대기열 입장
    joinQueue(uid, recentContacts).catch(console.error);

    // 매칭 리스닝
    const unsubscribe = listenForMatch(uid, (matchData) => {
      if (matchData && !matchFoundRef.current) {
        matchFoundRef.current = true;
        onMatched(matchData);
      }
    });

    return () => {
      unsubscribe();
      if (!matchFoundRef.current && !cancelledRef.current) {
        leaveQueue(uid).catch(console.error);
      }
    };
  }, [uid]);

  useEffect(() => {
    // 진입 애니메이션
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // 파동 애니메이션
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 2.8,
            duration: 2400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const pulse1 = createPulse(pulseAnim1, 0);
    const pulse2 = createPulse(pulseAnim2, 700);
    const pulse3 = createPulse(pulseAnim3, 1400);

    pulse1.start();
    pulse2.start();
    pulse3.start();

    // 로딩 점
    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    // 경과 시간
    const elapsedInterval = setInterval(() => {
      setElapsed(prev => prev + 1);
    }, 1000);

    return () => {
      pulse1.stop();
      pulse2.stop();
      pulse3.stop();
      clearInterval(dotInterval);
      clearInterval(elapsedInterval);
    };
  }, []);

  const handleCancel = async () => {
    cancelledRef.current = true;
    await leaveQueue(uid).catch(console.error);
    onCancel();
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return m > 0 ? `${m}분 ${s}초` : `${s}초`;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* 파동 애니메이션 */}
        <View style={styles.pulseContainer}>
          {[pulseAnim3, pulseAnim2, pulseAnim1].map((anim, i) => (
            <Animated.View
              key={i}
              style={[
                styles.pulseRing,
                {
                  transform: [{ scale: anim }],
                  opacity: anim.interpolate({
                    inputRange: [1, 2.8],
                    outputRange: [0.25, 0],
                  }),
                },
              ]}
            />
          ))}
          <View style={styles.centerIcon}>
            <Ionicons name="people-outline" size={30} color={Colors.white} />
          </View>
        </View>

        {/* 상태 카드 */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>
            상대방을 찾고 있어요{dots}
          </Text>
          <Text style={styles.statusSubtitle}>
            잠시만 기다려주세요, 곧 연결될 거예요
          </Text>
          <View style={styles.divider} />
          <View style={styles.elapsedRow}>
            <Text style={styles.elapsedLabel}>대기 시간</Text>
            <Text style={styles.elapsedValue}>{formatElapsed(elapsed)}</Text>
          </View>
        </View>

        {/* 팁 카드 */}
        <View style={styles.tipCard}>
          <Ionicons name="information-circle-outline" size={18} color={Colors.primary} />
          <Text style={styles.tipText}>
            매칭이 완료되면 자동으로 영상 통화가 시작돼요
          </Text>
        </View>
      </Animated.View>

      {/* 취소 버튼 */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>매칭 취소</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxl,
  },

  // ── 파동 ──
  pulseContainer: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xxxxl,
  },
  pulseRing: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primary,
  },
  centerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.primary,
  },

  // ── 상태 카드 ──
  statusCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xxl,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  statusTitle: {
    ...Typography.h3,
    color: Colors.text,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  statusSubtitle: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: Colors.divider,
    marginBottom: Spacing.lg,
  },
  elapsedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  elapsedLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
  },
  elapsedValue: {
    ...Typography.captionMedium,
    color: Colors.primary,
  },

  // ── 팁 카드 ──
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySubtle,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    width: '100%',
    gap: Spacing.sm,
  },
  tipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    flex: 1,
  },

  // ── 하단 취소 ──
  bottomSection: {
    paddingHorizontal: Spacing.xxl,
  },
  cancelButton: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  cancelText: {
    ...Typography.buttonSmall,
    color: Colors.textSecondary,
  },
});
