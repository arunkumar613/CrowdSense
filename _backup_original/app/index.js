import React, { useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useRouter, useRootNavigationState } from 'expo-router';
import { AuthContext } from '../src/context/AuthContext';

// ─── Brand colours inlined (ThemeContext not yet mounted here) ────────────────
const BRAND_BG   = '#0A1628';
const BRAND_BLUE = '#0A84FF';

export default function Index() {
  const { user, loading } = useContext(AuthContext);
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();

  // Entrance animations for the splash content
  const logoAnim  = useRef(new Animated.Value(0)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate logo scale in, then fade tagline
    Animated.sequence([
      Animated.spring(logoAnim,  { toValue: 1, speed: 5, bounciness: 10, useNativeDriver: true }),
      Animated.timing(fadeAnim,  { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, [logoAnim, fadeAnim]);

  useEffect(() => {
    if (!rootNavigationState?.key) return;
    if (!loading) {
      // Small delay so the splash doesn't feel like a flash
      const t = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)');
        } else {
          router.replace('/(auth)/login');
        }
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [user, loading, rootNavigationState]);

  return (
    <View style={styles.container}>

      {/* Logo */}
      <Animated.View style={[styles.logoWrap, { transform: [{ scale: logoAnim }] }]}>
        <Image
          source={require('../assets/images/crowdsense-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* App name + tagline */}
      <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
        <Text style={styles.appName}>CrowdSense</Text>
        <Text style={styles.tagline}>Smart crowd awareness for everyone</Text>
      </Animated.View>

      {/* Bottom "Powered by" note */}
      <Animated.View style={[styles.bottomNote, { opacity: fadeAnim }]}>
        <View style={[styles.dot, { backgroundColor: BRAND_BLUE }]} />
        <Text style={styles.bottomText}>Real-time · Anna Nagar, Chennai</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    marginBottom: 28,
    // Soft glow ring
    shadowColor: BRAND_BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 32,
    elevation: 12,
  },
  logo: {
    width: 130,
    height: 130,
    borderRadius: 28,
  },
  appName: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 15,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  bottomNote: {
    position: 'absolute',
    bottom: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bottomText: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.35)',
  },
});
