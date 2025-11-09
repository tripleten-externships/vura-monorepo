import React from 'react';
import { Text, View } from 'react-native';

interface AvatarProps {
  initials: string;
  size: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ initials, size }) => {
  // FC is optional but tells React that this is a functional component and automaticallly includes children as prop
  const sizeClasses = {
    sm: { width: 32, height: 32, fontSize: 14 }, // in chat box
    md: { width: 44, height: 44, fontSize: 18 }, // in forum posts
    lg: { width: 100, height: 100, fontSize: 40 }, // for profile page
  };
  const { width, height, fontSize } = sizeClasses[size];
  return (
    <View
      style={{
        width,
        height,
        borderRadius: width / 2,
        backgroundColor: 'black',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          color: 'white',
          fontWeight: 'bold',
          fontSize,
        }}
      >
        {initials}
      </Text>
    </View>
  );
};

export default Avatar;
