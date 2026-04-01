// src/components/CustomInput.js

import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

export default function CustomInput({
  label,
  icon,
  error,
  secureTextEntry,
  style,
  ...props
}) {
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [hidePassword, setHidePassword] = useState(secureTextEntry);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={[styles.label, { color: colors.text }]}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        {
          borderColor: error 
            ? colors.error 
            : isFocused ? colors.primary : colors.border,
          backgroundColor: colors.surface,
          borderWidth: isFocused ? 2 : 1,
        }
      ]}>
        {icon && (
          <Ionicons 
            name={icon} 
            size={20} 
            color={colors.textSecondary} 
            style={styles.icon}
          />
        )}
        
        <TextInput
          style={[styles.input, { color: colors.text }]}
          autoCapitalize="none"
          secureTextEntry={hidePassword}
          placeholderTextColor={colors.textSecondary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
        
        {secureTextEntry && (
          <Ionicons 
            name={hidePassword ? 'eye-off-outline' : 'eye-outline'} 
            size={20} 
            color={colors.textSecondary} 
            style={styles.iconRight}
            onPress={() => setHidePassword(!hidePassword)}
          />
        )}
      </View>
      
      {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.s,
  },
  label: {
    fontSize: typography.smallSize + 1,
    marginBottom: spacing.xs + 2,
    fontWeight: typography.weights.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    height: 52,
    borderRadius: spacing.borderRadiusSmall,
    alignItems: 'center',
    paddingHorizontal: spacing.m,
  },
  icon: {
    marginRight: spacing.s,
  },
  iconRight: {
    marginLeft: spacing.s,
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: typography.bodySize + 1,
  },
  errorText: {
    fontSize: typography.tinySize + 1,
    marginTop: spacing.xs,
  }
});
