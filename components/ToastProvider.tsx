import React, { createContext, useContext, useState, useCallback } from 'react';
import { Snackbar } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: React.ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = useCallback((msg: string, toastType: 'success' | 'error' | 'info' = 'info') => {
    setMessage(msg);
    setType(toastType);
    setVisible(true);
  }, []);

  const onDismiss = () => setVisible(false);

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#4caf50';
      case 'error':
        return '#f44336';
      case 'info':
      default:
        return '#2196f3';
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={onDismiss}
        duration={3000}
        style={[styles.snackbar, { backgroundColor: getBackgroundColor() }]}
        action={{
          label: 'Dismiss',
          onPress: onDismiss,
          labelStyle: { color: '#ffffff' },
        }}
      >
        {message}
      </Snackbar>
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  snackbar: {
    marginBottom: 16,
  },
});
