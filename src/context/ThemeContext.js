// src/context/ThemeContext.js

import React, { createContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightColors, darkColors } from '../theme/colors';

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('@CrowdSense:theme');
        if (storedTheme === 'dark') {
          setIsDarkMode(true);
        }
      } catch (e) {
        console.error("Failed to load theme", e);
      } finally {
        setLoading(false);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    try {
      const newMode = !isDarkMode;
      setIsDarkMode(newMode);
      await AsyncStorage.setItem('@CrowdSense:theme', newMode ? 'dark' : 'light');
    } catch (e) {
      console.error("Failed to save theme", e);
    }
  };

  const colors = useMemo(() => isDarkMode ? darkColors : lightColors, [isDarkMode]);

  // Avoid heavy flashes while initially loading from storage
  if (loading) return null;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, colors }}>
      {children}
    </ThemeContext.Provider>
  );
};
