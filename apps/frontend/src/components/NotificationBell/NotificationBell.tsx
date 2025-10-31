import React, { useState } from 'react';
import { Image, Pressable } from 'react-native';

export const Bell = ({ bellIcon }: { bellIcon: { uri: string } }) => {
  // use usestate to track whether the notification bell is active or not
  const [isActive, setIsActive] = useState(true);

  // change the bell icon based on the active state
  const bellNotification = isActive
    ? { uri: '../../../assets/notification_bell.png' }
    : { uri: '../../../assets/bell.png' };
  return (
    // when the user presses the notification bell, it changes back to the regular bell
    <Pressable onPress={() => setIsActive(false)}>
      <Image source={bellNotification} style={[{ width: 24, height: 24 }]} />
    </Pressable>
  );
};
