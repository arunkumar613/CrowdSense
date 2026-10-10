// src/components/EmptyState.js
// Animated empty state with optional action button

import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

/**
 * EmptyState
 * @param {string}   iconName      – Ionicons name
 * @param {string}   title         – Bold heading
 * @param {string}   message       – Descriptive body text
 * @param {string}   [actionLabel] – Optional CTA button label
 * @param {function} [onAction]    – Callback when CTA tapped
 */
const EmptyState = ({ iconName, title, message, actionLabel, onAction }) => {
  const { colors } = useTheme();

  // Entrance: fade + slide up from 24px
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 500, delay: 100, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, delay: 100, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Icon circle */}
      <View style={[styles.iconRing, { borderColor: colors.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: colors.overlay }]}>
          <Ionicons name={iconName} size={52} color={colors.textSecondary} />
        </View>
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text>

      {/* Optional action button */}
      {actionLabel && onAction ? (
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: colors.primaryLight, borderColor: colors.primary + '40', borderWidth: 1 }]}
          onPress={onAction}
          activeOpacity={0.75}
        >
          <Text style={[styles.actionText, { color: colors.primary }]}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
};

export default memo(EmptyState);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: spacing.xxl,
  },
  // Double-ring effect: outer border ring + inner filled circle
  iconRing: {
    width: 128,
    height: 128,
    borderRadius: 64,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.l,
  },
  iconWrap: {
    width: 108,
    height: 108,
    borderRadius: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.titleSize,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
    marginBottom: spacing.s,
    letterSpacing: -0.3,
  },
  message: {
    fontSize: typography.bodySize,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: typography.weights.medium,
    maxWidth: 280,
  },
  actionBtn: {
    marginTop: spacing.l,
    paddingHorizontal: spacing.l,
    paddingVertical: spacing.s + 2,
    borderRadius: spacing.borderRadiusPill,
  },
  actionText: {
    fontSize: typography.bodySize - 1,
    fontWeight: typography.weights.bold,
  },
});
