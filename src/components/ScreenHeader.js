// src/components/ScreenHeader.js

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const ScreenHeader = ({ title, subtitle, rightElement }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement && (
        <View style={styles.rightElement}>
          {rightElement}
        </View>
      )}
    </View>
  );
};

export default memo(ScreenHeader);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.m,
    paddingTop: spacing.l,
    paddingBottom: spacing.s,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.headerSize,
    fontWeight: typography.weights.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.bodySize,
    marginTop: 4,
  },
  rightElement: {
    marginLeft: spacing.m,
  }
});
