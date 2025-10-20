import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MessageBubbleProps {
  isSender: boolean;
  messageText: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ isSender, messageText }) => {
  return (
    <View
      style={[
        styles.container,
        isSender ? styles.senderContainer : styles.receiverContainer,
        { alignSelf: isSender ? 'flex-end' : 'flex-start' },
      ]}
    >
      <Text style={styles.text}>{messageText}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: '70%',
    marginBottom: 20,
    borderWidth: 1,
    padding: 10,
  },
  senderContainer: {
    backgroundColor: '#F6F4FA',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 2,
  },
  receiverContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  text: {
    fontSize: 18,
    color: 'black',
  },
});

export default MessageBubble;
