import React from 'react';
import { View, Text } from 'react-native';

interface MessageBubbleProps {
  isSender: boolean;
  messageText: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ isSender, messageText }) => {
  const bubbleClass = isSender
    ? 'self-end bg-[#F6F4FA] rounded-tl-[12px] rounded-tr-[12px] rounded-bl-[12px] rounded-br-[2px] border-[1px]'
    : 'self-start bg-white rounded-tl-[2px] rounded-tr-[12px] rounded-bl-[12px] rounded-br-[12px] border-[1px]';
  return (
    <View className={`max-w-[70%]  mb-[20px] ${bubbleClass}`}>
      <Text className={`text-black text-[18px]`}>{messageText}</Text>
    </View>
  );
};

export default MessageBubble;
