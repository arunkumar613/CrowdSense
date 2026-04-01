// src/screens/Main/ProfileScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from 'firebase/auth';
import { auth } from '../../../config/firebase';
import { colors } from '../../theme/colors';
import CustomButton from '../../components/CustomButton';

// Mock fetching user profile details
const fetchUserProfile = () => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        fullName: 'Jane Doe',
        email: auth.currentUser?.email || 'jane@example.com',
        isPriorityUser: true,
        memberSince: 'March 2024'
      });
    }, 500);
  });
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile().then(data => {
      setProfile(data);
      setLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        try {
          await signOut(auth);
        } catch (error) {
          console.error("Logout err", error);
        }
      }}
    ]);
  };

  const renderSettingRow = (icon, title, value) => (
    <View style={styles.settingRow}>
      <View style={styles.settingIconContainer}>
        <Ionicons name={icon} size={22} color={colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {profile?.fullName?.charAt(0) || 'U'}
          </Text>
        </View>
        <Text style={styles.name}>{profile?.fullName || 'User'}</Text>
        <Text style={styles.email}>{profile?.email}</Text>
        
        {profile?.isPriorityUser && (
          <View style={styles.priorityBadge}>
            <Ionicons name="star" size={14} color={colors.white} />
            <Text style={styles.priorityText}>Priority Account</Text>
          </View>
        )}
      </View>

      <View style={styles.settingsContainer}>
        <Text style={styles.sectionTitle}>Account Information</Text>
        <View style={styles.settingsCard}>
          {renderSettingRow('person-outline', 'Full Name', profile?.fullName)}
          <View style={styles.divider} />
          {renderSettingRow('mail-outline', 'Email Address', profile?.email)}
          <View style={styles.divider} />
          {renderSettingRow('calendar-outline', 'Member Since', profile?.memberSince)}
        </View>

        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow}>
            <View style={styles.settingIconContainer}>
              <Ionicons name="notifications-outline" size={22} color={colors.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <CustomButton
          title="Logout"
          variant="secondary"
          onPress={handleLogout}
          style={styles.logoutBtn}
          textStyle={{ color: colors.error }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  profileCard: {
    backgroundColor: colors.white,
    padding: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.white,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 5,
  },
  email: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 15,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.crowdMedium,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  priorityText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 6,
  },
  settingsContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 10,
    marginTop: 15,
    marginLeft: 5,
  },
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
  },
  settingIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '500',
  },
  settingValue: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 65, // Aligns with the content
  },
  logoutBtn: {
    marginTop: 30,
  }
});
