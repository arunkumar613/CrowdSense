// src/components/LiveIndicator.js
// Pulsing dot + "Updated Xs ago" counter that syncs with the 5-second simulation tick

import React, { useEffect, useRef, useState, memo } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

const LiveIndicator = ({ label = 'Live' }) => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [secondsAgo, setSecondsAgo] = useState(0);

  // Pulse animation — loops independently
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.15, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  // Counter that counts 0→1→2→3→4→5 then resets, showing time since last update
  // The AppContext tick fires every 5 000 ms, so this stays visually in sync
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsAgo(prev => (prev >= 5 ? 0 : prev + 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const timeLabel = secondsAgo === 0 ? 'just now' : `${secondsAgo}s ago`;

  return (
    <View style={styles.row}>
      <Animated.View
        style={[styles.dot, { backgroundColor: colors.crowdLow, opacity: pulseAnim }]}
      />
      <Text style={[styles.label, { color: colors.textSecondary }]}>
        {label}
      </Text>
      <View style={[styles.timePill, { backgroundColor: colors.overlay, borderColor: colors.border }]}>
        <Text style={[styles.timeText, { color: colors.textSecondary }]}>
          Updated {timeLabel}
        </Text>
      </View>
    </View>
  );
};

export default memo(LiveIndicator);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.xs + 2,
    flexWrap: 'wrap',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  label: {
    fontSize: typography.tinySize + 1,
    fontWeight: typography.weights.medium,
  },
  timePill: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 20,
    borderWidth: 1,
  },
  timeText: {
    fontSize: typography.tinySize,
    fontWeight: typography.weights.medium,
  },
});

