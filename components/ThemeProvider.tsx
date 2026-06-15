import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform, useColorScheme } from 'react-native';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_PREFERENCE_KEY = 'dagster_theme_preference';
// Legacy binary key kept for one-way migration; written by older builds where
// the only choice was on/off.
const LEGACY_DARK_MODE_KEY = 'dagster_dark_mode';

interface ThemeContextType {
  themePreference: ThemePreference;
  setThemePreference: (pref: ThemePreference) => void;
  isDarkMode: boolean;
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
  const [themePreference, setThemePreferenceState] = useState<ThemePreference>('system');
  // Re-renders when the OS switches themes, so the resolved theme stays in sync.
  const systemColorScheme = useColorScheme();
  const isDarkMode =
    themePreference === 'dark' ||
    (themePreference === 'system' && systemColorScheme === 'dark');

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
      const saved = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setThemePreferenceState(saved);
        return;
      }
      // One-time migration from the legacy on/off key. Treat any explicit
      // legacy choice as an explicit modern choice (so we don't surprise the
      // user by suddenly following the system on next launch).
      const legacy = await AsyncStorage.getItem(LEGACY_DARK_MODE_KEY);
      if (legacy === 'true' || legacy === 'false') {
        const migrated: ThemePreference = legacy === 'true' ? 'dark' : 'light';
        setThemePreferenceState(migrated);
        await AsyncStorage.setItem(THEME_PREFERENCE_KEY, migrated);
        await AsyncStorage.removeItem(LEGACY_DARK_MODE_KEY);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const setThemePreference = async (pref: ThemePreference) => {
    try {
      setThemePreferenceState(pref);
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, pref);
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
    themePreference,
    setThemePreference,
    isDarkMode,
    theme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}; 