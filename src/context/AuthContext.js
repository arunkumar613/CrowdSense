// src/context/AuthContext.js

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check storage on init
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@CrowdSense:user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to load user from async storage", e);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email, password) => {
    try {
      const storedLocalUsers = await AsyncStorage.getItem('@CrowdSense:registeredUsers');
      let registeredUsers = storedLocalUsers ? JSON.parse(storedLocalUsers) : [];

      const existingUser = registeredUsers.find(u => u.email === email && u.password === password);

      if (existingUser) {
        const sessionUser = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          isPriorityUser: existingUser.isPriorityUser,
          priorityType: existingUser.priorityType,
        };
        await AsyncStorage.setItem('@CrowdSense:user', JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { success: true };
      } else {
        return { success: false, error: 'Invalid email or password.' };
      }
    } catch (e) {
      return { success: false, error: 'Login error occurred.' };
    }
  };

  const signup = async (name, email, password, priorityData) => {
    try {
      const storedLocalUsers = await AsyncStorage.getItem('@CrowdSense:registeredUsers');
      let registeredUsers = storedLocalUsers ? JSON.parse(storedLocalUsers) : [];

      if (registeredUsers.some(u => u.email === email)) {
        return { success: false, error: 'Email already exists.' };
      }

      const newUser = {
        id: Date.now().toString(),
        name,
        email,
        password, 
        isPriorityUser: priorityData.isPriority,
        priorityType: priorityData.type,
      };

      registeredUsers.push(newUser);
      await AsyncStorage.setItem('@CrowdSense:registeredUsers', JSON.stringify(registeredUsers));

      const sessionUser = {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        isPriorityUser: newUser.isPriorityUser,
        priorityType: newUser.priorityType,
      };
      
      await AsyncStorage.setItem('@CrowdSense:user', JSON.stringify(sessionUser));
      setUser(sessionUser);

      return { success: true };
    } catch (e) {
      return { success: false, error: 'Signup error occurred.' };
    }
  };

  const logout = async () => {
    try {
      // Forcefully remove first
      await AsyncStorage.removeItem('@CrowdSense:user');
      // Then nullify state causing an immediate re-render
      setUser(null);
    } catch (e) {
      console.error('Logout Exception:', e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
