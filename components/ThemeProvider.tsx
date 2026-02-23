import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  theme: typeof MD3LightTheme;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    loadThemePreference();
  }, []);

  // Set navigation bar color based on theme
  useEffect(() => {
    if (Platform.OS === 'android') {
      const setNavigationBarColor = async () => {
        try {
          const backgroundColor = isDarkMode ? '#121212' : '#FFFFFF';
          const buttonStyle = isDarkMode ? 'light' : 'dark';

          await NavigationBar.setBackgroundColorAsync(backgroundColor);
          await NavigationBar.setButtonStyleAsync(buttonStyle);
        } catch (error) {
          console.warn('Error setting navigation bar color:', error);
        }
      };

      setNavigationBarColor();
    }
  }, [isDarkMode]);

  const loadThemePreference = async () => {
    try {
      const savedDarkMode = await AsyncStorage.getItem('dagster_dark_mode');
      if (savedDarkMode !== null) {
        setIsDarkMode(savedDarkMode === 'true');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const toggleDarkMode = async () => {
    try {
      const newDarkMode = !isDarkMode;
      setIsDarkMode(newDarkMode);
      await AsyncStorage.setItem('dagster_dark_mode', newDarkMode.toString());
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  // Create custom theme with Dagster+ font family
  const baseTheme = isDarkMode ? MD3DarkTheme : MD3LightTheme;
  
  const theme = {
    ...baseTheme,
    fonts: {
      ...baseTheme.fonts,
      // Apply Dagster+ font family to all font variants
      labelSmall: {
        ...baseTheme.fonts.labelSmall,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      labelMedium: {
        ...baseTheme.fonts.labelMedium,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      labelLarge: {
        ...baseTheme.fonts.labelLarge,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      bodySmall: {
        ...baseTheme.fonts.bodySmall,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      bodyMedium: {
        ...baseTheme.fonts.bodyMedium,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      bodyLarge: {
        ...baseTheme.fonts.bodyLarge,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      titleSmall: {
        ...baseTheme.fonts.titleSmall,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      titleMedium: {
        ...baseTheme.fonts.titleMedium,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      titleLarge: {
        ...baseTheme.fonts.titleLarge,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      headlineSmall: {
        ...baseTheme.fonts.headlineSmall,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      headlineMedium: {
        ...baseTheme.fonts.headlineMedium,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      headlineLarge: {
        ...baseTheme.fonts.headlineLarge,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      displaySmall: {
        ...baseTheme.fonts.displaySmall,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      displayMedium: {
        ...baseTheme.fonts.displayMedium,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
      displayLarge: {
        ...baseTheme.fonts.displayLarge,
        fontFamily: 'Geist, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", Icons16, sans-serif',
      },
    },
  };

  const value: ThemeContextType = {
    isDarkMode,
    toggleDarkMode,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 