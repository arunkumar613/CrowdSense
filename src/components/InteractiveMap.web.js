// src/components/InteractiveMap.web.js
import React, { useEffect, useRef, useState, memo, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

function InteractiveMap({ locations, center, gpsLocation, activeLocationId, onSelectLocationId, gpsTrigger, fitAllTrigger }) {
  const containerRef = useRef(null);
  const leafletMap = useRef(null);
  const markersRef = useRef({});
  const gpsMarkerRef = useRef(null);
  const lastAnimatedCenterRef = useRef({ lat: center.lat, lng: center.lng });
  const lastAnimatedLocationIdRef = useRef(null);
  const hasManuallyMovedRef = useRef(false);
  const [zoomLevel, setZoomLevel] = useState(14);

  // Store all changing props in a mutable ref to prevent stale closures and avoid triggering re-mounts
  const propsRef = useRef({ locations, activeLocationId, onSelectLocationId, gpsLocation });
  useEffect(() => {
    propsRef.current = { locations, activeLocationId, onSelectLocationId, gpsLocation };
  });

  // 1. Clustering helper
  const getClusters = useCallback(() => {
    const { locations: currentLocs } = propsRef.current;
    const latDelta = 360 / Math.pow(2, zoomLevel);
    
    if (zoomLevel > 13) {
      return currentLocs.map(p => ({ ...p, isCluster: false }));
    }

    const clusterSize = latDelta * 0.15; // Cluster range size
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < currentLocs.length; i++) {
      if (visited.has(currentLocs[i].id)) continue;

      const p1 = currentLocs[i];
      visited.add(p1.id);
      const clusterMembers = [p1];

      for (let j = i + 1; j < currentLocs.length; j++) {
        if (visited.has(currentLocs[j].id)) continue;
        const p2 = currentLocs[j];

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
          count: clusterMembers.length
        });
      } else {
        clusters.push({ ...p1, isCluster: false });
      }
    }

    return clusters;
  }, [zoomLevel]);

  // 2. Markers rendering helper (Incremental in-place updates)
  const updateMarkers = useCallback(() => {
    const map = leafletMap.current;
    if (!map || !window.L) return;
    const L = window.L;

    const { activeLocationId: activeId, onSelectLocationId: onSelect, gpsLocation: gpsLoc } = propsRef.current;
    const clusters = getClusters();
    const activeIds = new Set(clusters.map(c => c.id));

    // Remove markers that are no longer active
    Object.keys(markersRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Clear and redraw user GPS marker
    if (gpsMarkerRef.current) {
      gpsMarkerRef.current.remove();
      gpsMarkerRef.current = null;
    }

    if (gpsLoc) {
      const gpsIcon = L.divIcon({
        className: 'gps-user-marker',
        html: `<div style="background-color: rgba(10, 132, 255, 0.25); width: 20px; height: 20px; border-radius: 10px; display: flex; align-items: center; justify-content: center;"><div style="background-color: #0A84FF; width: 10px; height: 10px; border-radius: 5px; border: 1.5px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);"></div></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      gpsMarkerRef.current = L.marker([gpsLoc.latitude, gpsLoc.longitude], { icon: gpsIcon })
        .addTo(map)
        .bindPopup("<b>Your Location</b>");
    }

    // Add or update place markers in-place
    clusters.forEach(place => {
      if (place.isCluster) {
        const html = `<div style="background-color: #0A84FF; width: 32px; height: 32px; border-radius: 16px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; cursor: pointer;">${place.count}</div>`;
        const clusterIcon = L.divIcon({
          className: 'custom-cluster-badge',
          html,
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        if (markersRef.current[place.id]) {
          markersRef.current[place.id].setIcon(clusterIcon);
        } else {
          const marker = L.marker([place.lat, place.lng], { icon: clusterIcon }).addTo(map);
          marker.on('click', () => {
            map.setView([place.lat, place.lng], map.getZoom() + 1);
          });
          markersRef.current[place.id] = marker;
        }
      } else {
        const crowdPercent = (place.currentUsers / place.maxCapacity) * 100;
        let pinColor = '#10B981'; // Green
        if (crowdPercent >= 40 && crowdPercent < 75) pinColor = '#F59E0B'; // Yellow
        if (crowdPercent >= 75) pinColor = '#EF4444'; // Red

        const isActive = place.id === activeId;
        const size = isActive ? 30 : 24;
        const halfSize = size / 2;

        const html = `<div style="background-color: ${pinColor}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: ${isActive ? 12 : 10}px; transition: all 0.2s ease; cursor: pointer;">${place.name.substring(0, 1)}</div>`;
        
        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px; min-width: 160px; line-height: 1.4;">
            <h4 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 800; color: #111827; max-width: 155px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${place.name}</h4>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px;">
              <span style="color: #6B7280; font-weight: 500;">Category:</span>
              <span style="font-weight: 600; color: #374151;">${place.type}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px;">
              <span style="color: #6B7280; font-weight: 500;">Crowd Level:</span>
              <span style="font-weight: 700; color: ${pinColor};">${crowdPercent.toFixed(0)}%</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 2px; font-size: 10px;">
              <span style="color: #6B7280; font-weight: 500;">Distance:</span>
              <span style="font-weight: 600; color: #374151;">${place.distance}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 10px;">
              <span style="color: #6B7280; font-weight: 500;">Wait Time:</span>
              <span style="font-weight: 600; color: #374151;">${place.waitTime} mins</span>
            </div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-place-marker',
          html,
          iconSize: [size, size],
          iconAnchor: [halfSize, halfSize]
        });

        if (markersRef.current[place.id]) {
          markersRef.current[place.id].setIcon(icon);
          markersRef.current[place.id].setPopupContent(popupContent);
        } else {
          const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
          marker.bindPopup(popupContent);
          marker.on('click', () => {
            if (onSelect) onSelect(place.id);
          });
          markersRef.current[place.id] = marker;
        }
      }
    });
  }, [getClusters]);

  // 3. Load Leaflet dynamically ONCE on mounting
  useEffect(() => {
    let isMounted = true;
    
    const initMapInstance = () => {
      if (!containerRef.current || leafletMap.current || !window.L) return;

      const L = window.L;
      const map = L.map(containerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([lastAnimatedCenterRef.current.lat, lastAnimatedCenterRef.current.lng], 14);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
      
      // Listen to manual drag/zoom gestures to lock camera movements
      map.on('dragstart', () => {
        hasManuallyMovedRef.current = true;
      });
      map.on('zoomstart', () => {
        hasManuallyMovedRef.current = true;
        setZoomLevel(map.getZoom());
      });
      map.on('zoomend', () => {
        setZoomLevel(map.getZoom());
      });

      leafletMap.current = map;
      updateMarkers();
    };

    const loadLeaflet = () => {
      if (window.L) {
        if (isMounted) initMapInstance();
        return;
      }

      // Add CSS stylesheet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Add JS script
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => {
        if (isMounted) initMapInstance();
      };
      document.head.appendChild(script);
    };

    loadLeaflet();

    return () => {
      isMounted = false;
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run ONLY ONCE when component mounts

  // 4. Update center coordinates ONLY when they actually change (selected location switched)
  useEffect(() => {
    const map = leafletMap.current;
    if (!map) return;

    const hasChanged = 
      Math.abs(lastAnimatedCenterRef.current.lat - center.lat) > 0.0001 ||
      Math.abs(lastAnimatedCenterRef.current.lng - center.lng) > 0.0001;

    if (hasChanged) {
      lastAnimatedCenterRef.current = { lat: center.lat, lng: center.lng };
      hasManuallyMovedRef.current = false; // Reset manual flag on explicit location change
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center]);

  // 5. Fly to active marker coordinates and open details popup ONLY ONCE
  useEffect(() => {
    const map = leafletMap.current;
    if (!map || !activeLocationId) {
      if (!activeLocationId) lastAnimatedLocationIdRef.current = null;
      return;
    }

    if (activeLocationId !== lastAnimatedLocationIdRef.current) {
      const activePlace = locations.find(l => l.id === activeLocationId);
      if (activePlace) {
        lastAnimatedLocationIdRef.current = activeLocationId;
        hasManuallyMovedRef.current = false; // Reset manual flag on explicit place focus
        map.flyTo([activePlace.lat, activePlace.lng], 15, { animate: true, duration: 1.0 });
        
        setTimeout(() => {
          const marker = markersRef.current[activeLocationId];
          if (marker && typeof marker.openPopup === 'function') {
            marker.openPopup();
          }
        }, 1050);
      }
    }
  }, [activeLocationId, locations]);

  // 6. Center on user location trigger
  useEffect(() => {
    const map = leafletMap.current;
    if (gpsTrigger > 0 && gpsLocation && map) {
      hasManuallyMovedRef.current = false; // Reset manual flag on explicit GPS center request
      map.flyTo([gpsLocation.latitude, gpsLocation.longitude], 15, { animate: true, duration: 1.0 });
    }
  }, [gpsTrigger, gpsLocation]);

  // 7. Fit all bounds trigger
  useEffect(() => {
    const map = leafletMap.current;
    if (fitAllTrigger > 0 && locations.length > 0 && map && window.L) {
      hasManuallyMovedRef.current = false; // Reset manual flag on explicit Fit All request
      const bounds = locations.map(l => [l.lat, l.lng]);
      if (gpsLocation) {
        bounds.push([gpsLocation.latitude, gpsLocation.longitude]);
      }
      map.fitBounds(bounds, { padding: [50, 50], animate: true, duration: 1.0 });
    }
  }, [fitAllTrigger, locations, gpsLocation]);

  // 8. Re-render markers on locations/zoom/active state change
  useEffect(() => {
    updateMarkers();
  }, [locations, zoomLevel, activeLocationId, gpsLocation, updateMarkers]);

  return (
    <View style={styles.container}>
      <div 
        ref={containerRef} 
        style={{ width: '100%', height: '100%', borderRadius: 12, overflow: 'hidden' }} 
      />
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
  }
});
