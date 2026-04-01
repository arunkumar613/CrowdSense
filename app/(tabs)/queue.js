import React, { useContext, useEffect, useRef, useState, memo } from 'react';
import { View, Text, ScrollView, StyleSheet, LayoutAnimation, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../src/context/AppContext';
import { useTheme } from '../../src/hooks/useTheme';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

import EmptyState from '../../src/components/EmptyState';
import QueueCard from '../../src/components/QueueCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import ScreenHeader from '../../src/components/ScreenHeader';

// ─── Toast that slides down and auto-dismisses ────────────────────────────────
const PositionToast = memo(({ message, colors }) => {
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: 0,   useNativeDriver: true, speed: 14, bounciness: 6 }),
      Animated.timing(opacityAnim, { toValue: 1,   duration: 220, useNativeDriver: true }),
    ]).start();

    // Auto-dismiss after 3 seconds
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim,   { toValue: -80, duration: 300, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0,   duration: 300, useNativeDriver: true }),
      ]).start();
    }, 3000);

    return () => clearTimeout(timer);
  }, [message]); // Re-fires every time the message (position) changes

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colors.crowdLow,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Ionicons name="arrow-up-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function QueueTab() {
  const { activeQueue, leaveQueue } = useContext(AppContext);
  const { colors } = useTheme();

  // Track the previous position to detect advancement
  const prevPositionRef = useRef(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [toastKey, setToastKey]         = useState(0); // Forces remount on each change

  useEffect(() => {
    if (!activeQueue) {
      prevPositionRef.current = null;
      return;
    }

    const prev = prevPositionRef.current;
    const curr = activeQueue.position;

    if (prev !== null && curr < prev) {
      // User moved forward in the queue
      const moved = prev - curr;
      const msg =
        curr === 1
          ? '🎉 You are next! Head to the entrance now.'
          : `✅ You moved up ${moved} spot${moved > 1 ? 's' : ''}! Now at position #${curr}.`;

      setToastMessage(msg);
      setToastKey(k => k + 1); // Force the toast to remount & re-animate

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }

    prevPositionRef.current = curr;
  }, [activeQueue?.position]);

  // Also animate card on wait-time change
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [activeQueue?.estWaitMinutes]);

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>

      {/* Position advancement toast — absolutely positioned at top */}
      {toastMessage && (
        <PositionToast key={toastKey} message={toastMessage} colors={colors} />
      )}

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          title="Virtual Queue"
          subtitle="Real-time position tracking"
        />

        {!activeQueue ? (
          <EmptyState
            iconName="people-circle-outline"
            title="No Active Queue"
            message="You are not currently waiting in any virtual queues. Browse nearby locations to join one."
          />
        ) : (
          <View style={styles.cardContainer}>
            <QueueCard queue={activeQueue} />
            <PrimaryButton
              title="Leave Queue"
              variant="danger"
              onPress={leaveQueue}
              style={styles.leaveBtn}
              icon="trash-bin-outline"
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:    { flex: 1, position: 'relative' },
  container:  { flex: 1 },
  content:    { paddingBottom: spacing.xxl },
  cardContainer: { paddingHorizontal: spacing.m, paddingTop: spacing.m },
  leaveBtn:   { marginTop: spacing.s },

  // Toast
  toast: {
    position: 'absolute',
    top: 0,
    left: spacing.m,
    right: spacing.m,
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s + 2,
    borderRadius: spacing.borderRadius,
    // Subtle shadow so it lifts above card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
  },
  toastText: {
    color: '#fff',
    fontSize: typography.bodySize - 1,
    fontWeight: typography.weights.bold,
    flex: 1,
  },
});
