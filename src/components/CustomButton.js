// src/components/CustomButton.js

import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function CustomButton({ 
  title, 
  onPress, 
  variant = 'primary', // 'primary' | 'secondary' | 'danger'
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon
}) {

  const getBackgroundColor = () => {
    switch (variant) {
      case 'danger': return colors.error;
      case 'secondary': return colors.background;
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary': return colors.text;
      default: return colors.white;
    }
  };

  const baseContainerStyle = [
    styles.container,
    { backgroundColor: getBackgroundColor() },
    disabled || loading ? styles.disabled : null,
    style
  ];

  return (
    <TouchableOpacity 
      onPress={onPress} 
      disabled={disabled || loading}
      style={baseContainerStyle}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} />
      ) : (
        <>
            {icon ? <Ionicons name={icon} size={20} color={getTextColor()} style={styles.icon} /> : null}
            <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
              {title}
            </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    flexDirection: 'row',
    ...colors.shadowLight,
  },
  text: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.6,
  }
});
