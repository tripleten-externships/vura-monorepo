import React, { useState } from 'react';
import { Image, ImageSourcePropType, Pressable } from 'react-native';

export interface EmojiProps {
  emojiIcon: ImageSourcePropType;
}

export const Emoji = ({ emojiIcon }: EmojiProps) => {
  // use useState to track whether the emoji is checked or not
  const [isChecked, setIsChecked] = useState(false);

  // toggle the checked state when the checkbox is clicked
  const handlePress = () => {
    setIsChecked(!isChecked);
  };

  return (
    // change the emoji color based on whether it is checked or not
    <Pressable onPress={handlePress}>
      <Image
        source={emojiIcon}
        style={[{ width: 24, height: 24, tintColor: isChecked ? 'rgba(54,54,54,0.5)' : undefined }]}
      />
    </Pressable>
  );
};
