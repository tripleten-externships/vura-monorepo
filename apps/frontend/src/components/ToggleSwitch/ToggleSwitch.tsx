import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';

type ToggleSwitchProps = {
  value: boolean;
  onValueChange: (next: boolean) => void;
};

export const ToggleSwitch = ({ value, onValueChange }: ToggleSwitchProps) => {
  return (
    <Pressable
      onPress={() => onValueChange(!value)}
      style={[styles.track, value ? styles.trackOn : styles.trackOff]}
    >
      <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  track: {
    width: 52,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: '#363636',
  },
  trackOff: {
    backgroundColor: '#D9D9D9',
  },
  thumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  thumbOn: {
    transform: [{ translateX: 24 }],
  },
  thumbOff: {
    transform: [{ translateX: 0 }],
    backgroundColor: '#F4F3F4',
  },
});
