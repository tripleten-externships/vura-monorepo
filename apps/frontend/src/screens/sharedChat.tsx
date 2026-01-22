import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { AiChatMessageInput } from '../__generated__/graphql';
import { colors } from '../theme/designTokens';

export type ChatMessage = {
  sender: 'bot' | 'user';
  text: string;
};

export type StreamChatPayload = {
  messages: AiChatMessageInput[];
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  provider?: string;
};

export const TypingIndicator = () => {
  const dot1 = useRef(new Animated.Value(0.2)).current;
  const dot2 = useRef(new Animated.Value(0.2)).current;
  const dot3 = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value) =>
      Animated.sequence([
        Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.2, duration: 300, useNativeDriver: true }),
      ]);

    const animation = Animated.loop(Animated.stagger(150, [pulse(dot1), pulse(dot2), pulse(dot3)]));

    animation.start();
    return () => animation.stop();
  }, [dot1, dot2, dot3]);

  const dotStyle = (dot: Animated.Value) => ({
    opacity: dot,
    transform: [
      {
        scale: dot.interpolate({
          inputRange: [0.2, 1],
          outputRange: [0.8, 1.1],
        }),
      },
    ],
  });

  return (
    <View style={styles.typingDotsRow}>
      <Animated.View style={[styles.typingDot, dotStyle(dot1)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot2)]} />
      <Animated.View style={[styles.typingDot, dotStyle(dot3)]} />
    </View>
  );
};

const resolveApiBaseUrl = () =>
  typeof VITE_API_URL !== 'undefined' && VITE_API_URL ? VITE_API_URL : 'http://localhost:3001';

const canStreamResponses = () =>
  typeof ReadableStream !== 'undefined' && typeof TextDecoder !== 'undefined';

const fetchAiChatContent = async (payload: StreamChatPayload): Promise<string> => {
  const apiBaseUrl = resolveApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/chat/api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to fetch AI response.');
  }

  const data = await response.json();
  if (typeof data?.content !== 'string') {
    throw new Error('AI response was empty.');
  }

  return data.content;
};

export const streamAiChatContent = async (payload: StreamChatPayload): Promise<string> => {
  if (!canStreamResponses()) {
    return fetchAiChatContent(payload);
  }

  const apiBaseUrl = resolveApiBaseUrl();
  const response = await fetch(`${apiBaseUrl}/chat/api`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to stream AI response.');
  }

  if (!response.body || typeof response.body.getReader !== 'function') {
    return fetchAiChatContent(payload);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex = buffer.indexOf('\n\n');
    while (separatorIndex !== -1) {
      const rawEvent = buffer.slice(0, separatorIndex).trim();
      buffer = buffer.slice(separatorIndex + 2);

      if (rawEvent.startsWith('data:')) {
        const dataString = rawEvent.replace(/^data:\s*/, '');
        if (dataString) {
          const event = JSON.parse(dataString);
          if (event?.error) {
            throw new Error(event.error);
          }
          if (event?.content) {
            content += event.content;
          }
          if (event?.done) {
            return content;
          }
        }
      }

      separatorIndex = buffer.indexOf('\n\n');
    }
  }

  return content;
};

const styles = StyleSheet.create({
  typingDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 6,
    paddingVertical: 2,
    paddingHorizontal: 2,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.textSecondary,
  },
});
