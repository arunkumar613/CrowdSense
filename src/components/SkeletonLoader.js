// src/components/SkeletonLoader.js
// Realistic card-shaped skeleton with pulsing shimmer animation

import React, { useEffect, useRef, memo } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';

// ─── Single skeleton card that mimics a real LocationCard ─────────────────────
const SkeletonCard = memo(({ pulseAnim, colors }) => (
  <Animated.View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: pulseAnim }]}>
    {/* Top row: icon + title lines */}
    <View style={styles.topRow}>
      <View style={[styles.iconBlock, { backgroundColor: colors.border }]} />
      <View style={styles.titleStack}>
        <View style={[styles.lineWide,   { backgroundColor: colors.border }]} />
        <View style={[styles.lineNarrow, { backgroundColor: colors.border }]} />
      </View>
      <View style={[styles.chevron, { backgroundColor: colors.border }]} />
    </View>

    {/* Bottom row: crowd badge + wait badge */}
    <View style={styles.bottomRow}>
      <View style={[styles.badgeSmall, { backgroundColor: colors.border }]} />
      <View style={[styles.badgeMini,  { backgroundColor: colors.border }]} />
    </View>

    {/* Progress bar */}
    <View style={[styles.progressBar, { backgroundColor: colors.border }]} />
  </Animated.View>
));

// ─── Search bar skeleton (used at top of explore) ─────────────────────────────
const SkeletonSearchBar = memo(({ pulseAnim, colors }) => (
  <Animated.View style={[styles.searchBarSkeleton, { backgroundColor: colors.border, opacity: pulseAnim }]} />
));

// ─── Chip row skeleton ────────────────────────────────────────────────────────
const SkeletonChips = memo(({ pulseAnim, colors }) => (
  <View style={styles.chipRow}>
    {[60, 80, 70, 90, 65].map((w, i) => (
      <Animated.View
        key={i}
        style={[styles.chip, { width: w, backgroundColor: colors.border, opacity: pulseAnim }]}
      />
    ))}
  </View>
));

// ─── Main export: accepts variant prop for flexibility ────────────────────────
// variant: 'home' | 'explore'
const SkeletonLoader = ({ variant = 'home', cardCount = 4 }) => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {variant === 'explore' && (
        <>
          <SkeletonSearchBar pulseAnim={pulseAnim} colors={colors} />
          <SkeletonChips    pulseAnim={pulseAnim} colors={colors} />
          {/* Map block skeleton */}
          <Animated.View style={[styles.mapSkeleton, { backgroundColor: colors.border, opacity: pulseAnim }]} />
        </>
      )}
      {Array.from({ length: cardCount }).map((_, i) => (
        <SkeletonCard key={i} pulseAnim={pulseAnim} colors={colors} />
      ))}
    </View>
  );
};

export default memo(SkeletonLoader);

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.m },

  // Card skeleton
  card: {
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  iconBlock: {
    width: 44, height: 44,
    borderRadius: spacing.borderRadiusSmall,
    marginRight: spacing.s + 4,
  },
  titleStack: { flex: 1, gap: 8 },
  lineWide:   { height: 14, borderRadius: 7, width: '75%' },
  lineNarrow: { height: 11, borderRadius: 5.5, width: '50%' },
  chevron:    { width: 20, height: 20, borderRadius: 4 },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s + 4,
  },
  badgeSmall: { height: 16, width: '40%', borderRadius: 8 },
  badgeMini:  { height: 24, width: '28%', borderRadius: 8 },

  progressBar: { height: 6, borderRadius: 3, width: '100%' },

  // Explore extras
  searchBarSkeleton: {
    height: 50,
    borderRadius: spacing.borderRadiusSmall + 4,
    marginBottom: spacing.m,
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.s,
    marginBottom: spacing.m,
  },
  chip: {
    height: 34,
    borderRadius: 17,
  },
  mapSkeleton: {
    height: 170,
    borderRadius: spacing.borderRadius,
    marginBottom: spacing.l,
  },
});
