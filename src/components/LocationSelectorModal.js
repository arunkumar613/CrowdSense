// src/components/LocationSelectorModal.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  Modal, View, Text, StyleSheet, TextInput,
  TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { AppContext } from '../context/AppContext';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const SUGGESTED_LOCATIONS = [
  { displayName: 'Pondicherry', lat: 11.9416, lng: 79.8083 },
  { displayName: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  { displayName: 'London', lat: 51.5074, lng: -0.1278 },
  { displayName: 'Paris', lat: 48.8566, lng: 2.3522 },
  { displayName: 'Tokyo', lat: 35.6762, lng: 139.6503 },
  { displayName: 'Sydney', lat: -33.8688, lng: 151.2093 }
];

export default function LocationSelectorModal({ visible, onClose }) {
  const { colors } = useTheme();
  const { selectLocationManually, restoreGpsLocation } = useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load recent searches from AsyncStorage
  const loadRecentSearches = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('@CrowdSense:recentSearches');
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Failed to load recent searches:', e.message);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadRecentSearches();
      setSearchQuery('');
      setSearchResults([]);
      setError(null);
    }
  }, [visible, loadRecentSearches]);

  // Save new search to recent searches list
  const saveToRecent = useCallback(async (location) => {
    try {
      let current = [...recentSearches];
      // Filter out duplicate
      current = current.filter(item => item.displayName !== location.displayName);
      // Place at the top
      current.unshift(location);
      // Cap at 5
      if (current.length > 5) {
        current = current.slice(0, 5);
      }
      setRecentSearches(current);
      await AsyncStorage.setItem('@CrowdSense:recentSearches', JSON.stringify(current));
    } catch (e) {
      console.warn('Failed to save recent search:', e.message);
    }
  }, [recentSearches]);

  // Handle location selection
  const handleSelectLocation = useCallback(async (location) => {
    await selectLocationManually(location.lat, location.lng, location.displayName);
    await saveToRecent(location);
    onClose();
  }, [selectLocationManually, saveToRecent, onClose]);

  // Handle GPS restore
  const handleUseCurrentLocation = useCallback(async () => {
    await restoreGpsLocation();
    onClose();
  }, [restoreGpsLocation, onClose]);

  // Perform search on Nominatim
  const performSearch = useCallback(async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'CrowdSenseApp'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: HTTP ${response.status}`);
      }

      const data = await response.json();
      
      const parsedResults = data.map(item => {
        const address = item.address || {};
        // Find most specific location label
        const locality = address.neighbourhood || address.suburb || address.locality || address.village || address.quarter || address.district;
        const city = address.city || address.town || address.subregion || address.region;
        const country = address.country || '';

        let displayName = '';
        if (locality && city && locality !== city) {
          displayName = `${locality}, ${city}`;
        } else if (locality) {
          displayName = locality;
        } else if (city) {
          displayName = city;
        } else {
          // Fallback to name or first part of displayName
          displayName = item.display_name.split(',')[0] + (country ? `, ${country}` : '');
        }

        return {
          displayName,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      });

      // Filter out locations without names
      setSearchResults(parsedResults.filter(r => r.displayName));
    } catch (err) {
      console.warn('Location search failed:', err.message);
      setError('Failed to fetch search results. Check your connection.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Trigger search on submit
  const handleSearchSubmit = () => {
    performSearch(searchQuery);
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Change Location</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Search city, suburb, or country..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
              autoFocus
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Current GPS Location button */}
          <TouchableOpacity 
            style={[styles.currentLocationRow, { borderBottomColor: colors.border }]}
            onPress={handleUseCurrentLocation}
          >
            <View style={[styles.gpsIconCircle, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="navigate" size={16} color={colors.primary} />
            </View>
            <View style={styles.currentLocationTextWrap}>
              <Text style={[styles.currentLocationLabel, { color: colors.primary }]}>Use Current GPS Location</Text>
              <Text style={[styles.currentLocationSub, { color: colors.textSecondary }]}>Switch back to live location tracking</Text>
            </View>
          </TouchableOpacity>

          {/* Body Content */}
          <View style={styles.body}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>Searching OpenStreetMap...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
                <TouchableOpacity 
                  style={[styles.retryBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSearchSubmit}
                >
                  <Text style={styles.retryBtnText}>Retry Search</Text>
                </TouchableOpacity>
              </View>
            ) : searchResults.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Search Results</Text>
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
                  keyboardShouldPersistTaps="handled"
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.resultItem, { borderBottomColor: colors.border }]}
                      onPress={() => handleSelectLocation(item)}
                    >
                      <Ionicons name="location-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                      <Text style={[styles.resultText, { color: colors.text }]} numberOfLines={1}>{item.displayName}</Text>
                    </TouchableOpacity>
                  )}
                />
              </View>
            ) : (
              <View style={{ flex: 1 }}>
                {/* Recent Searches */}
                {recentSearches.length > 0 ? (
                  <View style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Recent Searches</Text>
                    <FlatList
                      data={recentSearches}
                      keyExtractor={(item, index) => `recent-${index}`}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <TouchableOpacity 
                          style={[styles.resultItem, { borderBottomColor: colors.border }]}
                          onPress={() => handleSelectLocation(item)}
                        >
                          <Ionicons name="time-outline" size={18} color={colors.textSecondary} style={{ marginRight: 10 }} />
                          <Text style={[styles.resultText, { color: colors.text }]} numberOfLines={1}>{item.displayName}</Text>
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                ) : null}

                {/* Suggested Locations */}
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Suggested Locations</Text>
                  <View style={styles.chipsContainer}>
                    {SUGGESTED_LOCATIONS.map((item, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.chip, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => handleSelectLocation(item)}
                      >
                        <Ionicons name="pin" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.chipText, { color: colors.text }]}>{item.displayName}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: spacing.borderRadius * 1.5,
    borderTopRightRadius: spacing.borderRadius * 1.5,
    height: '80%',
    padding: spacing.m,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.s,
    borderBottomWidth: 1,
    marginBottom: spacing.m,
  },
  headerTitle: {
    fontSize: typography.titleSize,
    fontWeight: '800',
  },
  closeButton: {
    padding: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: spacing.borderRadiusSmall + 4,
    paddingHorizontal: spacing.m,
    height: 50,
    borderWidth: 1,
    marginBottom: spacing.m,
  },
  searchIcon: {
    marginRight: spacing.s,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.bodySize,
  },
  currentLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
    marginBottom: spacing.m,
  },
  gpsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.m,
  },
  currentLocationTextWrap: {
    flex: 1,
  },
  currentLocationLabel: {
    fontSize: typography.bodySize,
    fontWeight: '700',
  },
  currentLocationSub: {
    fontSize: typography.tinySize + 1,
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  section: {
    marginBottom: spacing.l,
  },
  sectionTitle: {
    fontSize: typography.tinySize + 1,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.s,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.s,
    marginTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.m,
    paddingVertical: 8,
    borderRadius: spacing.borderRadiusPill,
    borderWidth: 1,
  },
  chipText: {
    fontSize: typography.smallSize,
    fontWeight: '600',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.m,
    borderBottomWidth: 1,
  },
  resultText: {
    fontSize: typography.bodySize,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.s,
  },
  infoText: {
    fontSize: typography.smallSize,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.l,
    gap: spacing.s,
  },
  errorText: {
    fontSize: typography.smallSize + 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  retryBtn: {
    paddingHorizontal: spacing.l,
    paddingVertical: 10,
    borderRadius: spacing.borderRadiusSmall,
    marginTop: spacing.s,
  },
  retryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: typography.smallSize,
  }
});
