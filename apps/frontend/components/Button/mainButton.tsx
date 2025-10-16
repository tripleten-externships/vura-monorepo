import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
  buttontText: string;
  size: 'sm' | 'md' | 'lg';
}

const MainButton: React.FC<ButtonProps> = ({ buttontText, size }) => {
  return (
    // TouchableOpacity is built into React Native and has a built in opacity animation when tapped
    <TouchableOpacity>
      <Text>{buttontText}</Text>
    </TouchableOpacity>
  );
};

export const MainButton;
