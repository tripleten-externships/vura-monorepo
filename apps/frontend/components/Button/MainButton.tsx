import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
  buttonText: string;
  size: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
  onPress?: () => void;
}

const MainButton: React.FC<ButtonProps> = ({ buttonText, size, variant = 'primary', onPress }) => {
  // size dimensions
  const sizeStyles = {
    sm: { width: 67, height: 43 },
    md: { width: 245, height: 56 },
    lg: { width: 345, height: 62 },
  };

  // background and border styles based on variant
  const variantStyles = {
    primary: {
      backgroundColor: '#363636',
      borderColor: '#363636',
    },
    secondary: {
      backgroundColor: '#F6F4FA',
      borderColor: '#E7E7E7',
    },
  };

  // text styles based on variant
  const textVariantStyles = {
    primary: { color: '#FFFFFF' },
    secondary: { color: '#000000' },
  };

  // dynamic styles based on props
  const containerStyle = StyleSheet.create({
    dynamic: {
      ...styles.container,
      ...sizeStyles[size],
      ...variantStyles[variant],
    },
  });

  const textStyle = StyleSheet.create({
    dynamic: {
      ...styles.text,
      ...textVariantStyles[variant],
    },
  });

  return (
    <TouchableOpacity style={containerStyle.dynamic} onPress={onPress}>
      <Text style={textStyle.dynamic}>{buttonText}</Text>
    </TouchableOpacity>
  );
};

// base styles that will be extended by dynamic styles
const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 20,
    padding: 10,
  },
  text: {
    fontWeight: '600',
    fontSize: 16,
  },
});

export default MainButton;
