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

const ListItem = memo(({ item, crowdData, onPress }) => (
  <LocationCard location={item} crowdData={crowdData} onPress={onPress} />
));

export default function HomeScreen() {
  const router = useRouter();
  const { locations, getCrowdLevel } = useContext(AppContext);
  const { colors } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 700);
  }, []);

  const handlePress = useCallback((id) => {
    router.push(`/location/${id}`);
  }, [router]);

  const filteredLocations = useMemo(() => {
    if (!debouncedQuery) return locations;

    return locations.filter(loc =>
      loc.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
      loc.type.toLowerCase().includes(debouncedQuery.toLowerCase())
    );
  }, [locations, debouncedQuery]);

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Text style={[styles.greeting, { color: colors.text }]}>
        Anna Nagar, Chennai
      </Text>

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

        {searchQuery.length > 0 && (
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
        )}
      </View>

      <LiveIndicator />
    </View>
  );

  // ✅ FIX: Memoize header
  const memoizedHeader = useMemo(
    () => renderHeader(),
    [searchQuery, filteredLocations.length, colors]
  );

  if (isLoading) {
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
            message="Try adjusting your search to find venues around Anna Nagar."
            actionLabel="Clear Search"
            onAction={() => setSearchQuery('')}
          />
        }
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
  }
});
