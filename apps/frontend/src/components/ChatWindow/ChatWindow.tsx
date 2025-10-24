import React from 'react';
import Avatar from '../Avatar/Avatar';
import MessageBubble from '../MessageBubble/MessageBubble';
import { View, ScrollView, StyleSheet } from 'react-native';

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
    <ScrollView style={styles.scrollView}>
      {messages.map((msg) => (
        <View
          key={msg.id}
          style={[styles.container, msg.isSender ? styles.senderStyle : styles.receiverStyle]}
        >
          {/* only render avatar if not sender  */}
          {!msg.isSender && (
            <View style={styles.avatarContainer}>
              <Avatar initials={msg.initials || ''} size="sm" />
            </View>
          )}
          <MessageBubble messageText={msg.text} isSender={msg.isSender} />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  container: {
    marginHorizontal: 24,
    display: 'flex',
  },
  senderStyle: {
    alignSelf: 'flex-end',
  },
  receiverStyle: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    marginBottom: 6,
  },
});

export default ChatWindow;
