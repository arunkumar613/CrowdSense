// src/components/CrowdIndicator.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

export default function CrowdIndicator({ 
  level,
  waitMinutes,
  showLabel = true,
  size = 'medium' 
}) {
  const getLevelColor = () => {
    switch (level?.toLowerCase()) {
      case 'low': return colors.crowdLow;
      case 'medium': return colors.crowdMedium;
      case 'high': return colors.crowdHigh;
      default: return colors.textSecondary;
    }
  };

  const dotSize = size === 'small' ? 8 : size === 'large' ? 16 : 12;
  const textSize = size === 'small' ? 12 : size === 'large' ? 16 : 14;

  return (
    <View style={styles.container}>
      <View style={[
        styles.dot, 
        { 
          backgroundColor: getLevelColor(),
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2
        }
      ]} />
      {showLabel ? (
        <Text style={[styles.text, { fontSize: textSize, color: getLevelColor() }]}>
          {level || 'Unknown'} Crowd
        </Text>
      ) : null}
      {waitMinutes !== undefined && waitMinutes > 0 ? (
        <View style={styles.waitContainer}>
          <Ionicons name="time-outline" size={textSize} color={colors.textSecondary} />
          <Text style={[styles.waitText, { fontSize: textSize }]}>
            {waitMinutes}m wait
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  dot: {
    marginRight: 6,
  },
  text: {
    fontWeight: '600',
  },
  waitContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: colors.border,
    paddingLeft: 10,
  },
  waitText: {
    color: colors.textSecondary,
    marginLeft: 4,
  }
});
