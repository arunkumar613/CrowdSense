import React, { useState, useContext, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView,
  Platform, TouchableOpacity, Alert, ScrollView, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import { spacing } from '../../src/theme/spacing';

import CustomInput  from '../../src/components/CustomInput';
import CustomButton from '../../src/components/CustomButton';

const PRIORITY_TYPES = [
  { key: 'None',              label: 'None',              icon: 'person-outline'    },
  { key: 'Senior Citizen',    label: 'Senior Citizen',    icon: 'people-outline'    },
  { key: 'Woman',             label: 'Woman',             icon: 'female-outline'    },
  { key: 'Differently Abled', label: 'Differently Abled', icon: 'accessibility'     },
];

// Priority colour map — same as profile screen
const PRIORITY_COLORS = {
  'Senior Citizen':   '#8B5CF6',
  'Woman':            '#EC4899',
  'Differently Abled':'#F59E0B',
};

export default function SignUpScreen() {
  const router = useRouter();
  const { signup } = useContext(AuthContext);
  const { colors } = useTheme();

  const [fullName,         setFullName]         = useState('');
  const [email,            setEmail]            = useState('');
  const [password,         setPassword]         = useState('');
  const [confirmPassword,  setConfirmPassword]  = useState('');
  const [priorityType,     setPriorityType]     = useState('None');
  const [loading,          setLoading]          = useState(false);

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const handleSignUp = async () => {
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Passwords do not match. Please check and try again.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const result = await signup(fullName.trim(), email.trim(), password, {
      isPriority: priorityType !== 'None',
      type: priorityType,
    });
    setLoading(false);

    if (result.success) {
      router.replace('/(tabs)');
    } else {
      Alert.alert('Registration Failed', result.error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ opacity: fadeAnim }}>

          {/* Back button */}
          <TouchableOpacity
            onPress={() => router.back()}
            style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            hitSlop={spacing.hitSlop}
          >
            <Ionicons name="arrow-back" size={22} color={colors.text} />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join CrowdSense — navigate smarter
            </Text>
          </View>

          {/* Form card */}
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <CustomInput
              label="Full Name"
              placeholder="Enter your full name"
              icon="person-outline"
              value={fullName}
              onChangeText={setFullName}
            />
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
              placeholder="Create a password (min 6 chars)"
              icon="lock-closed-outline"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <CustomInput
              label="Confirm Password"
              placeholder="Repeat your password"
              icon="shield-checkmark-outline"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
          </View>

          {/* Priority Access section */}
          <View style={[styles.prioritySection, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.prioritySectionHeader}>
              <Ionicons name="star" size={18} color={colors.primary} />
              <Text style={[styles.prioritySectionTitle, { color: colors.text }]}>
                Priority Queue Access
              </Text>
            </View>
            <Text style={[styles.prioritySectionDesc, { color: colors.textSecondary }]}>
              Select your category to skip ahead in virtual queues.
            </Text>

            <View style={styles.priorityGrid}>
              {PRIORITY_TYPES.map(p => {
                const isActive = priorityType === p.key;
                const accentColor = PRIORITY_COLORS[p.key] || colors.primary;
                return (
                  <TouchableOpacity
                    key={p.key}
                    style={[
                      styles.priorityChip,
                      {
                        borderColor:       isActive ? accentColor : colors.border,
                        backgroundColor:   isActive ? accentColor + '18' : colors.background,
                      },
                    ]}
                    onPress={() => setPriorityType(p.key)}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name={p.icon}
                      size={16}
                      color={isActive ? accentColor : colors.textSecondary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[
                      styles.priorityChipText,
                      { color: isActive ? accentColor : colors.textSecondary, fontWeight: isActive ? '800' : '500' },
                    ]}>
                      {p.label}
                    </Text>
                    {isActive ? (
                      <Ionicons name="checkmark-circle" size={15} color={accentColor} style={{ marginLeft: 4 }} />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* CTA */}
          <CustomButton
            title="Create Account"
            onPress={handleSignUp}
            loading={loading}
            style={styles.btn}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              {"Already have an account? "}
              <Text style={[styles.footerLink, { color: colors.primary }]} onPress={() => router.back()}>
                Login
              </Text>
            </Text>
          </View>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1 },
  scrollContent:{ padding: spacing.l, paddingTop: spacing.xl, paddingBottom: spacing.xxl },

  backBtn: {
    width: 42, height: 42, borderRadius: 12, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.l,
  },

  header:   { marginBottom: spacing.l },
  title:    { fontSize: 30, fontWeight: '900', letterSpacing: -0.5, marginBottom: 6 },
  subtitle: { fontSize: 15, fontWeight: '500' },

  card: {
    borderRadius: spacing.borderRadius, borderWidth: 1,
    padding: spacing.m, marginBottom: spacing.m,
  },

  // Priority section
  prioritySection: {
    borderRadius: spacing.borderRadius, borderWidth: 1,
    padding: spacing.m, marginBottom: spacing.l,
  },
  prioritySectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6,
  },
  prioritySectionTitle: { fontSize: 15, fontWeight: '800' },
  prioritySectionDesc:  { fontSize: 13, marginBottom: spacing.m, lineHeight: 18 },
  priorityGrid:         { gap: spacing.s },
  priorityChip: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.m, paddingVertical: 10,
    borderRadius: spacing.borderRadiusSmall + 2, borderWidth: 1.5,
  },
  priorityChipText: { fontSize: 14 },

  btn:      { marginBottom: spacing.m },
  footer:   { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.s },
  footerText:{ fontSize: 14 },
  footerLink:{ fontSize: 14, fontWeight: '800' },
});
