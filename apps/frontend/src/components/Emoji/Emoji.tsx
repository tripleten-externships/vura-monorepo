import { Image, ImageSourcePropType } from 'react-native';

export interface EmojiProps {
  emojiIcon: ImageSourcePropType | string;
  isChecked?: boolean;
}

export const Emoji = ({ emojiIcon, isChecked }: EmojiProps) => {
  return (
    <Image
      source={typeof emojiIcon === 'string' ? { uri: emojiIcon } : emojiIcon}
      style={{ width: 24, height: 24, tintColor: isChecked ? 'rgba(54,54,54,0.5)' : undefined }}
    />
  );
};
