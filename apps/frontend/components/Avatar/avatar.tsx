import React from 'react';
import { Text, View } from 'react-native';

interface AvatarProps {
  initials: string;
  size: 'sm' | 'md' | 'lg';
}

const Avatar: React.FC<AvatarProps> = ({ initials, size }) => {
  // FC is optional but tells React that this is a functional component and automaticallly includes children as prop
  const sizeClasses = {
    sm: 'w-[32px] h-[32px] text-[14px]', // messaging avatar
    md: 'w-[44px] h-[44px] text-[18px]', // avatar in forum
    lg: 'w-[100px] h-[100px] text-[40px]', // avatar for edit profile
  };

  return (
    <View className={`bg-black rounded-full justify-center items-center ${sizeClasses[size]}`}>
      <Text className="text-white font-bold">{initials}</Text>
    </View>
  );
};

export default Avatar;
