// src/screens/Auth/SignUpScreen.js

import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../../config/firebase';
import { colors } from '../../theme/colors';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

export default function SignUpScreen({ navigation }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPriorityUser, setIsPriorityUser] = useState(false); // Can be a checkbox later
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!fullName || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      // NOTE: With fake config this will fail, 
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Save additional profile info in Firestore Users lookup collection
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: user.email,
        fullName: fullName,
        isPriorityUser: isPriorityUser, // Simulated feature flag for Senior/Women/Disabled
        createdAt: new Date().toISOString()
      });

    } catch (error) {
      console.error(error);
      Alert.alert('Registration Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.formContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to join Crowd Sense</Text>
          </View>

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
            placeholder="Create a password"
            icon="lock-closed-outline"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <CustomInput
            label="Confirm Password"
            placeholder="Confirm your password"
            icon="lock-closed-outline"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          {/* Simple toggle for Demo Priority Queue Access */}
          <TouchableOpacity 
            style={styles.priorityToggle}
            onPress={() => setIsPriorityUser(!isPriorityUser)}
          >
            <View style={[styles.checkbox, isPriorityUser && styles.checkboxActive]} />
            <Text style={styles.toggleText}>Request Priority Access (Senior/Disabled/Women)</Text>
          </TouchableOpacity>

          <CustomButton
            title="Sign Up"
            onPress={handleSignUp}
            loading={loading}
            style={styles.signupBtn}
          />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  formContainer: {
    padding: 24,
    justifyContent: 'center',
    marginTop: 40,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  priorityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 15,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSecondary,
  },
  signupBtn: {
    marginTop: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    marginBottom: 40,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  footerLink: {
    color: colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  }
});
