// src/components/InteractiveMap.native.js
import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import MapView, { Marker, Callout, PROVIDER_DEFAULT } from 'react-native-maps';

function InteractiveMap({ locations, center, gpsLocation, activeLocationId, onSelectLocationId, gpsTrigger, fitAllTrigger }) {
  const mapRef = useRef(null);
  const lastAnimatedCenterRef = useRef({ lat: center.lat, lng: center.lng });
  const lastAnimatedLocationIdRef = useRef(null);
  const hasManuallyMovedRef = useRef(false);
  
  // Store initial region in a stable state to prevent MapView camera resets on re-render
  const [initialMapRegion] = useState({
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  const [currentRegion, setCurrentRegion] = useState({
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  });

  // Keep track of region changes and user manual movements
  const handleRegionChangeComplete = useCallback((region, gesture) => {
    setCurrentRegion(region);
    // If the region change was driven by user swipe/zoom gesture, set the manual flag to block auto-centering
    if (gesture && gesture.isGesture) {
      hasManuallyMovedRef.current = true;
    }
  }, []);

  // Recenter map ONLY when coordinates actually change to a completely new area (user selected city/location)
  useEffect(() => {
    const hasChanged = 
      Math.abs(lastAnimatedCenterRef.current.lat - center.lat) > 0.0001 ||
      Math.abs(lastAnimatedCenterRef.current.lng - center.lng) > 0.0001;

    if (hasChanged && mapRef.current) {
      lastAnimatedCenterRef.current = { lat: center.lat, lng: center.lng };
      hasManuallyMovedRef.current = false; // Reset manual flag on explicit location change
      mapRef.current.animateToRegion({
        latitude: center.lat,
        longitude: center.lng,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02
      }, 1000);
    }
  }, [center]);

  // Animate to selected card ONLY ONCE when selection changes
  useEffect(() => {
    if (activeLocationId && activeLocationId !== lastAnimatedLocationIdRef.current && mapRef.current) {
      const activeLoc = locations.find(l => l.id === activeLocationId);
      if (activeLoc) {
        lastAnimatedLocationIdRef.current = activeLocationId;
        hasManuallyMovedRef.current = false; // Reset manual flag on explicit place focus
        mapRef.current.animateToRegion({
          latitude: activeLoc.lat,
          longitude: activeLoc.lng,
          latitudeDelta: 0.012,
          longitudeDelta: 0.012
        }, 800);
      }
    } else if (!activeLocationId) {
      lastAnimatedLocationIdRef.current = null;
    }
  }, [activeLocationId, locations]);

  // Center on user location trigger
  useEffect(() => {
    if (gpsTrigger > 0 && gpsLocation && mapRef.current) {
      hasManuallyMovedRef.current = false; // Reset manual flag on explicit GPS center request
      mapRef.current.animateToRegion({
        latitude: gpsLocation.latitude,
        longitude: gpsLocation.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015
      }, 1000);
    }
  }, [gpsTrigger, gpsLocation]);

  // Fit all markers trigger
  useEffect(() => {
    if (fitAllTrigger > 0 && locations.length > 0 && mapRef.current) {
      hasManuallyMovedRef.current = false; // Reset manual flag on explicit Fit All request
      const coordinates = locations.map(l => ({ latitude: l.lat, longitude: l.lng }));
      if (gpsLocation) {
        coordinates.push({ latitude: gpsLocation.latitude, longitude: gpsLocation.longitude });
      }
      mapRef.current.fitToCoordinates(coordinates, {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true
      });
    }
  }, [fitAllTrigger, locations, gpsLocation]);

  // Simple JS clustering algorithm
  const getClusters = useCallback(() => {
    const zoomLevel = currentRegion.latitudeDelta;
    
    // Only cluster if zoomed out significantly
    if (zoomLevel < 0.035) {
      return locations.map(p => ({ ...p, isCluster: false }));
    }

    const clusterSize = zoomLevel * 0.25; // threshold
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < locations.length; i++) {
      if (visited.has(locations[i].id)) continue;
      
      const p1 = locations[i];
      visited.add(p1.id);
      
      const clusterMembers = [p1];

      for (let j = i + 1; j < locations.length; j++) {
        if (visited.has(locations[j].id)) continue;
        const p2 = locations[j];
        
        const distLat = Math.abs(p1.lat - p2.lat);
        const distLng = Math.abs(p1.lng - p2.lng);
        
        if (distLat < clusterSize && distLng < clusterSize) {
          clusterMembers.push(p2);
          visited.add(p2.id);
        }
      }

      if (clusterMembers.length > 1) {
        const avgLat = clusterMembers.reduce((sum, m) => sum + m.lat, 0) / clusterMembers.length;
        const avgLng = clusterMembers.reduce((sum, m) => sum + m.lng, 0) / clusterMembers.length;
        
        clusters.push({
          id: `cluster_${p1.id}`,
          isCluster: true,
          lat: avgLat,
          lng: avgLng,
          count: clusterMembers.length,
          name: `${clusterMembers.length} places`,
        });
      } else {
        clusters.push({ ...p1, isCluster: false });
      }
    }

    return clusters;
  }, [locations, currentRegion]);

  const clusters = getClusters();

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_DEFAULT}
        style={styles.map}
        initialRegion={initialMapRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* User Current GPS Location indicator */}
        {gpsLocation ? (
          <Marker
            key="user_gps_marker"
            coordinate={{ latitude: gpsLocation.latitude, longitude: gpsLocation.longitude }}
            title="Your Location"
          >
            <View style={styles.gpsDotOuter}>
              <View style={styles.gpsDotInner} />
            </View>
          </Marker>
        ) : null}

        {clusters.map(place => {
          if (place.isCluster) {
            return (
              <Marker
                key={place.id}
                coordinate={{ latitude: place.lat, longitude: place.lng }}
                onPress={() => {
                  if (mapRef.current) {
                    mapRef.current.animateToRegion({
                      latitude: place.lat,
                      longitude: place.lng,
                      latitudeDelta: currentRegion.latitudeDelta / 2,
                      longitudeDelta: currentRegion.longitudeDelta / 2
                    }, 500);
                  }
                }}
              >
                <View style={styles.clusterBadge}>
                  <Text style={styles.clusterText}>{place.count}</Text>
                </View>
              </Marker>
            );
          }

          const crowdPercent = (place.currentUsers / place.maxCapacity) * 100;
          let pinColor = '#10B981'; // Green
          if (crowdPercent >= 40 && crowdPercent < 75) pinColor = '#F59E0B'; // Yellow
          if (crowdPercent >= 75) pinColor = '#EF4444'; // Red

          const isActive = place.id === activeLocationId;

          return (
            <Marker
              key={place.id}
              coordinate={{ latitude: place.lat, longitude: place.lng }}
              onPress={() => {
                if (onSelectLocationId) onSelectLocationId(place.id);
              }}
            >
              <View style={[
                styles.markerCircle, 
                { 
                  backgroundColor: pinColor, 
                  borderColor: '#FFFFFF',
                  transform: [{ scale: isActive ? 1.35 : 1.0 }]
                }
              ]}>
                <Text style={styles.markerLetter}>{place.name.substring(0, 1)}</Text>
              </View>

              <Callout tooltip={false} style={styles.calloutContainer}>
                <View style={styles.calloutContent}>
                  <Text style={styles.calloutName} numberOfLines={1}>{place.name}</Text>
                  <View style={styles.calloutRow}>
                    <Text style={styles.calloutLabel}>Category:</Text>
                    <Text style={styles.calloutValue}>{place.type}</Text>
                  </View>
                  <View style={styles.calloutRow}>
                    <Text style={styles.calloutLabel}>Crowd Level:</Text>
                    <Text style={[styles.calloutValue, { color: pinColor, fontWeight: '700' }]}>
                      {crowdPercent.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.calloutRow}>
                    <Text style={styles.calloutLabel}>Distance:</Text>
                    <Text style={styles.calloutValue}>{place.distance}</Text>
                  </View>
                  <View style={styles.calloutRow}>
                    <Text style={styles.calloutLabel}>Wait Time:</Text>
                    <Text style={styles.calloutValue}>{place.waitTime} mins</Text>
                  </View>
                </View>
              </Callout>
            </Marker>
          );
        })}
      </MapView>
    </View>
  );
}

// Custom memoization to prevent re-renders when parent states update unrelated properties
export default memo(InteractiveMap, (prevProps, nextProps) => {
  return (
    prevProps.activeLocationId === nextProps.activeLocationId &&
    prevProps.gpsTrigger === nextProps.gpsTrigger &&
    prevProps.fitAllTrigger === nextProps.fitAllTrigger &&
    prevProps.center.lat === nextProps.center.lat &&
    prevProps.center.lng === nextProps.center.lng &&
    prevProps.gpsLocation?.latitude === nextProps.gpsLocation?.latitude &&
    prevProps.gpsLocation?.longitude === nextProps.gpsLocation?.longitude &&
    prevProps.locations === nextProps.locations
  );
});

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  clusterBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A84FF',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  clusterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
  },
  markerLetter: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gpsDotOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(10, 132, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsDotInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0A84FF',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  calloutContainer: {
    width: 180,
    padding: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  calloutContent: {
    gap: 2,
  },
  calloutName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  calloutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calloutLabel: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
  },
  calloutValue: {
    fontSize: 10,
    color: '#374151',
    fontWeight: '600',
  }
});
