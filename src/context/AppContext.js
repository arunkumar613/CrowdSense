// src/context/AppContext.js

import React, { createContext, useState, useEffect, useCallback, useMemo, useRef, useContext } from 'react';
import { INITIAL_LOCATIONS, INITIAL_QUEUES } from '../data/annaNagar';
import { AuthContext } from './AuthContext';
import * as Location from 'expo-location';
import { getDatasetForLocation } from '../data/locationDatasets';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [activeQueue, setActiveQueue] = useState(null);
  const [globalQueues, setGlobalQueues] = useState(INITIAL_QUEUES);

  const { user } = useContext(AuthContext);
  const [detectedLocationName, setDetectedLocationName] = useState("Anna Nagar, Chennai");
  const [locationSource, setLocationSource] = useState("default");
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [isDemoData, setIsDemoData] = useState(true);
  const [manuallySelectedLocation, setManuallySelectedLocation] = useState(null);
  const [currentCoordinates, setCurrentCoordinates] = useState({ lat: 13.0850, lng: 80.2101 });
  const [gpsCoordinates, setGpsCoordinates] = useState(null);

  // Stores last-tick user counts for trend calculation { [id]: number }
  const prevUsersRef = useRef({});

  // Memoized crowd level calculator
  const getCrowdLevel = useCallback((current, max) => {
    const percentage = (current / max) * 100;
    if (percentage < 40) return { label: 'Low',    color: 'green',  code: '#10B981' };
    if (percentage < 75) return { label: 'Medium', color: 'yellow', code: '#F59E0B' };
    return                      { label: 'High',   color: 'red',    code: '#EF4444' };
  }, []);

  // Returns 'up' | 'down' | 'stable' compared to the previous tick
  const getCrowdTrend = useCallback((locationId, currentUsers) => {
    const prev = prevUsersRef.current[locationId];
    if (prev === undefined) return 'stable';
    if (currentUsers > prev)  return 'up';
    if (currentUsers < prev)  return 'down';
    return 'stable';
  }, []);

  // Returns a human-readable best time string for a location
  const getBestTime = useCallback((location) => {
    if (!location.bestTimeStart) return null;
    const fmt = (h) => {
      const suffix = h >= 12 ? 'PM' : 'AM';
      const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${hr}${suffix}`;
    };
    return `${fmt(location.bestTimeStart)} – ${fmt(location.bestTimeEnd)}`;
  }, []);

  const detectLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      // 1. Request foreground location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      // 2. Get current position
      const currentPos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      if (!currentPos || !currentPos.coords) {
        throw new Error('Failed to retrieve GPS coordinates');
      }

      const { latitude, longitude } = currentPos.coords;
      setGpsCoordinates({ latitude, longitude });

      let address = null;

      // 3. Try native Expo reverse geocoding first
      try {
        const geocoded = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (geocoded && geocoded.length > 0) {
          address = geocoded[0];
        }
      } catch (expoGeocodeErr) {
        console.log("Expo native reverse geocoding failed, trying OpenStreetMap:", expoGeocodeErr.message);
      }

      // 4. Fallback to OpenStreetMap Nominatim reverse geocoding (crucial for web)
      if (!address) {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'CrowdSenseApp'
              }
            }
          );
          if (response.ok) {
            const data = await response.json();
            if (data && data.address) {
              const addr = data.address;
              address = {
                district: addr.suburb || addr.neighbourhood || addr.quarter || addr.subregion,
                city: addr.city || addr.town || addr.village || addr.municipality,
                region: addr.state || addr.province,
                country: addr.country,
                name: addr.road || addr.pedestrian || addr.amenity
              };
            }
          }
        } catch (osmGeocodeErr) {
          console.warn("OpenStreetMap Nominatim geocoding failed:", osmGeocodeErr.message);
        }
      }

      if (address) {
        // Prioritize neighbourhood, suburb, locality, village, quarter, district, and then city
        const locality = address.neighbourhood || address.suburb || address.locality || address.village || address.quarter || address.district;
        const city = address.city || address.town || address.subregion || address.region;
        const countryPart = address.country;

        let displayName = "";
        if (locality && city && locality !== city) {
          displayName = `${locality}, ${city}`;
        } else if (locality) {
          displayName = locality;
        } else if (city) {
          displayName = city;
        } else {
          displayName = countryPart || "Detected Location";
        }

        // Fetch/generate location-specific dataset
        const dataset = await getDatasetForLocation(latitude, longitude);
        if (dataset) {
          setLocations(dataset.locations);
          setGlobalQueues(dataset.queues);
          setDetectedLocationName(displayName);
          setLocationSource('gps');
          setIsDemoData(dataset.isDemoData ?? false);
          setCurrentCoordinates({ lat: latitude, lng: longitude });
        } else {
          throw new Error('No nearby places found, using default dataset');
        }
      } else {
        throw new Error('Reverse geocoding failed, using default dataset');
      }
    } catch (err) {
      console.warn("Location-aware setup failed, using fallback:", err.message);
      setLocationError(err.message);
      
      // Graceful fallback to default Anna Nagar dataset
      const defaultDataset = await getDatasetForLocation(13.0850, 80.2101);
      if (defaultDataset) {
        setLocations(defaultDataset.locations);
        setGlobalQueues(defaultDataset.queues);
      } else {
        setLocations(INITIAL_LOCATIONS);
        setGlobalQueues(INITIAL_QUEUES);
      }
      setDetectedLocationName("Anna Nagar, Chennai");
      setLocationSource('default');
      setIsDemoData(true);
      setCurrentCoordinates({ lat: 13.0850, lng: 80.2101 });
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const selectLocationManually = useCallback(async (lat, lng, displayName) => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      const manualLoc = { lat, lng, displayName };
      await AsyncStorage.setItem('@CrowdSense:manualLocation', JSON.stringify(manualLoc));
      setManuallySelectedLocation(manualLoc);

      const dataset = await getDatasetForLocation(lat, lng);
      setLocations(dataset.locations);
      setGlobalQueues(dataset.queues);
      setDetectedLocationName(displayName);
      setLocationSource('manual');
      setIsDemoData(dataset.isDemoData ?? false);
      setCurrentCoordinates({ lat, lng });
    } catch (err) {
      console.warn("Manual location switch failed:", err.message);
      setLocationError("Failed to switch location: " + err.message);
    } finally {
      setIsLoadingLocation(false);
    }
  }, []);

  const restoreGpsLocation = useCallback(async () => {
    try {
      await AsyncStorage.removeItem('@CrowdSense:manualLocation');
      setManuallySelectedLocation(null);
      await detectLocation();
    } catch (err) {
      console.warn("Restoring GPS location failed:", err.message);
      setLocationError("Failed to restore GPS location");
    }
  }, [detectLocation]);

  const resetToDefault = useCallback(() => {
    setLocations(INITIAL_LOCATIONS);
    setActiveQueue(null);
    setGlobalQueues(INITIAL_QUEUES);
    setDetectedLocationName("Anna Nagar, Chennai");
    setLocationSource("default");
    setIsDemoData(true);
    setLocationError(null);
    setIsLoadingLocation(false);
    setManuallySelectedLocation(null);
    setCurrentCoordinates({ lat: 13.0850, lng: 80.2101 });
    setGpsCoordinates(null);
  }, []);

  const restoreLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    setLocationError(null);
    try {
      const stored = await AsyncStorage.getItem('@CrowdSense:manualLocation');
      if (stored) {
        const parsed = JSON.parse(stored);
        setManuallySelectedLocation(parsed);
        const dataset = await getDatasetForLocation(parsed.lat, parsed.lng);
        setLocations(dataset.locations);
        setGlobalQueues(dataset.queues);
        setDetectedLocationName(parsed.displayName);
        setLocationSource('manual');
        setIsDemoData(dataset.isDemoData ?? false);
        setCurrentCoordinates({ lat: parsed.lat, lng: parsed.lng });
      } else {
        await detectLocation();
      }
    } catch (err) {
      console.warn("Restoring manual location failed:", err.message);
      await detectLocation();
    } finally {
      setIsLoadingLocation(false);
    }
  }, [detectLocation]);

  useEffect(() => {
    if (user) {
      restoreLocation();
    } else {
      resetToDefault();
    }
  }, [user, restoreLocation, resetToDefault]);

  // Background simulation: ticks every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setLocations(prevLocations => {
        const next = prevLocations.map(loc => {
          const shift = Math.floor(Math.random() * 11) - 5; // –5 to +5
          let newCurrent = Math.min(loc.maxCapacity, Math.max(0, loc.currentUsers + shift));
          let newWaitTime = loc.waitTime;
          if (shift > 3 && loc.waitTime > 0)  newWaitTime = Math.min(loc.waitTime + 2, 120);
          if (shift < -3 && loc.waitTime > 0) newWaitTime = Math.max(loc.waitTime - 2, 0);

          // Record previous value for trend
          prevUsersRef.current[loc.id] = loc.currentUsers;

          return { ...loc, currentUsers: newCurrent, waitTime: newWaitTime };
        });
        return next;
      });

      // Queue advancement simulation
      setActiveQueue(prev => {
        if (!prev) return null;
        const advance = Math.random() > 0.5;
        if (advance && prev.position > 1) {
          return {
            ...prev,
            position: prev.position - 1,
            totalInQueue: Math.max(prev.position - 1, prev.totalInQueue - 1),
            estWaitMinutes: Math.max(0, prev.estWaitMinutes - 2),
          };
        }
        return prev;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Join a location's virtual queue
  const joinQueue = useCallback((locationId, userProfile) => {
    const loc = locations.find(l => l.id === locationId);
    if (!loc) return;

    setGlobalQueues(prev => {
      const gq = prev[locationId] || { normal: 10, priority: 0, servingRate: 3 };
      const nextGq = { ...gq };
      let assignedPosition, expectedWait;

      if (userProfile?.isPriorityUser) {
        assignedPosition = gq.priority + 1;
        expectedWait = Math.round(assignedPosition * gq.servingRate);
        nextGq.priority += 1;
      } else {
        assignedPosition = gq.priority + gq.normal + 1;
        expectedWait = Math.round(assignedPosition * gq.servingRate);
        nextGq.normal += 1;
      }

      setActiveQueue({
        locationId,
        locationName: loc.name,
        position: assignedPosition,
        totalInQueue: nextGq.priority + nextGq.normal,
        estWaitMinutes: expectedWait,
        joinedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isPriority: userProfile?.isPriorityUser ?? false,
      });

      return { ...prev, [locationId]: nextGq };
    });
  }, [locations]);

  const leaveQueue = useCallback(() => setActiveQueue(null), []);

  const contextValue = useMemo(() => ({
    locations,
    activeQueue,
    getCrowdLevel,
    getCrowdTrend,
    getBestTime,
    joinQueue,
    leaveQueue,
    detectedLocationName,
    locationSource,
    isLoadingLocation,
    locationError,
    detectLocation,
    isDemoData,
    manuallySelectedLocation,
    selectLocationManually,
    restoreGpsLocation,
    currentCoordinates,
    gpsCoordinates,
  }), [
    locations,
    activeQueue,
    getCrowdLevel,
    getCrowdTrend,
    getBestTime,
    joinQueue,
    leaveQueue,
    detectedLocationName,
    locationSource,
    isLoadingLocation,
    locationError,
    detectLocation,
    isDemoData,
    manuallySelectedLocation,
    selectLocationManually,
    restoreGpsLocation,
    currentCoordinates,
    gpsCoordinates,
  ]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
