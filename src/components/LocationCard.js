// src/components/LocationCard.js

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const LocationCard = ({ location, crowdData, onPress, showAlternativeBadge = false }) => {
  const { colors } = useTheme();

  // Match crowdData hex to Theme system keys
  const getThemeColor = () => {
    switch (crowdData?.color) {
      case 'green': return colors.crowdLow;
      case 'yellow': return colors.crowdMedium;
      case 'red': return colors.crowdHigh;
      default: return colors.primary;
    }
  };

  const activeColor = getThemeColor();
  const fillPercentage = Math.min(100, Math.round((location.currentUsers / location.maxCapacity) * 100));

  const getIconName = () => {
    switch(location.type) {
      case 'Restaurant': case 'Canteen': return 'restaurant';
      case 'Library': return 'book';
      case 'Hospital': return 'medkit';
      case 'Bank': return 'business';
      case 'Transport': return 'bus';
      case 'Park': return 'leaf';
      case 'Mall': return 'cart';
      case 'Grocery': return 'basket';
      case 'Temple': return 'sunny';
      case 'Gov': return 'shield-checkmark';
      default: return 'location';
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, ...colors.shadow }]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      {showAlternativeBadge && (
        <View style={[styles.alternativeBadge, { backgroundColor: colors.primary }]}>
            <Ionicons name="sparkles" size={12} color={colors.white} />
            <Text style={[styles.alternativeBadgeText, { color: colors.white }]}>Recommended</Text>
        </View>
      )}

      <View style={styles.topRow}>
          <View style={[styles.iconContainer, { backgroundColor: activeColor + '15' }]}>
            <Ionicons name={getIconName()} size={22} color={activeColor} />
          </View>
          
          <View style={styles.titleContainer}>
            <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                {location.name}
            </Text>
            <View style={styles.subtitleRow}>
               <Text style={[styles.type, { color: colors.textSecondary }]}>{location.type}</Text>
               <View style={[styles.dotSeparator, { backgroundColor: colors.border }]} />
               <Text style={[styles.distanceText, { color: colors.textSecondary }]}>{location.distance}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.border} />
      </View>

      <View style={styles.bottomRow}>
          <View style={styles.crowdInfo}>
              <View style={[styles.crowdIndicatorDot, { backgroundColor: activeColor }]} />
              <Text style={[styles.crowdLabel, { color: activeColor }]}>
                  {crowdData?.label || 'Unknown'} Crowd
              </Text>
              <Text style={[styles.percentageText, { color: colors.textSecondary }]}>({fillPercentage}% full)</Text>
          </View>
          <View style={[styles.waitInfo, { backgroundColor: colors.background }]}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.waitText, { color: colors.textSecondary }]}>{location.waitTime}m wait</Text>
          </View>
      </View>

      <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
          <View style={[styles.progressFill, { width: `${fillPercentage}%`, backgroundColor: activeColor }]} />
      </View>
    </TouchableOpacity>
  );
};

// React.memo to prevent heavy re-renders on FlatList ticks
export default memo(LocationCard);

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.borderRadius,
    padding: spacing.m,
    marginBottom: spacing.m,
    borderWidth: 1,
  },
  alternativeBadge: {
    position: 'absolute',
    top: -12,
    right: spacing.m,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusSmall,
    zIndex: 10,
  },
  alternativeBadgeText: {
    fontSize: typography.tinySize,
    fontWeight: typography.weights.bold,
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.m,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: spacing.borderRadiusSmall,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.s + 4,
  },
  titleContainer: {
    flex: 1,
  },
  name: {
    fontSize: typography.titleSize,
    fontWeight: typography.weights.bold,
    marginBottom: 4,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: {
    fontSize: typography.smallSize,
    fontWeight: typography.weights.medium,
  },
  dotSeparator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: parseInt(spacing.s), // prevent native string bugs
  },
  distanceText: {
    fontSize: typography.smallSize,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: parseInt(spacing.s) + 4,
  },
  crowdInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crowdIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  crowdLabel: {
    fontSize: typography.smallSize + 1,
    fontWeight: typography.weights.bold,
  },
  percentageText: {
    fontSize: typography.tinySize + 1,
    marginLeft: 4,
  },
  waitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: parseInt(spacing.borderRadiusSmall),
  },
  waitText: {
    fontSize: typography.smallSize,
    fontWeight: typography.weights.semiBold,
    marginLeft: 4,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  }
});
