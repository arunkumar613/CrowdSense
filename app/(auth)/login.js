import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert, Animated, Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import { spacing } from '../../src/theme/spacing';

import CustomInput  from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const { colors } = useTheme();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Fields', 'Please enter your email and password.');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    setLoading(false);
    if (result.success) {
      router.replace('/(tabs)');        // ✅ Fixed: was /(tabs)/home
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <Animated.View style={[styles.inner, { opacity: fadeAnim }]}>

        {/* Brand header */}
        <View style={styles.header}>
          <View style={[styles.logoRing, { borderColor: colors.primary + '30' }]}>
            <View style={[styles.logoDot, { backgroundColor: colors.primary }]}>
              <Text style={styles.logoIcon}>📍</Text>
            </View>
          </View>
          <Text style={[styles.appName, { color: colors.primary }]}>CrowdSense</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Smart crowd awareness for everyone
          </Text>
        </View>

        {/* Form card */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.formTitle, { color: colors.text }]}>Welcome back</Text>

          <CustomInput
            label="Email Address"
            placeholder="Enter your email"
            icon="mail-outline"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
          <CustomInput
            label="Password"
            placeholder="Enter your password"
            icon="lock-closed-outline"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <TouchableOpacity style={styles.forgot}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <CustomButton
            title="Login"
            onPress={handleLogin}
            loading={loading}
            style={styles.btn}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Sign Up</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner:     { flex: 1, padding: spacing.l, justifyContent: 'center' },

  // Brand header
  header:  { alignItems: 'center', marginBottom: spacing.xl },
  logoRing: {
    width: 86, height: 86, borderRadius: 43, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center', marginBottom: spacing.m,
  },
  logoDot: {
    width: 68, height: 68, borderRadius: 34,
    alignItems: 'center', justifyContent: 'center',
  },
  logoIcon:  { fontSize: 30 },
  appName:   { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, marginBottom: 4 },
  subtitle:  { fontSize: 14, fontWeight: '500', textAlign: 'center' },

  // Form card
  card: {
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    padding: spacing.l,
    marginBottom: spacing.l,
  },
  formTitle: { fontSize: 20, fontWeight: '800', marginBottom: spacing.m },
  forgot:    { alignItems: 'flex-end', marginTop: 4, marginBottom: spacing.m },
  forgotText:{ fontSize: 13, fontWeight: '600' },
  btn:       { marginTop: 4 },

  // Footer
  footer:    { flexDirection: 'row', justifyContent: 'center' },
  footerText:{ fontSize: 14 },
  footerLink:{ fontSize: 14, fontWeight: '800' },
});
