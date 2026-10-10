// src/data/locationDatasets.js
import { INITIAL_LOCATIONS as ANNA_NAGAR_LOCATIONS, INITIAL_QUEUES as ANNA_NAGAR_QUEUES } from './annaNagar';

// Helper: Haversine distance in kilometers
export function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Maps OpenStreetMap tags to CrowdSense place categories
function mapOsmTypeToAppType(element) {
  const tags = element.tags || {};
  
  if (tags.amenity === 'hospital' || tags.healthcare === 'hospital') return 'Hospital';
  if (tags.amenity === 'bank') return 'Bank';
  if (
    tags.amenity === 'bus_station' || 
    tags.amenity === 'bus_stop' || 
    tags.railway === 'station' || 
    tags.public_transport === 'station'
  ) return 'Transport';
  if (tags.amenity === 'library') return 'Library';
  if (tags.amenity === 'place_of_worship') return 'Temple';
  if (
    tags.amenity === 'townhall' || 
    tags.amenity === 'courthouse' || 
    tags.amenity === 'post_office' ||
    tags.amenity === 'police'
  ) return 'Gov';
  if (
    tags.amenity === 'restaurant' || 
    tags.amenity === 'cafe' || 
    tags.amenity === 'fast_food'
  ) return 'Restaurant';
  if (tags.leisure === 'park' || tags.leisure === 'garden') return 'Park';
  if (tags.shop === 'mall') return 'Mall';
  if (tags.shop === 'supermarket') return 'Grocery';
  
  // Fallbacks
  if (tags.amenity) {
    if (['restaurant', 'cafe', 'fast_food', 'bar', 'pub', 'food_court'].includes(tags.amenity)) return 'Restaurant';
    if (['hospital', 'clinic', 'dentist', 'doctors', 'pharmacy'].includes(tags.amenity)) return 'Hospital';
    if (['bus_station', 'bus_stop', 'taxi', 'ferry_terminal'].includes(tags.amenity)) return 'Transport';
    if (['place_of_worship', 'church', 'mosque', 'synagogue', 'temple', 'shrine'].includes(tags.amenity)) return 'Temple';
    if (['post_office', 'townhall', 'courthouse', 'police', 'fire_station', 'civic_building'].includes(tags.amenity)) return 'Gov';
  }
  if (tags.leisure && ['park', 'garden', 'recreation_ground', 'nature_reserve'].includes(tags.leisure)) return 'Park';
  if (tags.shop && ['mall', 'department_store'].includes(tags.shop)) return 'Mall';
  if (tags.shop && ['supermarket', 'convenience', 'grocery', 'deli'].includes(tags.shop)) return 'Grocery';

  return 'Other';
}

// Generate attributes like capacity, best times, wait time based on place type
function generatePlaceAttributes(type) {
  let maxCapacity = 100;
  let currentUsers = 40;
  let waitTime = 0;
  let priorityEnabled = false;
  let bestTimeStart = 9;
  let bestTimeEnd = 17;

  switch(type) {
    case 'Park':
      maxCapacity = Math.floor(Math.random() * 501) + 500; // 500-1000
      currentUsers = Math.floor(Math.random() * (maxCapacity * 0.7));
      waitTime = 0;
      priorityEnabled = false;
      bestTimeStart = 6;
      bestTimeEnd = 9;
      break;
    case 'Mall':
      maxCapacity = Math.floor(Math.random() * 1501) + 1500; // 1500-3000
      currentUsers = Math.floor(Math.random() * (maxCapacity * 0.9));
      waitTime = Math.floor(Math.random() * 51) + 10; // 10-60
      priorityEnabled = true;
      bestTimeStart = 11;
      bestTimeEnd = 14;
      break;
    case 'Hospital':
      maxCapacity = Math.floor(Math.random() * 351) + 150; // 150-500
      currentUsers = Math.floor(Math.random() * (maxCapacity * 0.95));
      waitTime = Math.floor(Math.random() * 46) + 15; // 15-60
      priorityEnabled = true;
      bestTimeStart = 8;
      bestTimeEnd = 11;
      break;
    case 'Bank':
      maxCapacity = Math.floor(Math.random() * 51) + 50; // 50-100
      currentUsers = Math.floor(Math.random() * (maxCapacity * 0.9));
      waitTime = Math.floor(Math.random() * 36) + 10; // 10-45
      priorityEnabled = true;
      bestTimeStart = 9;
      bestTimeEnd = 11;
      break;
    case 'Transport':
      maxCapacity = Math.floor(Math.random() * 4001) + 1000; // 1000-5000
      currentUsers = Math.floor(Math.random() * (maxCapacity * 0.9));
      waitTime = Math.floor(Math.random() * 26) + 5; // 5-30
      priorityEnabled = false;
      bestTimeStart = 7;
      bestTimeEnd = 9;
      break;
    case 'Temple':
      maxCapacity = Math.floor(Math.random() * 301) + 200; // 200-500
      currentUsers = Math.floor(Math.random() * (maxCapacity * 0.85));
      waitTime = Math.floor(Math.random() * 31) + 10; // 10-40
      priorityEnabled = true;
      bestTimeStart = 6;
      bestTimeEnd = 8;
      break;
    case 'Gov':
      maxCapacity = Math.floor(Math.random() * 71) + 80; // 80-150
      currentUsers = Math.floor(Math.random() * (maxCapacity * 0.95));
      waitTime = Math.floor(Math.random() * 71) + 20; // 20-90
      priorityEnabled = true;
      bestTimeStart = 9;
      bestTimeEnd = 12;
      break;
    case 'Grocery':
      maxCapacity = Math.floor(Math.random() * 101) + 100; // 100-200
      currentUsers = Math.floor(Math.random() * (maxCapacity * 0.8));
      waitTime = Math.floor(Math.random() * 16) + 5; // 5-20
      priorityEnabled = false;
      bestTimeStart = 10;
      bestTimeEnd = 12;
      break;
    case 'Restaurant':
      maxCapacity = Math.floor(Math.random() * 61) + 60; // 60-120
      currentUsers = Math.floor(Math.random() * (maxCapacity * 0.85));
      waitTime = Math.floor(Math.random() * 21) + 10; // 10-30
      priorityEnabled = false;
      bestTimeStart = 12;
      bestTimeEnd = 14;
      break;
    case 'Library':
      maxCapacity = Math.floor(Math.random() * 51) + 50; // 50-100
      currentUsers = Math.floor(Math.random() * (maxCapacity * 0.7));
      waitTime = 0;
      priorityEnabled = false;
      bestTimeStart = 10;
      bestTimeEnd = 17;
      break;
    default:
      maxCapacity = 100;
      currentUsers = 30;
      waitTime = 5;
      priorityEnabled = false;
      bestTimeStart = 9;
      bestTimeEnd = 17;
  }

  return { maxCapacity, currentUsers, waitTime, priorityEnabled, bestTimeStart, bestTimeEnd };
}

// Fetch real nearby places from OpenStreetMap Overpass API
export async function fetchRealNearbyPlaces(userLat, userLng) {
  // Query 3km radius around user coordinates for faster response
  const query = `
    [out:json][timeout:10];
    (
      node["amenity"~"hospital|bank|bus_station|bus_stop|library|place_of_worship|townhall|post_office|court_house|police|restaurant|cafe|fast_food"](around:3000, ${userLat}, ${userLng});
      way["amenity"~"hospital|bank|bus_station|bus_stop|library|place_of_worship|townhall|post_office|court_house|police|restaurant|cafe|fast_food"](around:3000, ${userLat}, ${userLng});
      node["leisure"~"park|garden"](around:3000, ${userLat}, ${userLng});
      way["leisure"~"park|garden"](around:3000, ${userLat}, ${userLng});
      node["shop"~"mall|supermarket"](around:3000, ${userLat}, ${userLng});
      way["shop"~"mall|supermarket"](around:3000, ${userLat}, ${userLng});
    );
    out center 50;
  `;

  const endpoints = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
  ];

  let responseData = null;
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      const url = `${endpoint}?data=${encodeURIComponent(query)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CrowdSenseApp'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }

      const json = await response.json();
      if (json && json.elements && json.elements.length > 0) {
        responseData = json.elements;
        break; // Successfully fetched
      }
    } catch (err) {
      console.warn(`Overpass fetch failed for endpoint ${endpoint}:`, err.message);
      lastError = err;
    }
  }

  if (!responseData) {
    throw lastError || new Error("No nearby places found from OpenStreetMap");
  }

  const locations = [];
  const queues = {};

  // Filter elements to ensure they have names and valid mapped types
  const validElements = responseData
    .map(element => {
      const type = mapOsmTypeToAppType(element);
      const name = element.tags?.name;
      const lat = element.lat || (element.center && element.center.lat);
      const lng = element.lon || (element.center && element.center.lng);
      return { element, type, name, lat, lng };
    })
    .filter(item => item.type !== 'Other' && item.name && item.lat && item.lng);

  if (validElements.length < 3) {
    throw new Error("Insufficient real nearby places found matching application categories");
  }

  // Sort by distance and take top 15 elements to avoid overwhelming UI
  const mappedPlaces = validElements
    .map(item => {
      const dist = getHaversineDistance(userLat, userLng, item.lat, item.lng);
      return { ...item, dist };
    })
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 15);

  mappedPlaces.forEach((item, index) => {
    const locId = `osm_${index + 1}`;
    const attrs = generatePlaceAttributes(item.type);
    
    locations.push({
      id: locId,
      name: item.name,
      type: item.type,
      distance: `${item.dist.toFixed(1)} km`,
      distanceValue: parseFloat(item.dist.toFixed(1)),
      maxCapacity: attrs.maxCapacity,
      currentUsers: attrs.currentUsers,
      waitTime: attrs.waitTime,
      priorityEnabled: attrs.priorityEnabled,
      bestTimeStart: attrs.bestTimeStart,
      bestTimeEnd: attrs.bestTimeEnd,
      lat: item.lat,
      lng: item.lng
    });

    if (attrs.waitTime > 0) {
      queues[locId] = {
        normal: Math.max(5, Math.floor(attrs.waitTime / 2)),
        priority: Math.max(0, Math.floor(attrs.waitTime / 10)),
        servingRate: Math.max(1, Math.min(5, Math.floor(Math.random() * 4) + 1))
      };
    }
  });

  return { locations, queues, isDemoData: false };
}

// Get the appropriate dataset for the user's location
export async function getDatasetForLocation(lat, lng) {
  // Try to fetch real nearby places from OpenStreetMap
  try {
    const osmDataset = await fetchRealNearbyPlaces(lat, lng);
    return osmDataset;
  } catch (err) {
    console.warn("OSM places fetch failed, using fallback Anna Nagar demo dataset:", err.message);
    
    // Fall back to predefined locations, recalculating distance if user is within 100km of Chennai
    const updatedLocations = ANNA_NAGAR_LOCATIONS.map(loc => {
      if (lat && lng) {
        const dist = getHaversineDistance(lat, lng, loc.lat, loc.lng);
        // Only show live distance if they are reasonably close to the demo coordinates
        if (dist < 100) {
          return {
            ...loc,
            distance: `${dist.toFixed(1)} km`,
            distanceValue: parseFloat(dist.toFixed(1))
          };
        }
      }
      return loc;
    });

    return { locations: updatedLocations, queues: ANNA_NAGAR_QUEUES, isDemoData: true };
  }
}
