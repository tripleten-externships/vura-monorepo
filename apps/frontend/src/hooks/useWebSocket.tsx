import { useEffect, useState, useCallback } from 'react';
import {
  websocketService,
  SocketEvents,
  ChatMessage,
  AiChatChunk,
  AiChatComplete,
} from '../services/websocket';
import { useAuth } from './useAuth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN } from '../store/apolloClient';

interface WebSocketHookResult {
  isConnected: boolean;
  joinRoom: (groupId: string) => void;
  leaveRoom: (groupId: string) => void;
  sendTypingStart: (groupId: string) => void;
  sendTypingStop: (groupId: string) => void;
  onNewMessage: (callback: (message: ChatMessage) => void) => () => void;
  onTypingStart: (callback: (data: { userId: string; groupId: string }) => void) => () => void;
  onTypingStop: (callback: (data: { userId: string; groupId: string }) => void) => () => void;
  onAiMessageChunk: (callback: (data: AiChatChunk) => void) => () => void;
  onAiMessageComplete: (callback: (data: AiChatComplete) => void) => () => void;
  onUserOnline: (callback: (data: { userId: string }) => void) => () => void;
  onUserOffline: (callback: (data: { userId: string }) => void) => () => void;
}

export function useWebSocket(): WebSocketHookResult {
  const { currentUser } = useAuth({});
  const [isConnected, setIsConnected] = useState(false);

  // Connect to WebSocket when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    // Get auth token from storage
    AsyncStorage.getItem(AUTH_TOKEN).then((token) => {
      if (!token) return;

      websocketService
        .connect(token)
        .then(() => {
          setIsConnected(true);
        })
        .catch((error) => {
          console.error('Failed to connect to WebSocket:', error);
          setIsConnected(false);
        });
    });

    // Cleanup on unmount
    return () => {
      websocketService.disconnect();
      setIsConnected(false);
    };
  }, [currentUser]);

  // Room management
  const joinRoom = useCallback((groupId: string) => {
    websocketService.joinRoom(groupId);
  }, []);

  const leaveRoom = useCallback((groupId: string) => {
    websocketService.leaveRoom(groupId);
  }, []);

  // Typing indicators
  const sendTypingStart = useCallback((groupId: string) => {
    websocketService.sendTypingStart(groupId);
  }, []);

  const sendTypingStop = useCallback((groupId: string) => {
    websocketService.sendTypingStop(groupId);
  }, []);

  // Event listeners
  const onNewMessage = useCallback((callback: (message: ChatMessage) => void) => {
    return websocketService.onNewMessage(callback);
  }, []);

  const onTypingStart = useCallback(
    (callback: (data: { userId: string; groupId: string }) => void) => {
      return websocketService.onTypingStart(callback);
    },
    []
  );

  const onTypingStop = useCallback(
    (callback: (data: { userId: string; groupId: string }) => void) => {
      return websocketService.onTypingStop(callback);
    },
    []
  );

  const onAiMessageChunk = useCallback((callback: (data: AiChatChunk) => void) => {
    return websocketService.onAiMessageChunk(callback);
  }, []);

  const onAiMessageComplete = useCallback((callback: (data: AiChatComplete) => void) => {
    return websocketService.onAiMessageComplete(callback);
  }, []);

  const onUserOnline = useCallback((callback: (data: { userId: string }) => void) => {
    return websocketService.onUserOnline(callback);
  }, []);

  const onUserOffline = useCallback((callback: (data: { userId: string }) => void) => {
    return websocketService.onUserOffline(callback);
  }, []);

  return {
    isConnected,
    joinRoom,
    leaveRoom,
    sendTypingStart,
    sendTypingStop,
    onNewMessage,
    onTypingStart,
    onTypingStop,
    onAiMessageChunk,
    onAiMessageComplete,
    onUserOnline,
    onUserOffline,
  };
}
