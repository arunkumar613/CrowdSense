// src/theme/colors.js

const sharedColors = {
  primary: '#0A84FF', // Professional vibrant blue
  primaryLight: 'rgba(10, 132, 255, 0.15)', // Soft blue background for chips/priority
  
  // Crowd & Traffic Levels
  crowdLow: '#10B981', // Emerald Green (0-40%)
  crowdMedium: '#F59E0B', // Amber Yellow (40-75%)
  crowdHigh: '#EF4444', // Red (75-100%)

  // Semantic
  error: '#EF4444',
  success: '#10B981',
  white: '#FFFFFF',
  black: '#000000',
  
  // Elevation base logic
  shadowLight: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  shadowMedium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  }
};

export const lightColors = {
  ...sharedColors,
  background: '#F9FAFB', // Cool off-white background
  surface: '#FFFFFF', // Clean White cards
  text: '#111827', // Crisp dark reading text
  textSecondary: '#6B7280', // Soft grey text
  border: '#E5E7EB',
  overlay: 'rgba(0, 0, 0, 0.03)', // Subtle hover/fill states
  
  // Dark mode shadows need to be different or non-existent
  shadow: sharedColors.shadowMedium,
};

export const darkColors = {
  ...sharedColors,
  background: '#111827', // Dark charcoal/slate
  surface: '#1F2937', // Slightly lighter slate for cards
  text: '#F9FAFB', // Light text
  textSecondary: '#9CA3AF', // Muted light text
  border: '#374151', // Subtle dark border
  overlay: 'rgba(255, 255, 255, 0.05)',
  
  // Shadows are tricky in dark mode, often just borders are better
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
};

// Fallback legacy export to prevent immediate crashes before full manual refactor
export const colors = lightColors;
