import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

interface ButtonProps {
  buttonText: string;
  size: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary';
}

const MainButton: React.FC<ButtonProps> = ({ buttonText, size, variant = 'primary' }) => {
  // set default when prop is optional

  const sizeClasses = {
    sm: 'w-[67px] h-[43px]', // post button (bg and text class: primary)
    md: 'w-[245px] h-[56px]', // gray-ish buttons under new post (bg and text class: secondary)
    lg: 'w-[345px] h-[62px]', // main dark button (bg and text class: primary)
  };

  const bgClasses = {
    primary: 'bg-[#363636]',
    secondary: 'bg-[#F6F4FA] border border-[#E7E7E7]',
  };

  const textClasses = {
    primary: 'text-white',
    secondary: 'text-black',
  };

  return (
    // TouchableOpacity is built into React Native and has a built in opacity animation when tapped
    <TouchableOpacity
      className={`justify-center items-center rounded-[20px] ${sizeClasses[size]} ${bgClasses[variant]}`}
    >
      <Text className={`${textClasses[variant]} font-semibold`}>{buttonText}</Text>
    </TouchableOpacity>
  );
};

export default MainButton;
