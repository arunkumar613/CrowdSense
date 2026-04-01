// src/components/MapPlaceholder.js
// Professional fake-map UI with grid lines, location pins, and a "Nearby" label

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Line, Circle as SvgCircle, G } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

/** Deterministic pseudo-random float from a seed */
const seeded = (seed) => ((Math.sin(seed) * 43758.5453123) % 1 + 1) % 1;

/** Rendered marker pins at fixed relative positions */
const MARKERS = [
  { xRatio: 0.25, yRatio: 0.35, primary: true },
  { xRatio: 0.60, yRatio: 0.55, primary: false },
  { xRatio: 0.78, yRatio: 0.28, primary: false },
  { xRatio: 0.42, yRatio: 0.70, primary: false },
];

const GRID_LINES = 6; // Number of horizontal and vertical grid lines

const MapPlaceholder = ({ height = 160, locationName = '' }) => {
  const { colors, isDarkMode } = useTheme();

  const gridColor = isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const roadColor = isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)';

  return (
    <View style={[styles.container, { height, backgroundColor: isDarkMode ? '#1a2332' : '#e8f0f7', borderColor: colors.border }]}>

      {/* SVG grid layer – rendered behind everything */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width="100%" height="100%">
          {/* Grid lines */}
          {Array.from({ length: GRID_LINES + 1 }).map((_, i) => {
            const pos = `${(i / GRID_LINES) * 100}%`;
            return (
              <G key={`grid-${i}`}>
                <Line x1={pos} y1="0%" x2={pos} y2="100%" stroke={gridColor} strokeWidth="1" />
                <Line x1="0%" y1={pos} x2="100%" y2={pos} stroke={gridColor} strokeWidth="1" />
              </G>
            );
          })}

          {/* Simulated roads – two diagonal-ish thick lines */}
          <Line x1="0%" y1="50%" x2="100%" y2="45%" stroke={roadColor} strokeWidth="6" strokeLinecap="round" />
          <Line x1="30%" y1="0%" x2="35%" y2="100%" stroke={roadColor} strokeWidth="6" strokeLinecap="round" />
        </Svg>
      </View>

      {/* Location pin markers */}
      {MARKERS.map((m, i) => (
        <View
          key={i}
          style={[
            styles.markerWrap,
            { left: `${m.xRatio * 100}%`, top: `${m.yRatio * 100}%` },
          ]}
        >
          <View style={[
            styles.markerPin,
            { backgroundColor: m.primary ? colors.primary : colors.crowdMedium },
          ]}>
            <Ionicons
              name={m.primary ? 'location' : 'ellipse'}
              size={m.primary ? 14 : 8}
              color="#fff"
            />
          </View>
          {/* Tiny drop shadow dot */}
          <View style={[styles.markerShadow, { backgroundColor: m.primary ? colors.primary : colors.crowdMedium, opacity: 0.3 }]} />
        </View>
      ))}

      {/* Top-left badge */}
      <View style={[styles.badge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="navigate" size={12} color={colors.primary} />
        <Text style={[styles.badgeText, { color: colors.text }]}>
          {locationName || 'Nearby Locations'}
        </Text>
      </View>

      {/* Bottom-right coming-soon chip */}
      <View style={[styles.comingSoon, { backgroundColor: colors.primary }]}>
        <Text style={styles.comingSoonText}>Live Map · Coming Soon</Text>
      </View>
    </View>
  );
};

export default memo(MapPlaceholder);

const styles = StyleSheet.create({
  container: {
    borderRadius: spacing.borderRadius,
    overflow: 'hidden',
    borderWidth: 1,
    marginBottom: spacing.l,
    position: 'relative',
  },
  markerWrap: {
    position: 'absolute',
    alignItems: 'center',
    // Subtract half the pin size to center it on the coordinate
    marginLeft: -14,
    marginTop: -14,
  },
  markerPin: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  markerShadow: {
    width: 14,
    height: 6,
    borderRadius: 7,
    marginTop: -2,
  },
  badge: {
    position: 'absolute',
    top: spacing.s,
    left: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusPill,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: typography.tinySize + 1,
    fontWeight: typography.weights.bold,
  },
  comingSoon: {
    position: 'absolute',
    bottom: spacing.s,
    right: spacing.s,
    paddingHorizontal: spacing.s,
    paddingVertical: 4,
    borderRadius: spacing.borderRadiusPill,
  },
  comingSoonText: {
    color: '#fff',
    fontSize: typography.tinySize,
    fontWeight: typography.weights.bold,
  },
});
