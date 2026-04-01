// src/services/mockDataService.js
// In a real app, you would fetch these from Firestore. We'll simulate that for now.

export const MOCK_LOCATIONS = [
  {
    id: "loc_1",
    name: "College Canteen",
    type: "Canteen",
    crowdLevel: "High", // High | Medium | Low
    waitMinutes: 15,
    distanceKm: 0.1,
    coordinates: { lat: 12.9716, lng: 77.5946 }, 
  },
  {
    id: "loc_2",
    name: "Central Library",
    type: "Library",
    crowdLevel: "Low",
    waitMinutes: 0,
    distanceKm: 0.3,
    coordinates: { lat: 12.9719, lng: 77.5949 },
  },
  {
    id: "loc_3",
    name: "Main Bus Stop",
    type: "Transport",
    crowdLevel: "Medium",
    waitMinutes: 5,
    distanceKm: 0.5,
    coordinates: { lat: 12.9722, lng: 77.5952 },
  },
  {
    id: "loc_4",
    name: "City Hospital",
    type: "Hospital",
    crowdLevel: "High",
    waitMinutes: 45,
    distanceKm: 1.2,
    coordinates: { lat: 12.9730, lng: 77.5960 },
  },
  {
    id: "loc_5",
    name: "State Bank Branch",
    type: "Bank",
    crowdLevel: "Medium",
    waitMinutes: 10,
    distanceKm: 0.8,
    coordinates: { lat: 12.9725, lng: 77.5955 },
  },
  {
    id: "loc_6",
    name: "South Campus Canteen",
    type: "Canteen",
    crowdLevel: "Low",
    waitMinutes: 2,
    distanceKm: 0.4,
    coordinates: { lat: 12.9712, lng: 77.5940 }, // Smart Alternative for loc_1
  }
];

// Mocks reading from Firestore (or uses static data if Firebase isn't configured)
export const getLocations = async () => {
    // Simulate network delay
    return new Promise(resolve => setTimeout(() => resolve(MOCK_LOCATIONS), 800));
}

// Simulates smart alternative calculation based on a high-crowded location type
export const getAlternativeLocations = (targetType, excludeId) => {
    return MOCK_LOCATIONS.filter(
        loc => loc.type === targetType && loc.id !== excludeId && loc.crowdLevel !== "High"
    ).sort((a,b) => {
        // Simple sort: prefer lower wait time
        return a.waitMinutes - b.waitMinutes;
    });
}
