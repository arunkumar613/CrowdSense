// src/screens/Main/AddUpdateScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { getLocations } from '../../services/mockDataService';
import CustomButton from '../../components/CustomButton';

const CROWD_LEVELS = [
  { id: 'low', label: 'Low', desc: 'Plenty of space, no wait', color: colors.crowdLow, icon: 'happy-outline' },
  { id: 'medium', label: 'Medium', desc: 'Busy but manageable', color: colors.crowdMedium, icon: 'alert-circle-outline' },
  { id: 'high', label: 'High', desc: 'Very packed, long waits', color: colors.crowdHigh, icon: 'warning-outline' }
];

export default function AddUpdateScreen({ navigation }) {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLocations = async () => {
      const data = await getLocations();
      setLocations(data);
    };
    fetchLocations();
  }, []);

  const handleSubmit = () => {
    if (!selectedLocation || !selectedLevel) {
      Alert.alert('Missing Info', 'Please select both a location and a crowd level.');
      return;
    }

    setLoading(true);
    // Simulate API call to Firebase Firestore to update location crowd level
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Success', 
        'Thank you for updating the crowd level!',
        [{ text: 'OK', onPress: () => {
          setSelectedLocation(null);
          setSelectedLevel(null);
          navigation.navigate('HomeTab');
        }}]
      );
    }, 1500);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.sectionTitle}>1. Select Location</Text>
      <View style={styles.optionsContainer}>
        {locations.map((loc) => (
          <TouchableOpacity
            key={loc.id}
            style={[
              styles.locationOption,
              selectedLocation?.id === loc.id && styles.selectedLocation
            ]}
            onPress={() => setSelectedLocation(loc)}
          >
            <View style={styles.radioOuter}>
              {selectedLocation?.id === loc.id && <View style={styles.radioInner} />}
            </View>
            <Text style={[
              styles.locationText,
              selectedLocation?.id === loc.id && styles.selectedText
            ]}>
              {loc.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>2. Crowd Level</Text>
      <View style={styles.levelsContainer}>
        {CROWD_LEVELS.map((level) => (
          <TouchableOpacity
            key={level.id}
            style={[
              styles.levelCard,
              { borderColor: level.color },
              selectedLevel?.id === level.id && { backgroundColor: level.color + '15' } // 15 is hex for 8% opacity appx
            ]}
            onPress={() => setSelectedLevel(level)}
          >
            <Ionicons name={level.icon} size={28} color={level.color} />
            <View style={styles.levelTextContainer}>
              <Text style={[styles.levelLabel, { color: level.color }]}>{level.label}</Text>
              <Text style={styles.levelDesc}>{level.desc}</Text>
            </View>
            <View style={styles.radioOuter}>
              {selectedLevel?.id === level.id && <View style={[styles.radioInner, { backgroundColor: level.color }]} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <CustomButton
        title="Submit Update"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitBtn}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
    marginTop: 10,
  },
  optionsContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  selectedLocation: {
    backgroundColor: colors.primary + '10', // mild tint
    borderRadius: 8,
  },
  radioOuter: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioInner: {
    height: 10,
    width: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  locationText: {
    fontSize: 16,
    color: colors.text,
  },
  selectedText: {
    fontWeight: 'bold',
    color: colors.primary,
  },
  levelsContainer: {
    marginBottom: 30,
  },
  levelCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
  },
  levelTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  levelDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  submitBtn: {
    marginTop: 10,
  }
});
