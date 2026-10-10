// src/screens/Main/HomeScreen.js — Production upgrade (Fixed Search + Focus Issue)

import React, { useState, useEffect, useCallback, useContext, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TextInput, TouchableOpacity, LayoutAnimation,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { AppContext } from '../../context/AppContext';
import { useTheme } from '../../hooks/useTheme';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import LocationCard from '../../components/LocationCard';
import SkeletonLoader from '../../components/SkeletonLoader';
import EmptyState from '../../components/EmptyState';
import LiveIndicator from '../../components/LiveIndicator';
import LocationSelectorModal from '../../components/LocationSelectorModal';
import { performSmartSearch } from '../../services/searchService';

const ListItem = memo(({ item, crowdData, onPress }) => (
  <LocationCard location={item} crowdData={crowdData} onPress={onPress} />
));
ListItem.displayName = 'ListItem';

export default function HomeScreen() {
  const router = useRouter();
  const { 
    locations, 
    getCrowdLevel, 
    detectedLocationName, 
    detectLocation, 
    isLoadingLocation,
    isDemoData
  } = useContext(AppContext);
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  // Loading skeleton
  useEffect(() => {
    const t = setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsLoading(false);
    }, 900);
    return () => clearTimeout(t);
  }, []);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await detectLocation();
    } catch (e) {
      console.warn("Location refresh failed:", e);
    } finally {
      setRefreshing(false);
    }
  }, [detectLocation]);

  const handlePress = useCallback((id) => {
    router.push(`/location/${id}`);
  }, [router]);

  const searchData = useMemo(() => {
    return performSmartSearch(locations, debouncedQuery);
  }, [locations, debouncedQuery]);

  const filteredLocations = searchData.results;

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <TouchableOpacity 
        onPress={() => setLocationModalVisible(true)} 
        style={styles.locationSelectorRow}
        activeOpacity={0.7}
      >
        <Ionicons name="location" size={20} color={colors.primary} style={{ marginRight: 4 }} />
        <Text style={[styles.greeting, { color: colors.text }]}>
          {detectedLocationName}
        </Text>
        <Ionicons name="chevron-down" size={14} color={colors.textSecondary} style={{ marginLeft: 4, marginTop: 4 }} />
      </TouchableOpacity>

      <Text style={[styles.subGreeting, { color: colors.textSecondary }]}>
        {filteredLocations.length} locations nearby
      </Text>

      <View style={[
        styles.searchBox,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          ...colors.shadow
        }
      ]}>
        <Ionicons
          name="search"
          size={20}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />

        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search hospitals, malls, parks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor={colors.textSecondary}
          returnKeyType="search"
        />

        {searchQuery.length > 0 ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={spacing.hitSlop}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {searchData.didYouMean ? (
        <View style={styles.didYouMeanContainer}>
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
        <View style={[styles.infoBanner, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '30' }]}>
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
            gap: spacing.s
          }
        ]}>
          <Ionicons name="information-circle" size={16} color={colors.crowdMedium} />
          <Text style={{ fontSize: 12, color: colors.textSecondary, flex: 1, fontWeight: '500' }}>
            Live nearby place data is currently unavailable. Showing demo data.
          </Text>
        </View>
      ) : null}

      <LiveIndicator />
    </View>
  ), [searchQuery, filteredLocations.length, colors, detectedLocationName, isDemoData, searchData]);

  // ✅ FIX: Memoize header
  const memoizedHeader = useMemo(
    () => renderHeader(),
    [renderHeader]
  );

  if (isLoading || isLoadingLocation) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SkeletonLoader variant="home" cardCount={4} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={filteredLocations}
        keyExtractor={item => item.id}
        initialNumToRender={6}
        windowSize={5}
        removeClippedSubviews
        renderItem={({ item }) => (
          <ListItem
            item={item}
            crowdData={getCrowdLevel(
              item.currentUsers,
              item.maxCapacity
            )}
            onPress={() => handlePress(item.id)}
          />
        )}
        contentContainerStyle={styles.list}
        ListHeaderComponent={memoizedHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            iconName="search-outline"
            title="No Locations Found"
            message={`Try adjusting your search to find venues around ${detectedLocationName}.`}
            actionLabel="Clear Search"
            onAction={() => setSearchQuery('')}
          />
        }
      />

      <LocationSelectorModal 
        visible={locationModalVisible} 
        onClose={() => setLocationModalVisible(false)} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  list: {
    padding: spacing.m,
    paddingBottom: spacing.xxl
  },

  fallbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginTop: spacing.s,
    marginBottom: spacing.s,
  },

  locationSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },

  headerContainer: {
    marginBottom: spacing.m
  },

  greeting: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 2,
    letterSpacing: -0.3
  },

  subGreeting: {
    fontSize: typography.smallSize,
    fontWeight: '500',
    marginBottom: spacing.m
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.borderRadiusSmall + 4,
    paddingHorizontal: spacing.m,
    height: 50,
    borderWidth: 1,
    marginBottom: 4,
  },

  searchIcon: {
    marginRight: spacing.s
  },

  searchInput: {
    flex: 1,
    fontSize: typography.bodySize
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
  }
});