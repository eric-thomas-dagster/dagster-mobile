import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompassSheet } from './CompassSheet';
import { CompassFloatingButton } from './CompassFloatingButton';
import { useCompassEnabled } from '../../lib/hooks/useFeatureGates';

const FLOATING_BUTTON_SETTING_KEY = 'compass_floating_button_enabled';

// Each screen registers its page-specific Compass prompts. The sheet's
// empty state uses them when present, falling back to generic suggestions
// when we're on a screen with no registered prompts.
export type CompassSuggestion = { label: string; prompt: string };

type CompassContextValue = {
  enabled: boolean;
  open: () => void;
  openWithPrompt: (prompt: string) => void;
  close: () => void;
  screenSuggestions: CompassSuggestion[] | null;
  setScreenSuggestions: (prompts: CompassSuggestion[] | null) => void;
  floatingButtonEnabled: boolean;
  setFloatingButtonEnabled: (value: boolean) => void;
};

const CompassContext = createContext<CompassContextValue>({
  enabled: false,
  open: () => {},
  openWithPrompt: () => {},
  close: () => {},
  screenSuggestions: null,
  setScreenSuggestions: () => {},
  floatingButtonEnabled: false,
  setFloatingButtonEnabled: () => {},
});

export const useCompass = () => useContext(CompassContext);

export const getFloatingButtonPref = async (): Promise<boolean> => {
  try {
    const v = await AsyncStorage.getItem(FLOATING_BUTTON_SETTING_KEY);
    return v === 'true';
  } catch {
    return false;
  }
};

export const setFloatingButtonPref = async (value: boolean) => {
  await AsyncStorage.setItem(FLOATING_BUTTON_SETTING_KEY, value.toString());
};

export const CompassProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const enabled = useCompassEnabled();
  const [sheetVisible, setSheetVisible] = useState(false);
  const [floatingButtonEnabled, setFloatingButtonEnabledState] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [screenSuggestions, setScreenSuggestions] = useState<CompassSuggestion[] | null>(null);

  useEffect(() => {
    getFloatingButtonPref().then(setFloatingButtonEnabledState);
  }, []);

  // Single source of truth: toggling from Settings goes through this setter
  // so the floating button shows/hides immediately, then persists.
  const setFloatingButtonEnabled = useCallback((value: boolean) => {
    setFloatingButtonEnabledState(value);
    setFloatingButtonPref(value).catch(() => {});
  }, []);

  const open = useCallback(() => setSheetVisible(true), []);
  const openWithPrompt = useCallback((prompt: string) => {
    setPendingPrompt(prompt);
    setSheetVisible(true);
  }, []);
  const close = useCallback(() => {
    setSheetVisible(false);
    setPendingPrompt(null);
  }, []);
  const consumePendingPrompt = useCallback(() => setPendingPrompt(null), []);

  return (
    <CompassContext.Provider
      value={{
        enabled,
        open,
        openWithPrompt,
        close,
        screenSuggestions,
        setScreenSuggestions,
        floatingButtonEnabled,
        setFloatingButtonEnabled,
      }}
    >
      {children}
      {enabled && floatingButtonEnabled && <CompassFloatingButton onPress={open} />}
      <CompassSheet
        visible={sheetVisible}
        onClose={close}
        pendingPrompt={pendingPrompt}
        onPendingPromptConsumed={consumePendingPrompt}
      />
    </CompassContext.Provider>
  );
};
