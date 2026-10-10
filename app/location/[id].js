import React, { useContext, useEffect, useState, useMemo, useRef } from 'react';
import { Animated } from 'react-native';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity, LayoutAnimation } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppContext } from '../../src/context/AppContext';
import { AuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

import LocationCard from '../../src/components/LocationCard';
import PrimaryButton from '../../src/components/PrimaryButton';
import CircularGauge from '../../src/components/CircularGauge';
import MapPlaceholder from '../../src/components/MapPlaceholder';

export default function LocationDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  
  const { locations, getCrowdLevel, getCrowdTrend, getBestTime, joinQueue } = useContext(AppContext);
  const { user } = useContext(AuthContext);
  const { colors } = useTheme();

  const [location, setLocation] = useState(null);
  const [crowdData, setCrowdData] = useState(null);
  const [joining, setJoining] = useState(false);

  // Fade-in animation ref for the alternatives section
  const altFadeAnim = useRef(new Animated.Value(0)).current;

  // Derive location + crowdData from context whenever locations list or id changes
  useEffect(() => {
    const loc = locations.find(l => l.id === id);
    if (loc) {
      setLocation(loc);
      const data = getCrowdLevel(loc.currentUsers, loc.maxCapacity);
      setCrowdData(data);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    }
  }, [id, locations, getCrowdLevel]);

  // ─── Smart Recommendation Engine ────────────────────────────────────────────
  // useMemo keeps this pure – no setState, no side-effects.
  // Trigger: crowd percentage >= 75%
  // Logic  : same type, lower crowd %, sort ascending by crowd %
  const alternatives = useMemo(() => {
    if (!location) return [];
    const currentPct = (location.currentUsers / location.maxCapacity) * 100;
    if (currentPct < 75) return []; // Not crowded enough to suggest alternatives

    return locations
      .filter(loc => {
        if (loc.id === id) return false;           // Exclude self
        if (loc.type !== location.type) return false; // Same category only
        const pct = (loc.currentUsers / loc.maxCapacity) * 100;
        return pct < currentPct;                   // Strictly lower crowd
      })
      .sort((a, b) => {
        // Sort by crowd % ascending (least crowded first)
        const pctA = (a.currentUsers / a.maxCapacity) * 100;
        const pctB = (b.currentUsers / b.maxCapacity) * 100;
        return pctA - pctB;
      })
      .slice(0, 4); // Show top 4 alternatives max
  }, [id, location, locations]);

  // Trigger fade-in whenever alternatives list changes (appears or disappears)
  useEffect(() => {
    if (alternatives.length > 0) {
      altFadeAnim.setValue(0); // Reset before animating in
      Animated.timing(altFadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
    } else {
      altFadeAnim.setValue(0);
    }
  }, [alternatives.length, altFadeAnim]);

  const handleJoinQueue = () => {
     setJoining(true);
     setTimeout(() => {
        joinQueue(id, user);
        setJoining(false);
        Alert.alert(
            'Queue Joined',
            `Success! You have joined the virtual queue for ${location.name}`,
            [{ text: 'View Queue', onPress: () => router.push('/(tabs)/queue') }]
        );
     }, 1000); // Simulated delay for visual realism
  };

  if (!location) return null;

  const percentage  = Math.round((location.currentUsers / location.maxCapacity) * 100);
  const isHighCrowd = percentage >= 75;
  const trend       = getCrowdTrend(location.id, location.currentUsers);
  const bestTime    = getBestTime(location);

  // Trend display config
  const trendConfig = {
    up:     { icon: 'trending-up',   label: 'Crowd Increasing', color: '#EF4444' },
    down:   { icon: 'trending-down', label: 'Crowd Decreasing', color: '#10B981' },
    stable: { icon: 'remove',        label: 'Crowd Stable',     color: '#F59E0B' },
  };
  const tc = trendConfig[trend] || trendConfig.stable;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      
      {/* Header Modal Handle */}
      <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
      
      <TouchableOpacity style={styles.closeBtn} onPress={() => router.back()}>
          <Ionicons name="close-circle" size={32} color={colors.textSecondary} />
      </TouchableOpacity>

      <Text style={[styles.title, { color: colors.text }]}>{location.name}</Text>
      
      <View style={styles.metaRow}>
          <Text style={[styles.typeText, { color: colors.textSecondary }]}>{location.type}</Text>
          <View style={[styles.metaDot, { backgroundColor: colors.border }]} />
          <Text style={[styles.distanceText, { color: colors.textSecondary }]}>{location.distance} away</Text>
      </View>

      {/* Professional Map Placeholder */}
      <MapPlaceholder height={160} locationName={location.name} />

      {/* ⚠ High Crowd Alert Banner — shown at >= 75% */}
      {isHighCrowd ? (
        <View style={[styles.warningBanner, { backgroundColor: colors.error + '18', borderColor: colors.error }]}>
            <View style={[styles.warningIconWrap, { backgroundColor: colors.error + '25' }]}>
              <Ionicons name="warning" size={18} color={colors.error} />
            </View>
            <View style={styles.warningTextWrap}>
              <Text style={[styles.warningTitle, { color: colors.error }]}>Highly Crowded — Try These Instead</Text>
              <Text style={[styles.warningText, { color: colors.error + 'CC' }]}>
                {alternatives.length > 0
                  ? `${alternatives.length} less crowded ${location.type.toLowerCase()}${alternatives.length > 1 ? 's' : ''} found nearby.`
                  : 'Expect long wait times at this location.'}
              </Text>
            </View>
        </View>
      ) : null}

      {/* Main Status Engine */}
      <View style={[styles.mainCard, { backgroundColor: colors.surface, borderColor: colors.border, ...colors.shadow }]}>
          <Text style={[styles.cardHeader, { color: colors.text }]}>Live Crowd Data</Text>

          <View style={styles.statusRow}>
              {/* === Circular Gauge (replaces box widget) === */}
              <View style={styles.gaugeWrapper}>
                <CircularGauge
                  percentage={percentage}
                  label={crowdData?.label || ''}
                  size={150}
                  strokeWidth={14}
                />
              </View>

              {/* Wait-time companion card */}
              <View style={[styles.waitCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Ionicons name="time-outline" size={28} color={colors.primary} style={{ marginBottom: 8 }} />
                  <Text style={[styles.waitLabel, { color: colors.textSecondary }]}>Est. Wait</Text>
                  <Text style={[styles.waitValue, { color: colors.text }]}>{location.waitTime}m</Text>
                  {user?.isPriorityUser ? (
                    <View style={[styles.priorityChip, { backgroundColor: colors.primaryLight }]}>
                      <Ionicons name="star" size={11} color={colors.primary} />
                      <Text style={[styles.priorityChipText, { color: colors.primary }]}>Priority</Text>
                    </View>
                  ) : (
                    <Text style={[styles.waitSub, { color: colors.textSecondary }]}>Standard</Text>
                  )}
              </View>
          </View>
          
          <Text style={[styles.userCountText, { color: colors.textSecondary }]}>
            {location.currentUsers} / {location.maxCapacity} people currently on site
          </Text>

          {/* Trend indicator */}
          <View style={[styles.trendRow, { backgroundColor: tc.color + '15', borderColor: tc.color + '40', borderWidth: 1 }]}>
            <Ionicons name={tc.icon} size={16} color={tc.color} />
            <Text style={[styles.trendLabel, { color: tc.color }]}>{tc.label}</Text>
          </View>

          {/* Best time to visit */}
          {bestTime ? (
            <View style={[styles.bestTimeRow, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30', borderWidth: 1 }]}>
              <Ionicons name="time" size={16} color={colors.primary} />
              <Text style={[styles.bestTimeLabel, { color: colors.primary }]}>Best Time to Visit: </Text>
              <Text style={[styles.bestTimeValue, { color: colors.primary }]}>{bestTime}</Text>
            </View>
          ) : null}

          <PrimaryButton
            title="Join Virtual Queue"
            onPress={handleJoinQueue}
            loading={joining}
            icon="people-circle"
            style={styles.joinBtn}
          />
      </View>

      {/* ─── Smart Recommendations Section ─────────────────────────────────── */}
      {alternatives.length > 0 ? (
        <Animated.View
          style={[
            styles.altSection,
            { opacity: altFadeAnim, transform: [{ translateY: altFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }
          ]}
        >
          {/* Section header */}
          <View style={[styles.altHeader, { backgroundColor: colors.surface, borderColor: colors.border, ...colors.shadow }]}>
            <View style={styles.altHeaderTop}>
              <View style={[styles.altIconBadge, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="sparkles" size={16} color={colors.primary} />
              </View>
              <View style={styles.altHeaderText}>
                <Text style={[styles.altTitle, { color: colors.text }]}>Better Alternatives Nearby</Text>
                <Text style={[styles.altSubtitle, { color: colors.textSecondary }]}>
                  {alternatives.length} less crowded {location.type.toLowerCase()}{alternatives.length > 1 ? 's' : ''} found
                </Text>
              </View>
            </View>
            <Text style={[styles.altDesc, { color: colors.textSecondary }]}>
              Sorted by lowest crowd level — tap to navigate.
            </Text>
          </View>

          {/* Alternative location cards */}
          {alternatives.map((alt, index) => {
            const altCrowd = getCrowdLevel(alt.currentUsers, alt.maxCapacity);
            const altPct = Math.round((alt.currentUsers / alt.maxCapacity) * 100);
            return (
              <LocationCard
                key={alt.id}
                location={alt}
                crowdData={altCrowd}
                onPress={() => router.replace(`/location/${alt.id}`)}
                showAlternativeBadge
              />
            );
          })}
        </Animated.View>
      ) : null}

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.l,
    paddingBottom: spacing.xxl * 2,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: spacing.l,
  },
  closeBtn: {
    position: 'absolute',
    top: spacing.l,
    right: spacing.m,
    zIndex: 10,
  },
  title: {
    fontSize: typography.headerSize,
    fontWeight: typography.weights.heavy,
    marginBottom: spacing.xs,
    paddingRight: 40, // Space for close button
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  typeText: {
    fontSize: typography.bodySize,
    fontWeight: typography.weights.semiBold,
  },
  metaDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginHorizontal: spacing.s,
  },
  distanceText: {
    fontSize: typography.bodySize,
  },
  // Map snippet styles removed – handled by MapPlaceholder component
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.m,
    borderRadius: spacing.borderRadiusSmall,
    borderWidth: 1,
    marginBottom: spacing.l,
  },
  warningText: {
    flex: 1,
    marginLeft: spacing.s,
    fontWeight: typography.weights.bold,
    fontSize: typography.smallSize,
    lineHeight: 18,
  },
  mainCard: {
    padding: spacing.m,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
  cardHeader: {
    fontSize: typography.titleSize,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.m,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.m,
  },
  gaugeWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitCard: {
    flex: 1,
    marginLeft: spacing.m,
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    padding: spacing.m,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 150,
  },
  waitLabel: {
    fontSize: typography.smallSize,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  waitValue: {
    fontSize: 42,
    fontWeight: typography.weights.heavy,
    lineHeight: 48,
  },
  waitSub: {
    fontSize: typography.tinySize + 1,
    fontWeight: typography.weights.medium,
    marginTop: 4,
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.s,
    paddingVertical: 3,
    borderRadius: spacing.borderRadiusPill,
    marginTop: 6,
  },
  priorityChipText: {
    fontSize: typography.tinySize + 1,
    fontWeight: typography.weights.bold,
  },
  userCountText: {
    textAlign: 'center',
    fontSize: typography.tinySize,
    marginBottom: spacing.m,
  },
  joinBtn: {
    marginVertical: 0,
  },
  altSection: {
    marginTop: spacing.m,
  },
  altHeader: {
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    padding: spacing.m,
    marginBottom: spacing.m,
  },
  altHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.s,
  },
  altIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.s,
  },
  altHeaderText: {
    flex: 1,
  },
  altTitle: {
    fontSize: typography.titleSize - 1,
    fontWeight: typography.weights.heavy,
    lineHeight: 20,
  },
  altSubtitle: {
    fontSize: typography.tinySize + 1,
    fontWeight: typography.weights.medium,
    marginTop: 2,
  },
  altDesc: {
    fontSize: typography.smallSize,
    lineHeight: 18,
  },
  warningIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.s,
    flexShrink: 0,
  },
  warningTextWrap: {
    flex: 1,
  },
  warningTitle: {
    fontSize: typography.smallSize + 1,
    fontWeight: typography.weights.heavy,
    marginBottom: 2,
  },
  // Trend indicator
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: spacing.borderRadiusSmall,
    marginBottom: spacing.s,
  },
  trendLabel: {
    fontSize: typography.smallSize,
    fontWeight: '700',
  },
  // Best time to visit
  bestTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.m,
    paddingVertical: spacing.s,
    borderRadius: spacing.borderRadiusSmall,
    marginBottom: spacing.m,
  },
  bestTimeLabel: {
    fontSize: typography.smallSize,
    fontWeight: '600',
  },
  bestTimeValue: {
    fontSize: typography.smallSize,
    fontWeight: '800',
  },
});
