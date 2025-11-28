import React, { useState } from 'react';
import { Image, Pressable } from 'react-native';

export const NotificationBell = ({
  hasUnread,
  onClick,
}: {
  hasUnread: boolean;
  onClick?: () => void;
}) => {
  const handlePress = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <Pressable onPress={handlePress}>
      <Image
        source={
          hasUnread
            ? { uri: '../../../assets/notification_bell.png' }
            : { uri: '../../../assets/bell.png' }
        }
        style={[{ width: 20, height: 20 }]}
      />
    </Pressable>
  );
};
