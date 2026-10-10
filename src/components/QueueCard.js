// src/components/QueueCard.js

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const QueueCard = ({ queue }) => {
  const { colors } = useTheme();

  if (!queue) return null;

  // Derive simple bar logic locally instead of complex context computation
  const baseFill = ((queue.totalInQueue - queue.position) / queue.totalInQueue) * 100;
  const fillPercentage = queue.position === 1 ? 100 : Math.min(95, Math.max(5, baseFill));
  
  // Decide wait color status
  const waitColor = queue.estWaitMinutes > 30 
      ? colors.crowdHigh 
      : queue.estWaitMinutes > 15 
          ? colors.crowdMedium 
          : colors.crowdLow;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, ...colors.shadow }]}>
      <View style={styles.header}>
        <Text style={[styles.locationName, { color: colors.text }]}>{queue.locationName}</Text>
        {queue.isPriority ? (
            <View style={[styles.priorityBadge, { backgroundColor: colors.crowdMedium }]}>
              <Ionicons name="star" size={12} color={colors.white} />
              <Text style={[styles.priorityText, { color: colors.white }]}>Priority Active</Text>
            </View>
        ) : null}
      </View>

      <View style={[styles.statsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Your Position</Text>
          <Text style={[styles.statValue, { color: colors.primary }]}>#{queue.position}</Text>
          <Text style={[styles.statSub, { color: colors.textSecondary }]}>of {queue.totalInQueue}</Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.statBox}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Est. Wait</Text>
          <Text style={[styles.statValue, { color: waitColor }]}>{queue.estWaitMinutes}m</Text>
          <Text style={[styles.statSub, { color: colors.textSecondary }]}>Joined {queue.joinedAt}</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
              <Text style={[styles.pLabelSm, { color: colors.textSecondary }]}>Joined</Text>
              <Text style={[styles.pLabelSm, { color: colors.textSecondary }]}>Your Turn</Text>
          </View>
          <View style={[styles.progressBarBg, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={[styles.progressBarFill, { width: `${fillPercentage}%`, backgroundColor: colors.primary }]} />
          </View>
          <Text style={[styles.progressText, { color: colors.primary }]}>
            {queue.position === 1 ? 'You are next in line! Proceed to entrance.' : 'The line is moving...'}
          </Text>
      </View>
    </View>
  );
};

export default memo(QueueCard);

const styles = StyleSheet.create({
  card: {
    borderRadius: spacing.l,
    padding: spacing.l,
    marginBottom: spacing.l,
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.l,
  },
  locationName: {
    fontSize: typography.headerSize - 4,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.s,
    textAlign: 'center',
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusPill,
  },
  priorityText: {
    fontWeight: typography.weights.bold,
    fontSize: typography.smallSize,
    marginLeft: 6,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: spacing.borderRadius,
    padding: spacing.l,
    marginBottom: spacing.xl,
    borderWidth: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    marginHorizontal: spacing.m,
  },
  statLabel: {
    fontSize: typography.bodySize,
    marginBottom: spacing.xs + 4,
    fontWeight: typography.weights.medium,
  },
  statValue: {
    fontSize: 42,
    fontWeight: typography.weights.heavy,
    marginBottom: 4,
  },
  statSub: {
    fontSize: typography.smallSize,
    fontWeight: typography.weights.medium,
  },
  progressSection: {
    marginBottom: spacing.s,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.s,
  },
  pLabelSm: {
    fontSize: typography.smallSize,
    fontWeight: typography.weights.semiBold,
  },
  progressBarBg: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.s + 4,
    borderWidth: 1,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: typography.bodySize,
    textAlign: 'center',
    fontWeight: typography.weights.bold,
  }
});
