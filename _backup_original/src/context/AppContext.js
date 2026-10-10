// src/context/AppContext.js

import React, { createContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { INITIAL_LOCATIONS, INITIAL_QUEUES } from '../data/annaNagar';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [locations, setLocations] = useState(INITIAL_LOCATIONS);
  const [activeQueue, setActiveQueue] = useState(null);
  const [globalQueues, setGlobalQueues] = useState(INITIAL_QUEUES);

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
  }), [locations, activeQueue, getCrowdLevel, getCrowdTrend, getBestTime, joinQueue, leaveQueue]);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};
