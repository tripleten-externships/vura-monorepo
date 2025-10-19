import React from 'react';
import Avatar from '../Avatar/avatar';
import MessageBubble from '../MessageBubble/messageBubble';
import { View, ScrollView } from 'react-native';

interface Message {
  // defining single message object
  id: string;
  text: string;
  isSender: boolean;
  initials: string;
}

interface ChatWindowProps {
  messages: Message[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  return (
    <ScrollView className="flex-1" px-24>
      {messages.map((msg) => (
        <View key={msg.id} className={`flex ${msg.isSender ? 'items-end' : 'items-start'} mb-24`}>
          {/* only render avatar if not sender  */}
          {!msg.isSender && (
            <View className="mb-6">
              <Avatar initials={msg.initials || ''} size="sm" />
            </View>
          )}
          <MessageBubble message={msg.text} isSender={msg.isSender} />
        </View>
      ))}
    </ScrollView>
  );
};

export default ChatWindow;
