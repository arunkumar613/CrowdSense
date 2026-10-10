// src/components/PrimaryButton.js

import React, { useRef } from 'react';
import { Animated, TouchableWithoutFeedback, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export default function PrimaryButton({ 
  title, 
  onPress, 
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) {
  const { colors } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleValue, {
      toValue: 0.96,
      useNativeDriver: true,
      speed: 20,
      bounciness: 4
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || loading) return;
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
      bounciness: 6
    }).start();
  };

  const getBackgroundColor = () => {
    switch (variant) {
      case 'danger': return colors.error;
      case 'secondary': return colors.surface;
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary': return colors.text;
      default: return '#FFFFFF'; // Explicit white for CTA
    }
  };

  return (
    <TouchableWithoutFeedback 
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
    >
      <Animated.View style={[
        styles.container,
        { 
          backgroundColor: getBackgroundColor(), 
          transform: [{ scale: scaleValue }],
          borderColor: variant === 'secondary' ? colors.border : 'transparent',
          borderWidth: variant === 'secondary' ? 1 : 0,
        },
        disabled || loading ? styles.disabled : null,
        style
      ]}>
        {loading ? (
          <ActivityIndicator color={getTextColor()} />
        ) : (
          <View style={styles.contentRow}>
              {icon ? <Ionicons name={icon} size={20} color={getTextColor()} style={styles.icon} /> : null}
              <Text style={[
                styles.text, 
                { color: getTextColor(), fontWeight: typography.weights.bold }, 
                textStyle
              ]}>
                {title}
              </Text>
          </View>
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 54,
    borderRadius: spacing.borderRadius,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.s,
    flexDirection: 'row',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontSize: typography.bodySize + 1,
  },
  icon: {
    marginRight: spacing.s,
  },
  disabled: {
    opacity: 0.5,
  }
});
