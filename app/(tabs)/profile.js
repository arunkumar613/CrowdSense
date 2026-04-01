import React, { useContext, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Switch, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { AuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/hooks/useTheme';
import { spacing } from '../../src/theme/spacing';
import { typography } from '../../src/theme/typography';

import PrimaryButton from '../../src/components/PrimaryButton';
import LiveIndicator from '../../src/components/LiveIndicator';

// ─── Helper: derive two initials from a display name ─────────────────────────
function getInitials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (parts[0]?.[0] || 'U').toUpperCase();
}

// ─── Priority badge colours per type ─────────────────────────────────────────
const PRIORITY_COLORS = {
  'Senior Citizen':   '#8B5CF6', // violet
  'Woman':            '#EC4899', // pink
  'Differently Abled':'#F59E0B', // amber
};

// ─── Tappable setting row ─────────────────────────────────────────────────────
function SettingRow({ icon, title, value, rightElement, colors, isLast = false }) {
  return (
    <View style={[
      rowStyles.row,
      { borderBottomColor: colors.border },
      isLast && { borderBottomWidth: 0 },
    ]}>
      <View style={[rowStyles.iconWrap, { backgroundColor: colors.primaryLight }]}>
        <Ionicons name={icon} size={20} color={colors.primary} />
      </View>
      <View style={rowStyles.textWrap}>
        <Text style={[rowStyles.label, { color: colors.textSecondary }]}>{title}</Text>
        {value ? <Text style={[rowStyles.value, { color: colors.text }]}>{value}</Text> : null}
      </View>
      {rightElement}
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: spacing.m, paddingHorizontal: spacing.m,
    borderBottomWidth: 1,
  },
  iconWrap: {
    width: 38, height: 38, borderRadius: 11,
    alignItems: 'center', justifyContent: 'center', marginRight: spacing.m,
  },
  textWrap: { flex: 1 },
  label:  { fontSize: typography.smallSize, fontWeight: typography.weights.semiBold, marginBottom: 1 },
  value:  { fontSize: typography.bodySize,  fontWeight: typography.weights.bold },
});

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function Profile() {
  const router = useRouter();
  const { user, logout } = useContext(AuthContext);
  const { colors, isDarkMode, toggleTheme } = useTheme();

  // Entrance animation for the profile card
  const cardAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(cardAnim, { toValue: 1, duration: 450, useNativeDriver: true }).start();
  }, [cardAnim]);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of CrowdSense?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await logout();          // wipes AsyncStorage + nulls context
            router.replace('/(auth)/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  const initials     = getInitials(user?.name);
  const badgeColor   = PRIORITY_COLORS[user?.priorityType] || colors.crowdMedium;
  const priorityIcon =
    user?.priorityType === 'Senior Citizen'    ? 'person'         :
    user?.priorityType === 'Woman'             ? 'female'         :
    user?.priorityType === 'Differently Abled' ? 'accessibility'  : 'star';

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >

      {/* ── Profile hero card ─────────────────────────────────────────────── */}
      <Animated.View style={[
        styles.profileCard,
        { backgroundColor: colors.surface, borderBottomColor: colors.border },
        { opacity: cardAnim, transform: [{ translateY: cardAnim.interpolate({ inputRange: [0,1], outputRange: [-20,0] }) }] },
      ]}>

        {/* Avatar ring */}
        <View style={[styles.avatarRing, { borderColor: colors.primary + '40' }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>

        <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>

        {/* Priority badge */}
        {user?.isPriorityUser && (
          <View style={[styles.priorityBadge, { backgroundColor: badgeColor + '20', borderColor: badgeColor + '50', borderWidth: 1 }]}>
            <Ionicons name={priorityIcon} size={13} color={badgeColor} />
            <Text style={[styles.priorityText, { color: badgeColor }]}>
              {user.priorityType} · Priority Access
            </Text>
          </View>
        )}

        {/* App tagline */}
        <Text style={[styles.tagline, { color: colors.textSecondary }]}>
          Helping you navigate smarter
        </Text>

        <LiveIndicator label="Crowd data refreshes every 5s" />
      </Animated.View>

      {/* ── Account info ─────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon="person-outline"
            title="Full Name"
            value={user?.name}
            colors={colors}
          />
          <SettingRow
            icon="mail-outline"
            title="Email Address"
            value={user?.email}
            colors={colors}
            isLast
          />
        </View>
      </View>

      {/* ── Preferences ──────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <SettingRow
            icon={isDarkMode ? 'moon' : 'moon-outline'}
            title="Dark Mode"
            value={isDarkMode ? 'Enabled' : 'Disabled'}
            colors={colors}
            isLast
            rightElement={
              <Switch
                value={isDarkMode}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={isDarkMode ? '#fff' : '#fff'}
              />
            }
          />
        </View>
      </View>

      {/* ── Queue status (if priority user) ──────────────────────────────────── */}
      {user?.isPriorityUser && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Queue Privileges</Text>
          <View style={[styles.privilegeCard, { backgroundColor: badgeColor + '12', borderColor: badgeColor + '40' }]}>
            <Ionicons name="flash" size={24} color={badgeColor} style={{ marginBottom: spacing.s }} />
            <Text style={[styles.privilegeTitle, { color: badgeColor }]}>Priority Queue Access</Text>
            <Text style={[styles.privilegeDesc, { color: colors.textSecondary }]}>
              As a {user.priorityType}, you automatically skip to the front of virtual queues.
            </Text>
          </View>
        </View>
      )}

      {/* ── Sign out ─────────────────────────────────────────────────────────── */}
      <View style={styles.section}>
        <PrimaryButton
          title="Sign Out"
          variant="danger"
          onPress={handleLogout}
          icon="log-out-outline"
          style={styles.signOutBtn}
        />
        <Text style={[styles.signOutHint, { color: colors.textSecondary }]}>
          You will be returned to the login screen.
        </Text>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content:   { paddingBottom: spacing.xxl + spacing.l },

  // Profile hero
  profileCard: {
    alignItems: 'center',
    paddingHorizontal: spacing.l,
    paddingTop: spacing.xl,
    paddingBottom: spacing.l,
    borderBottomWidth: 1,
    marginBottom: spacing.l,
  },
  avatarRing: {
    width: 106, height: 106, borderRadius: 53,
    borderWidth: 3,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing.m,
  },
  avatar: {
    width: 94, height: 94, borderRadius: 47,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText:    { fontSize: 38, fontWeight: typography.weights.heavy, color: '#fff' },
  name:          { fontSize: typography.headerSize - 2, fontWeight: typography.weights.bold, marginBottom: 4 },
  email:         { fontSize: typography.bodySize, fontWeight: typography.weights.medium, marginBottom: spacing.m },
  priorityBadge: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.m, paddingVertical: 6,
    borderRadius: spacing.borderRadiusPill,
    marginBottom: spacing.m, gap: 6,
  },
  priorityText: { fontSize: typography.smallSize, fontWeight: typography.weights.bold },
  tagline:       { fontSize: typography.smallSize, fontWeight: typography.weights.medium, marginBottom: 4 },

  // Sections
  section:      { paddingHorizontal: spacing.m, marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: typography.tinySize + 1,
    fontWeight: typography.weights.heavy,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.m,
    marginLeft: spacing.xs,
  },
  card: {
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },

  // Privilege card
  privilegeCard: {
    borderRadius: spacing.borderRadius,
    borderWidth: 1,
    padding: spacing.l,
    alignItems: 'center',
  },
  privilegeTitle: { fontSize: typography.titleSize - 1, fontWeight: typography.weights.heavy, marginBottom: spacing.s },
  privilegeDesc:  { fontSize: typography.smallSize, textAlign: 'center', lineHeight: 20 },

  // Sign out
  signOutBtn:  { marginBottom: spacing.s },
  signOutHint: { textAlign: 'center', fontSize: typography.tinySize + 1, fontWeight: typography.weights.medium },
});
