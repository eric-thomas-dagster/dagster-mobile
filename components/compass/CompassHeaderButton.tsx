import React from 'react';
import { IconButton } from 'react-native-paper';
import { useCompass } from './CompassProvider';
import { CompassIcon } from './CompassIcon';

export const CompassHeaderButton: React.FC = () => {
  const { enabled, open } = useCompass();
  if (!enabled) return null;
  return (
    <IconButton
      icon={() => <CompassIcon size={22} />}
      size={22}
      onPress={open}
      style={{ margin: 0 }}
      accessibilityLabel="Open Compass"
    />
  );
};
