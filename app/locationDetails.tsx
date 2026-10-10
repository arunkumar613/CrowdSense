import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function LocationDetails() {

  const { location, locationName } = useLocalSearchParams();

  const parsedLocation = location ? JSON.parse(location) : null;

  return (
    <View style={styles.container}>
      
      <Text style={styles.title}>
        {locationName}
      </Text>

      {parsedLocation ? (
        <>
          <Text style={styles.info}>
            Type: {parsedLocation.type}
          </Text>

          <Text style={styles.info}>
            Crowd Level: {parsedLocation.crowdLevel}
          </Text>

          <Text style={styles.info}>
            Wait Time: {parsedLocation.waitTime || "5-10 mins"}
          </Text>
        </>
      ) : null}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#fff"
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20
  },
  info: {
    fontSize: 16,
    marginBottom: 10
  }
});