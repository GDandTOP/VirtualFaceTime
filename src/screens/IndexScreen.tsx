import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Typography, Spacing, Radius, Shadows } from '../constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  onStart: (uid: string) => void;
}

export default function IndexScreen({ onStart }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  // 버튼 터치 애니메이션
  const scaleAnim = useRef(new Animated.Value(1)).current;
  // 진입 애니메이션
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  // 카드 등장 애니메이션
  const cardFade1 = useRef(new Animated.Value(0)).current;
  const cardFade2 = useRef(new Animated.Value(0)).current;
  const cardFade3 = useRef(new Animated.Value(0)).current;
  const cardSlide1 = useRef(new Animated.Value(20)).current;
  const cardSlide2 = useRef(new Animated.Value(20)).current;
  const cardSlide3 = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // 메인 콘텐츠 페이드인 + 슬라이드업
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    // 카드 순차 등장 (stagger)
    const staggerCards = Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(cardFade1, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardSlide1, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade2, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardSlide2, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(cardFade3, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(cardSlide3, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
    ]);

    // 메인 애니메이션 300ms 후에 카드 등장 시작
    setTimeout(() => staggerCards.start(), 300);
  }, []);

  const handleStart = async () => {
    setLoading(true);
    try {
      const userCredential = await signInAnonymously(auth);
      const uid = userCredential.user.uid;
      onStart(uid);
    } catch (error) {
      console.error('익명 로그인 실패:', error);
      setLoading(false);
    }
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  const features: { icon: keyof typeof Ionicons.glyphMap; title: string; desc: string }[] = [
    { icon: 'shuffle-outline', title: '랜덤 매칭', desc: '새로운 사람과 바로 연결' },
    { icon: 'videocam-outline', title: '영상 통화', desc: '실시간 화상 대화' },
    { icon: 'shield-checkmark-outline', title: '익명 보장', desc: '개인정보 걱정 없이' },
  ];

  const cardAnims = [
    { fade: cardFade1, slide: cardSlide1 },
    { fade: cardFade2, slide: cardSlide2 },
    { fade: cardFade3, slide: cardSlide3 },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* 상단 배경 장식 */}
      <View style={styles.heroBg}>
        <View style={styles.heroBgInner} />
      </View>

      {/* 히어로 영역 */}
      <Animated.View
        style={[
          styles.heroSection,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.logoIcon}>
          <Ionicons name="sparkles" size={34} color={Colors.primary} />
        </View>
        <Text style={styles.appName}>PrinParty</Text>
        <Text style={styles.tagline}>새로운 사람과{'\n'}지금 바로 연결되세요</Text>
      </Animated.View>

      {/* 기능 소개 카드 */}
      <View style={styles.featuresRow}>
        {features.map((feature, index) => (
          <Animated.View
            key={feature.title}
            style={[
              styles.featureCard,
              {
                opacity: cardAnims[index].fade,
                transform: [{ translateY: cardAnims[index].slide }],
              },
            ]}
          >
            <View style={styles.featureIconWrap}>
              <Ionicons name={feature.icon} size={22} color={Colors.primary} />
            </View>
            <Text style={styles.featureTitle}>{feature.title}</Text>
            <Text style={styles.featureDesc}>{feature.desc}</Text>
          </Animated.View>
        ))}
      </View>

      {/* 하단 CTA 영역 */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + Spacing.xl }]}>
        <Animated.View style={{ transform: [{ scale: scaleAnim }], width: '100%' }}>
          <TouchableOpacity
            style={[styles.startButton, loading && styles.startButtonDisabled]}
            onPress={handleStart}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={loading}
            activeOpacity={1}
          >
            {loading ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Text style={styles.startButtonText}>매칭 시작하기</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
        <Text style={styles.disclaimer}>
          버튼을 누르면 랜덤으로 상대방과 매칭됩니다
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // ── 배경 장식 ──
  heroBg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 320,
    overflow: 'hidden',
  },
  heroBgInner: {
    flex: 1,
    backgroundColor: Colors.primarySubtle,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  // ── 히어로 영역 ──
  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.xxxxl,
    paddingHorizontal: Spacing.xxxl,
    marginBottom: Spacing.xxxl,
  },
  logoIcon: {
    width: 80,
    height: 80,
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  appName: {
    ...Typography.h1,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  tagline: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // ── 기능 카드 ──
  featuresRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    gap: Spacing.md,
    marginBottom: Spacing.xxxl,
  },
  featureCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    ...Shadows.md,
  },
  featureIconWrap: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  featureTitle: {
    ...Typography.captionMedium,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  featureDesc: {
    ...Typography.small,
    color: Colors.textTertiary,
    textAlign: 'center',
  },

  // ── 하단 CTA ──
  bottomSection: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  startButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    width: '100%',
    ...Shadows.primary,
  },
  startButtonDisabled: {
    backgroundColor: Colors.primaryDark,
  },
  startButtonText: {
    ...Typography.button,
    color: Colors.textOnPrimary,
  },
  disclaimer: {
    ...Typography.caption,
    color: Colors.textTertiary,
    textAlign: 'center',
    marginTop: Spacing.md,
  },
});
