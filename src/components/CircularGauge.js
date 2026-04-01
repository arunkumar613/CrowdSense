// src/components/CircularGauge.js
// Circular arc gauge using react-native-svg with smooth Animated fill

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../hooks/useTheme';
import { typography } from '../theme/typography';

// Wrap the SVG Circle so it can accept Animated props
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * CircularGauge
 * @param {number} percentage  – 0 to 100
 * @param {string} label       – e.g. "Low Crowd"
 * @param {number} size        – diameter in dp (default 160)
 * @param {number} strokeWidth – ring thickness (default 14)
 */
export default function CircularGauge({ percentage = 0, label = '', size = 160, strokeWidth = 14 }) {
  const { colors } = useTheme();
  const animatedValue = useRef(new Animated.Value(0)).current;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animate whenever percentage changes
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: percentage,
      duration: 900,
      useNativeDriver: false, // strokeDashoffset is a layout prop — cannot use native driver
    }).start();
  }, [percentage]);

  // Interpolate dashoffset from animated value
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
    extrapolate: 'clamp',
  });

  // Color logic
  const gaugeColor =
    percentage < 40 ? colors.crowdLow :
    percentage < 75 ? colors.crowdMedium :
    colors.crowdHigh;

  const cx = size / 2;
  const cy = size / 2;

  return (
    <View style={styles.wrapper}>
      <Svg width={size} height={size}>
        <Defs>
          {/* Subtle gradient on the active arc */}
          <LinearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor={gaugeColor} stopOpacity="0.7" />
            <Stop offset="100%" stopColor={gaugeColor} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Background track */}
        <Circle
          cx={cx}
          cy={cy}
          r={radius}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated foreground arc — starts from the top (−90°) */}
        <AnimatedCircle
          cx={cx}
          cy={cy}
          r={radius}
          stroke="url(#gaugeGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          // Rotate so 0% starts at the 12-o'clock position
          rotation="-90"
          origin={`${cx}, ${cy}`}
        />
      </Svg>

      {/* Center label overlay */}
      <View style={[styles.centerLabel, { width: size, height: size }]}>
        <Text style={[styles.percentageText, { color: gaugeColor }]}>
          {percentage}%
        </Text>
        <Text style={[styles.crowdLabel, { color: gaugeColor }]}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontSize: 32,
    fontWeight: typography.weights.heavy,
    lineHeight: 36,
  },
  crowdLabel: {
    fontSize: typography.smallSize,
    fontWeight: typography.weights.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
  },
});
