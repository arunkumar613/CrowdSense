// src/screens/Main/ExploreScreen.js

import React, { useState, useContext, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Animated, LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppContext } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import LocationCard   from '../../components/LocationCard';
import EmptyState     from '../../components/EmptyState';
import MapPlaceholder from '../../components/MapPlaceholder';
import LiveIndicator  from '../../components/LiveIndicator';
import SkeletonLoader from '../../components/SkeletonLoader';

const CATEGORIES = [
  { key: 'All',       label: 'All',        icon: 'apps'             },
  { key: 'Hospital',  label: 'Hospitals',  icon: 'medkit'           },
  { key: 'Mall',      label: 'Malls',      icon: 'cart'             },
  { key: 'Bank',      label: 'Banks',      icon: 'business'         },
  { key: 'Transport', label: 'Transport',  icon: 'bus'              },
  { key: 'Gov',       label: 'Government', icon: 'primary'          },
  { key: 'Park',      label: 'Parks',      icon: 'leaf'             },
  { key: 'Temple',    label: 'Temples',    icon: 'sunny'            },
];

// ── Staggered fade-in wrapper ─────────────────────────────────────────────────
const FadeSection = memo(({ children, delay = 0 }) => {
  const fade  = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(16)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade,  { toValue: 1, duration: 350, delay, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 0, duration: 350, delay, useNativeDriver: true }),
    ]).start();
  }, [delay, fade, slide]);
  return (
    <Animated.View style={{ opacity: fade, transform: [{ translateY: slide }] }}>
      {children}
    </Animated.View>
  );
});

// ── Section header ────────────────────────────────────────────────────────────
const SectionHeader = memo(({ icon, title, subtitle, colors }) => (
  <View style={sh.row}>
    <View style={[sh.badge, { backgroundColor: colors.primaryLight }]}>
      <Ionicons name={icon} size={15} color={colors.primary} />
    </View>
    <View>
      <Text style={[sh.title, { color: colors.text }]}>{title}</Text>
      {subtitle ? <Text style={[sh.sub, { color: colors.textSecondary }]}>{subtitle}</Text> : null}
    </View>
  </View>
));
const sh = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.m },
  badge: { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginRight: spacing.s },
  title: { fontSize: typography.titleSize - 1, fontWeight: '800' },
  sub:   { fontSize: typography.tinySize + 1, marginTop: 1 },
});

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ExploreScreen() {
  const router = useRouter();
  const { locations, getCrowdLevel } = useContext(AppContext);
  const { colors } = useTheme();

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery,    setSearchQuery]     = useState('');
  const [isLoading,      setIsLoading]       = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsLoading(false);
    }, 1100);
    return () => clearTimeout(t);
  }, []);

  const handleCat = useCallback((key) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveCategory(key);
  }, []);

  const handlePress = useCallback((id) => router.push(`/location/${id}`), [router]);

  const filteredBase = useMemo(() => {
    let r = locations;
    if (activeCategory !== 'All') r = r.filter(l => l.type === activeCategory);
    if (searchQuery.trim())
      r = r.filter(l =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.type.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return r;
  }, [locations, activeCategory, searchQuery]);

  const leastCrowded = useMemo(
    () => [...filteredBase].sort((a, b) => (a.currentUsers / a.maxCapacity) - (b.currentUsers / b.maxCapacity)).slice(0, 4),
    [filteredBase]
  );
  const fastestQueue = useMemo(
    () => [...filteredBase].sort((a, b) => a.waitTime - b.waitTime).slice(0, 4),
    [filteredBase]
  );
  const recommended = useMemo(
    () => filteredBase.filter(l => {
      const pct = (l.currentUsers / l.maxCapacity) * 100;
      return pct >= 30 && pct <= 60;
    }).slice(0, 4),
    [filteredBase]
  );

  const renderCard = useCallback((item) => (
    <LocationCard
      key={item.id}
      location={item}
      crowdData={getCrowdLevel(item.currentUsers, item.maxCapacity)}
      onPress={() => handlePress(item.id)}
    />
  ), [getCrowdLevel, handlePress]);

  const renderSection = useCallback((icon, title, subtitle, data, delay) => {
    if (!data.length) return null;
    return (
      <FadeSection key={title} delay={delay}>
        <View style={styles.section}>
          <SectionHeader icon={icon} title={title} subtitle={subtitle} colors={colors} />
          {data.map(renderCard)}
        </View>
      </FadeSection>
    );
  }, [colors, renderCard]);

  if (isLoading) return <SkeletonLoader variant="explore" cardCount={3} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Sticky search + chip header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <Ionicons name="search" size={20} color={colors.textSecondary} style={{ marginRight: spacing.s }} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search places..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={colors.textSecondary}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={spacing.hitSlop}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORIES.map(cat => {
            const active = activeCategory === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                style={[styles.chip, active
                  ? { backgroundColor: colors.primary, borderColor: colors.primary }
                  : { backgroundColor: colors.background, borderColor: colors.border }
                ]}
                onPress={() => handleCat(cat.key)}
                activeOpacity={0.75}
              >
                <Ionicons name={cat.icon} size={12} color={active ? '#fff' : colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.chipText, { color: active ? '#fff' : colors.textSecondary }]}>{cat.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <LiveIndicator />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <FadeSection delay={0}>
          <MapPlaceholder height={165} locationName="Anna Nagar, Chennai" />
        </FadeSection>

        {filteredBase.length === 0 ? (
          <EmptyState
            iconName="compass-outline"
            title="No Places Found"
            message="Try adjusting your filters or search."
            actionLabel="Clear Filters"
            onAction={() => { setActiveCategory('All'); setSearchQuery(''); }}
          />
        ) : (
          <>
            {renderSection('leaf',        '🟢 Least Crowded',     'Sorted by lowest crowd',   leastCrowded, 80)}
            {renderSection('flash',       '⚡ Fastest Queue',      'Shortest wait time first', fastestQueue, 180)}
            {renderSection('star',        '⭐ Recommended',        '30–60% crowd — ideal',     recommended,  280)}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header:    { borderBottomWidth: 1, paddingTop: spacing.m },
  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: spacing.borderRadiusSmall + 4,
    paddingHorizontal: spacing.m, height: 50, borderWidth: 1,
    marginHorizontal: spacing.m, marginBottom: spacing.m,
  },
  searchInput: { flex: 1, fontSize: typography.bodySize },
  chips:     { paddingHorizontal: spacing.m, gap: spacing.s, paddingBottom: 2 },
  chip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.m, paddingVertical: 7,
    borderRadius: spacing.borderRadiusPill, borderWidth: 1,
  },
  chipText: { fontSize: typography.smallSize, fontWeight: '700' },
  scroll:        { flex: 1 },
  scrollContent: { padding: spacing.m, paddingBottom: spacing.xxl + spacing.l },
  section:       { marginBottom: spacing.xl },
});
