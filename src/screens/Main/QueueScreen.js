// src/screens/Main/QueueScreen.js
// Uses AppContext live queue — no dummy data

import React, { useContext, useEffect, useRef, useState, memo } from 'react';
import { View, Text, StyleSheet, ScrollView, Animated, LayoutAnimation } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppContext } from '../../context/AppContext';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import EmptyState    from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';

// ─── Animated position-advance toast ─────────────────────────────────────────
const PositionToast = memo(({ message, colors }) => {
  const slideAnim   = useRef(new Animated.Value(-72)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim,   { toValue: 0,   useNativeDriver: true, speed: 15, bounciness: 7 }),
      Animated.timing(opacityAnim, { toValue: 1,   duration: 200,         useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim,   { toValue: -72, duration: 280, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0,   duration: 280, useNativeDriver: true }),
      ]).start();
    }, 3200);
    return () => clearTimeout(t);
  }, [message]);

  return (
    <Animated.View style={[
      toast.box,
      { backgroundColor: colors.crowdLow, opacity: opacityAnim, transform: [{ translateY: slideAnim }] },
    ]}>
      <Ionicons name="arrow-up-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
      <Text style={toast.text}>{message}</Text>
    </Animated.View>
  );
});
const toast = StyleSheet.create({
  box: {
    position: 'absolute', top: 0, left: spacing.m, right: spacing.m, zIndex: 99,
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.m, paddingVertical: 12,
    borderRadius: spacing.borderRadius,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 8, elevation: 8,
  },
  text: { color: '#fff', fontSize: 14, fontWeight: '700', flex: 1 },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function QueueScreen() {
  const router = useRouter();
  const { activeQueue, leaveQueue } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const { colors } = useTheme();

  const prevPositionRef = useRef(null);
  const [toastMsg, setToastMsg] = useState(null);
  const [toastKey, setToastKey] = useState(0);

  // Detect queue position advancement
  useEffect(() => {
    if (!activeQueue) { prevPositionRef.current = null; return; }
    const prev = prevPositionRef.current;
    const curr = activeQueue.position;
    if (prev !== null && curr < prev) {
      const moved = prev - curr;
      const msg = curr === 1
        ? '🎉 You are next! Please head to the entrance.'
        : `✅ Moved up ${moved} spot${moved > 1 ? 's' : ''}! Now at position #${curr}.`;
      setToastMsg(msg);
      setToastKey(k => k + 1);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
    prevPositionRef.current = curr;
  }, [activeQueue?.position]);

  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [activeQueue?.estWaitMinutes]);

  // Queue progress: percentage of queue consumed
  const progressPct = activeQueue
    ? Math.max(0, 1 - (activeQueue.position / Math.max(activeQueue.totalInQueue, 1)))
    : 0;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>

      {/* Position advance toast */}
      {toastMsg ? <PositionToast key={toastKey} message={toastMsg} colors={colors} /> : null}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!activeQueue ? (
          <EmptyState
            iconName="people-circle-outline"
            title="No Active Queue"
            message="You're not in any virtual queue yet. Browse nearby locations and tap 'Join Virtual Queue' to get started."
            actionLabel="Browse Locations"
            onAction={() => router.push('/(tabs)')}
          />
        ) : (
          <View style={styles.cardWrap}>
            {/* Location name + priority badge */}
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, ...colors.shadow }]}>
              <Text style={[styles.locationName, { color: colors.text }]} numberOfLines={2}>
                {activeQueue.locationName}
              </Text>
              {activeQueue.isPriority ? (
                <View style={[styles.priorityBadge, { backgroundColor: colors.primary + '20', borderColor: colors.primary + '50', borderWidth: 1 }]}>
                  <Ionicons name="star" size={13} color={colors.primary} />
                  <Text style={[styles.priorityText, { color: colors.primary }]}>⭐ Priority Access</Text>
                </View>
              ) : null}

              {/* Stats row */}
              <View style={[styles.statsRow, { backgroundColor: colors.background, borderRadius: spacing.borderRadius }]}>
                <View style={styles.statCell}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Your Position</Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>#{activeQueue.position}</Text>
                  <Text style={[styles.statSub, { color: colors.textSecondary }]}>of {activeQueue.totalInQueue}</Text>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.statCell}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Est. Wait</Text>
                  <Text style={[styles.statValue, { color: colors.crowdMedium }]}>
                    {activeQueue.estWaitMinutes}m
                  </Text>
                  <Text style={[styles.statSub, { color: colors.textSecondary }]}>Joined {activeQueue.joinedAt}</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressWrap}>
                <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      { backgroundColor: colors.primary, width: `${progressPct * 100}%` },
                    ]}
                  />
                </View>
                <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
                  {activeQueue.position === 1
                    ? '🎉 You are next! Please head over now.'
                    : `${Math.round(progressPct * 100)}% of queue ahead of you has been served`}
                </Text>
              </View>

              {/* Info row */}
              <View style={[styles.infoRow, { backgroundColor: colors.primaryLight, borderRadius: spacing.borderRadiusSmall }]}>
                <Ionicons name="information-circle-outline" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.primary }]}>
                  Queue position updates automatically every few seconds.
                </Text>
              </View>

              <PrimaryButton
                title="Leave Queue"
                variant="danger"
                onPress={leaveQueue}
                icon="trash-bin-outline"
                style={styles.leaveBtn}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper:   { flex: 1, position: 'relative' },
  scroll:    { flex: 1 },
  content:   { padding: spacing.m, paddingBottom: spacing.xxl },
  cardWrap:  { paddingTop: spacing.s },

  card: {
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    padding: spacing.l,
  },
  locationName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: spacing.s,
    letterSpacing: -0.3,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.m,
    paddingVertical: 6,
    borderRadius: spacing.borderRadiusPill,
    marginBottom: spacing.l,
    gap: 6,
  },
  priorityText: { fontSize: 13, fontWeight: '700' },

  statsRow: {
    flexDirection: 'row',
    padding: spacing.m,
    marginBottom: spacing.l,
  },
  statCell:  { flex: 1, alignItems: 'center' },
  divider:   { width: 1, marginHorizontal: spacing.m },
  statLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  statValue: { fontSize: 40, fontWeight: '900', lineHeight: 46, marginBottom: 4 },
  statSub:   { fontSize: 12, fontWeight: '500' },

  progressWrap:  { marginBottom: spacing.m },
  progressTrack: { height: 8, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill:  { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 12, textAlign: 'center', lineHeight: 16 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    padding: spacing.s + 2,
    marginBottom: spacing.l,
  },
  infoText: { flex: 1, fontSize: 12, fontWeight: '500', lineHeight: 16 },

  leaveBtn: { marginTop: 0 },
});
