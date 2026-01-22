import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocation, useNavigate } from 'react-router-dom';
import type { AiChatMessageInput } from '../../__generated__/graphql';
import { colors, radii, spacing, typography } from '../../theme/designTokens';
import sendArrow from '../../../assets/send-arrow.svg';
import { ChatMessage, TypingIndicator, streamAiChatContent } from '../sharedChat';

type LocationState = {
  initialQuestion?: string;
};

const ResourcesChat = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialQuestion =
    typeof (location.state as LocationState | null)?.initialQuestion === 'string'
      ? (location.state as LocationState).initialQuestion
      : '';

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView | null>(null);
  const hasInitializedRef = useRef(false);

  const submitQuestion = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || aiLoading) return;
      setAiLoading(true);
      setMessages((prev) => [...prev, { sender: 'user', text: trimmed }]);
      setInput('');

      const systemPrompt =
        'You are a warm, supportive AI helper for caregivers. Reply in 2-4 short sentences with whatever ' +
        'is a more appropriate response of either actionable tips or further clarification. Your responses ' +
        'should have lexical variation and be conversational.';
      const history: AiChatMessageInput[] = [{ role: 'user', content: trimmed }];

      try {
        const content = await streamAiChatContent({
          messages: history,
          systemPrompt,
          temperature: 0.4,
          maxTokens: 600,
          provider: 'gemini',
        });
        const reply = content.trim();
        if (reply) {
          setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
        }
      } catch (_error) {
        setMessages((prev) => [
          ...prev,
          {
            sender: 'bot',
            text: 'Sorry, I had trouble answering that right now. Please try again.',
          },
        ]);
      } finally {
        setAiLoading(false);
      }
    },
    [aiLoading]
  );

  useEffect(() => {
    if (hasInitializedRef.current) return;
    if (!initialQuestion) return;
    hasInitializedRef.current = true;
    void submitQuestion(initialQuestion);
  }, [initialQuestion, submitQuestion]);

  const handleSubmit = () => {
    void submitQuestion(input);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigate('/resources')}>
          <Text style={styles.backText}>{'<'}</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Ask AI Helper</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message, idx) => (
          <View
            key={`${message.sender}-${idx}`}
            style={[
              styles.messageBubble,
              message.sender === 'user' ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text style={styles.messageText}>{message.text}</Text>
          </View>
        ))}
        {aiLoading && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <TypingIndicator />
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Type your answer"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />
          <TouchableOpacity
            style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
            onPress={handleSubmit}
            disabled={!input.trim()}
          >
            <Image
              source={{ uri: sendArrow }}
              style={[styles.sendIcon, !input.trim() ? styles.sendIconIdle : styles.sendIconActive]}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.base,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl * 3,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    ...typography.body18Medium,
    color: colors.textPrimary,
  },
  title: {
    ...typography.body18Medium,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
    height: 32,
  },
  messages: {
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    flexGrow: 1,
  },
  messageBubble: {
    padding: spacing.md,
    borderRadius: radii.card,
    maxWidth: '90%',
    borderWidth: 1,
    borderColor: colors.stroke,
  },
  userBubble: {
    backgroundColor: colors.base,
    alignSelf: 'flex-end',
  },
  botBubble: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
  },
  messageText: {
    ...typography.body16Regular,
    color: colors.textPrimary,
  },
  footer: {
    gap: spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    marginBottom: '5%',
    position: 'relative',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.stroke,
    borderRadius: radii.card,
    padding: spacing.md,
    paddingRight: spacing.xl * 2,
    color: colors.textPrimary,
    backgroundColor: colors.base,
  },
  sendButton: {
    position: 'absolute',
    right: spacing.sm,
    top: 15,
    transform: [{ translateY: -21 }],
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.base,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '4%',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendIcon: {
    width: 18,
    height: 18,
  },
  sendIconIdle: {
    tintColor: colors.textSecondary,
  },
  sendIconActive: {
    tintColor: colors.textPrimary,
  },
});

export default ResourcesChat;
