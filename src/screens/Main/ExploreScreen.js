// src/screens/Main/ExploreScreen.js

import React, { useState, useContext, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Animated, LayoutAnimation,
  PanResponder, useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppContext } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

import LocationCard   from '../../components/LocationCard';
import EmptyState     from '../../components/EmptyState';
import InteractiveMap from '../../components/InteractiveMap';
import LiveIndicator  from '../../components/LiveIndicator';
import SkeletonLoader from '../../components/SkeletonLoader';
import LocationSelectorModal from '../../components/LocationSelectorModal';
import { performSmartSearch } from '../../services/searchService';

const CATEGORIES = [
  { key: 'All',       label: 'All',        icon: 'apps'             },
  { key: 'Hospital',  label: 'Hospitals',  icon: 'medkit'           },
  { key: 'Mall',      label: 'Malls',      icon: 'cart'             },
  { key: 'Bank',      label: 'Banks',      icon: 'business'         },
  { key: 'Transport', label: 'Transport',  icon: 'bus'              },
  { key: 'Gov',       label: 'Government', icon: 'shield-checkmark' },
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
  const { locations, getCrowdLevel, detectedLocationName, isDemoData, currentCoordinates, gpsCoordinates } = useContext(AppContext);
  const { colors } = useTheme();
  const { height: screenH } = useWindowDimensions();

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery,    setSearchQuery]     = useState('');
  const [isLoading,      setIsLoading]       = useState(true);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState(null);

  // Floating controls triggers
  const [gpsTrigger, setGpsTrigger] = useState(0);
  const [fitAllTrigger, setFitAllTrigger] = useState(0);

  const scrollViewRef = useRef(null);
  const cardYPositions = useRef({});

  // Bottom Sheet layout variables (calculated dynamically based on screen height)
  const COLLAPSED_HEIGHT = useMemo(() => Math.min(280, Math.max(220, screenH * 0.35)), [screenH]);
  const HALF_HEIGHT = useMemo(() => screenH * 0.60, [screenH]);
  const FULL_HEIGHT = useMemo(() => screenH - 120, [screenH]);
  const MAP_HEIGHT = useMemo(() => screenH - COLLAPSED_HEIGHT, [screenH, COLLAPSED_HEIGHT]);

  const sheetHeight = useRef(new Animated.Value(240)).current;
  const sheetState = useRef('collapsed'); // 'collapsed' | 'half' | 'full'

  // Sync initial and dynamic height on resize
  useEffect(() => {
    if (sheetState.current === 'collapsed') {
      sheetHeight.setValue(COLLAPSED_HEIGHT);
    } else if (sheetState.current === 'half') {
      sheetHeight.setValue(HALF_HEIGHT);
    } else if (sheetState.current === 'full') {
      sheetHeight.setValue(FULL_HEIGHT);
    }
  }, [COLLAPSED_HEIGHT, HALF_HEIGHT, FULL_HEIGHT, sheetHeight]);

  const snapTo = useCallback((state) => {
    let toValue = COLLAPSED_HEIGHT;
    if (state === 'half') toValue = HALF_HEIGHT;
    if (state === 'full') toValue = FULL_HEIGHT;
    
    sheetState.current = state;
    Animated.spring(sheetHeight, {
      toValue,
      tension: 50,
      friction: 8,
      useNativeDriver: false
    }).start();
  }, [sheetHeight, COLLAPSED_HEIGHT, HALF_HEIGHT, FULL_HEIGHT]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const currentHeight = sheetHeight._value;
        const newHeight = currentHeight - gestureState.dy;
        if (newHeight > COLLAPSED_HEIGHT - 30 && newHeight < FULL_HEIGHT + 30) {
          sheetHeight.setValue(newHeight);
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        const currentHeight = sheetHeight._value;
        const threshold1 = COLLAPSED_HEIGHT + (HALF_HEIGHT - COLLAPSED_HEIGHT) / 2;
        const threshold2 = HALF_HEIGHT + (FULL_HEIGHT - HALF_HEIGHT) / 2;
        
        if (currentHeight < threshold1) {
          snapTo('collapsed');
        } else if (currentHeight < threshold2) {
          snapTo('half');
        } else {
          snapTo('full');
        }
      }
    })
  ).current;

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

  const handleCardPress = useCallback((id) => {
    if (selectedLocationId === id) {
      router.push(`/location/${id}`);
    } else {
      setSelectedLocationId(id);
      snapTo('collapsed');
    }
  }, [selectedLocationId, router, snapTo]);

  const handleMarkerSelect = useCallback((id) => {
    setSelectedLocationId(id);
    if (sheetState.current === 'collapsed') {
      snapTo('half');
    }
    setTimeout(() => {
      const y = cardYPositions.current[id];
      if (y !== undefined) {
        // Scroll to card wrapper offset
        scrollViewRef.current?.scrollTo({ y: Math.max(0, y - 20), animated: true });
      }
    }, 200);
  }, [snapTo]);

  const categoryFiltered = useMemo(() => {
    if (activeCategory === 'All') return locations;
    return locations.filter(l => l.type === activeCategory);
  }, [locations, activeCategory]);

  const searchData = useMemo(() => {
    return performSmartSearch(categoryFiltered, searchQuery);
  }, [categoryFiltered, searchQuery]);

  const filteredBase = searchData.results;

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

  const renderCard = useCallback((item) => {
    const isHighlighted = item.id === selectedLocationId;
    return (
      <View
        key={item.id}
        onLayout={(event) => {
          cardYPositions.current[item.id] = event.nativeEvent.layout.y;
        }}
        style={[
          styles.cardWrapper,
          isHighlighted && {
            borderColor: colors.primary,
            borderWidth: 2,
            borderRadius: 12,
            padding: 2,
            shadowColor: colors.primary,
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 4
          }
        ]}
      >
        <LocationCard
          location={item}
          crowdData={getCrowdLevel(item.currentUsers, item.maxCapacity)}
          onPress={() => handleCardPress(item.id)}
        />
      </View>
    );
  }, [getCrowdLevel, handleCardPress, selectedLocationId, colors]);

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
      {/* 1. Floating Header (absolute positioned with opacity) */}
      <View style={[styles.header, { backgroundColor: colors.surface + 'E6', borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          onPress={() => setLocationModalVisible(true)} 
          style={styles.locationSelectorRow}
          activeOpacity={0.7}
        >
          <Ionicons name="location" size={18} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.locationTitleText, { color: colors.text }]} numberOfLines={1}>
            {detectedLocationName}
          </Text>
          <Ionicons name="chevron-down" size={12} color={colors.textSecondary} style={{ marginLeft: 4, marginTop: 2 }} />
        </TouchableOpacity>

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
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={spacing.hitSlop}>
              <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          ) : null}
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

      {/* 2. Full screen Map Wrapper */}
      <View style={[styles.mapWrapper, { height: MAP_HEIGHT }]}>
        <InteractiveMap
          locations={filteredBase}
          center={currentCoordinates}
          gpsLocation={gpsCoordinates}
          activeLocationId={selectedLocationId}
          onSelectLocationId={handleMarkerSelect}
          gpsTrigger={gpsTrigger}
          fitAllTrigger={fitAllTrigger}
        />
      </View>

      {/* 3. Floating map controls */}
      <View style={[styles.floatingControls, { top: MAP_HEIGHT - 110 }]}>
        <TouchableOpacity 
          style={[styles.floatingButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setGpsTrigger(prev => prev + 1)}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate" size={20} color={colors.primary} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.floatingButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setFitAllTrigger(prev => prev + 1)}
          activeOpacity={0.8}
        >
          <Ionicons name="expand" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 4. Draggable Bottom Sheet */}
      <Animated.View style={[
        styles.bottomSheet, 
        { 
          height: sheetHeight, 
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderTopWidth: 1,
          ...colors.shadow
        }
      ]}>
        {/* Handle bar with drag listeners */}
        <View {...panResponder.panHandlers} style={styles.bottomSheetHandleWrap}>
          <View style={[styles.bottomSheetHandle, { backgroundColor: colors.border }]} />
          <Text style={[styles.bottomSheetTitle, { color: colors.textSecondary }]}>
            {filteredBase.length} places nearby
          </Text>
        </View>

        {/* Warning banners (showing fallback or offline demo states) */}
        {searchData.didYouMean ? (
          <View style={[styles.didYouMeanContainer, { paddingHorizontal: spacing.m }]}>
            <Text style={[styles.didYouMeanText, { color: colors.textSecondary }]}>
              Did you mean:{' '}
              <Text 
                style={[styles.didYouMeanLink, { color: colors.primary }]}
                onPress={() => setSearchQuery(searchData.didYouMean)}
              >
                {searchData.didYouMean}
              </Text>
            </Text>
          </View>
        ) : null}

        {searchData.isFallback && searchData.infoMessage ? (
          <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30', marginHorizontal: spacing.m }]}>
            <Ionicons name="sparkles" size={16} color={colors.primary} />
            <Text style={[styles.infoBannerText, { color: colors.primary }]}>
              {searchData.infoMessage}
            </Text>
          </View>
        ) : null}

        {isDemoData ? (
          <View style={[
            styles.fallbackBanner,
            {
              backgroundColor: colors.crowdMedium + '15',
              borderColor: colors.crowdMedium + '40',
              borderRadius: spacing.borderRadiusSmall + 2,
              padding: spacing.s + 2,
              gap: spacing.s,
              marginHorizontal: spacing.m
            }
          ]}>
            <Ionicons name="information-circle" size={16} color={colors.crowdMedium} />
            <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1, fontWeight: '500' }}>
              Live nearby place data is currently unavailable. Showing demo data.
            </Text>
          </View>
        ) : null}

        {/* Scrollable list of cards */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.sheetScroll}
          contentContainerStyle={styles.sheetScrollContent}
          showsVerticalScrollIndicator={false}
        >
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
      </Animated.View>

      <LocationSelectorModal 
        visible={locationModalVisible} 
        onClose={() => setLocationModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    borderBottomWidth: 1,
    paddingTop: spacing.m,
    paddingBottom: spacing.s,
  },
  locationSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    marginBottom: spacing.s,
    marginTop: spacing.xs,
  },
  locationTitleText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
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
  mapWrapper: {
    width: '100%',
    zIndex: 1,
  },
  floatingControls: {
    position: 'absolute',
    right: spacing.m,
    zIndex: 10,
    gap: spacing.s,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 5,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  bottomSheetHandleWrap: {
    width: '100%',
    paddingVertical: spacing.s,
    alignItems: 'center',
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 8,
  },
  bottomSheetTitle: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: spacing.m,
    paddingBottom: spacing.xxl,
  },
  section:       { marginBottom: spacing.xl },
  cardWrapper: {
    marginBottom: spacing.s,
    borderColor: 'transparent',
    borderWidth: 2,
    padding: 2,
  },
  fallbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: spacing.m,
  },
  didYouMeanContainer: {
    paddingVertical: spacing.s,
    marginBottom: spacing.s,
  },
  didYouMeanText: {
    fontSize: typography.smallSize + 1,
    fontWeight: '500',
  },
  didYouMeanLink: {
    fontWeight: '800',
    textDecorationLine: 'underline',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.s + 2,
    borderWidth: 1,
    borderRadius: spacing.borderRadiusSmall + 2,
    marginTop: spacing.s,
    marginBottom: spacing.s,
    gap: spacing.s,
  },
  infoBannerText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
