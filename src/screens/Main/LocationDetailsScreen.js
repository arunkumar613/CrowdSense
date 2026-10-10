// src/screens/Main/LocationDetailsScreen.js

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { getAlternativeLocations } from '../../services/mockDataService';

import CrowdIndicator from '../../components/CrowdIndicator';
import CustomButton from '../../components/CustomButton';
import LocationCard from '../../components/LocationCard';

export default function LocationDetailsScreen({ route, navigation }) {
  const { location, locationName } = route.params;
  const [loading, setLoading] = useState(true);
  const [joiningQueue, setJoiningQueue] = useState(false);
  const [alternatives, setAlternatives] = useState([]);

  useEffect(() => {
    // If crowd is high, check for smart alternatives
    if (location.crowdLevel === 'High') {
      const alts = getAlternativeLocations(location.type, location.id);
      setAlternatives(alts);
    }
    setLoading(false);
  }, [location]);

  const handleJoinQueue = () => {
    setJoiningQueue(true);
    // Simulate API call to join queue
    setTimeout(() => {
      setJoiningQueue(false);
      Alert.alert(
        'Queue Joined',
        `You are now in the virtual queue for ${location.name}. You will be notified when it's your turn.`,
        [{ text: 'View Queue', onPress: () => navigation.navigate('Queue') }]
      );
    }, 1200);
  };

  const getHeaderColor = () => {
    switch(location.crowdLevel?.toLowerCase()) {
      case 'low': return colors.crowdLow;
      case 'medium': return colors.crowdMedium;
      case 'high': return colors.crowdHigh;
      default: return colors.primary;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryCard}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>{location.name}</Text>
          <Text style={styles.type}>{location.type}</Text>
        </View>
        
        <View style={styles.statusRow}>
          <View style={[styles.statusBox, { borderLeftColor: getHeaderColor() }]}>
            <Text style={styles.statusLabel}>Current Crowd</Text>
            <CrowdIndicator level={location.crowdLevel} size="large" />
          </View>
          <View style={[styles.statusBox, { borderLeftColor: colors.primary }]}>
            <Text style={styles.statusLabel}>Est. Wait Time</Text>
            <View style={styles.waitTimeRow}>
              <Ionicons name="time" size={20} color={colors.text} />
              <Text style={styles.waitTimeVal}>{location.waitMinutes} mins</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.actionSection}>
        <Text style={styles.sectionHeader}>Virtual Queue</Text>
        <Text style={styles.descText}>
          Avoid standing in line. Join the virtual queue and we'll hold your spot.
        </Text>
        <CustomButton
          title="Join Queue Now"
          onPress={handleJoinQueue}
          loading={joiningQueue}
          icon="walk-outline"
        />
      </View>

      {location.crowdLevel === 'High' && alternatives.length > 0 ? (
        <View style={styles.alternativesSection}>
          <View style={styles.altHeader}>
            <Ionicons name="bulb-outline" size={24} color={colors.crowdMedium} />
            <Text style={styles.sectionHeaderAlt}>Smart Alternatives</Text>
          </View>
          <Text style={styles.descText}>
            This location is currently very crowded. Consider these nearby options with lower wait times:
          </Text>
          
          {alternatives.map((alt) => (
            <LocationCard 
              key={alt.id} 
              location={alt} 
              onPress={() => navigation.push('LocationDetails', { location: alt, locationName: alt.name })}
            />
          ))}
        </View>
      ) : null}

      {location.crowdLevel === 'High' && alternatives.length === 0 ? (
        <View style={styles.noAlternativesSection}>
            <Text style={styles.noAltsText}>No similar less-crowded alternatives found nearby.</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  headerRow: {
    marginBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  type: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    textTransform: 'uppercase',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statusBox: {
    flex: 1,
    borderLeftWidth: 4,
    paddingLeft: 12,
  },
  statusLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  waitTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitTimeVal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 6,
  },
  actionSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 15,
  },
  alternativesSection: {
    marginTop: 10,
  },
  altHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionHeaderAlt: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginLeft: 8,
  },
  noAlternativesSection: {
    padding: 15,
    backgroundColor: colors.surface,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  noAltsText: {
    color: colors.textSecondary,
    fontStyle: 'italic',
  }
});
