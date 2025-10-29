import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { Text, View, Button, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_TOKEN } from '../store/apolloClient';
import { websocketService } from '../services/websocket';
import { io } from 'socket.io-client';

export const WebSocketTest = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState('Disconnected');
  const [token, setToken] = useState<string | null>(null);
  const { isConnected, joinRoom, onNewMessage } = useWebSocket();

  // check for token on mount
  useEffect(() => {
    const checkToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN);
        console.log('WebSocketTest: Token found:', !!storedToken);
        setToken(storedToken);
        if (!storedToken) {
          setMessages((prev) => [...prev, 'No authentication token found']);
        } else {
          setMessages((prev) => [...prev, 'Authentication token found']);
        }
      } catch (error) {
        console.error('Failed to get token:', error);
        setMessages((prev) => [...prev, 'Error getting authentication token']);
      }
    };

    checkToken();
  }, []);

  // log connection status
  useEffect(() => {
    setStatus(isConnected ? 'Connected' : 'Disconnected');
    console.log('WebSocketTest: Connection status:', isConnected ? 'Connected' : 'Disconnected');

    if (isConnected) {
      // join a test room when connected
      joinRoom('test-room');
      console.log('WebSocketTest: Joined room: test-room');

      // add log message
      setMessages((prev) => [...prev, 'WebSocket connected']);
    } else {
      setMessages((prev) => [...prev, 'WebSocket disconnected or not connected']);
    }
  }, [isConnected, joinRoom]);

  // listen for new messages
  useEffect(() => {
    if (!isConnected) return;

    const unsubscribe = onNewMessage((message) => {
      setMessages((prev) => [
        ...prev,
        `New message: ${message.message} (from: ${message.sender.name})`,
      ]);
    });

    return unsubscribe;
  }, [isConnected, onNewMessage]);

  // force reconnect by manually connecting with the token
  const handleReconnect = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN);
      if (!storedToken) {
        setMessages((prev) => [...prev, 'No token available for reconnect']);
        return;
      }

      // log token for debugging (only first few characters for security)
      const tokenPreview = storedToken.substring(0, 10) + '...';
      console.log('Using token for reconnect:', tokenPreview);
      setMessages((prev) => [...prev, `Token found: ${tokenPreview}`]);

      setMessages((prev) => [...prev, 'Attempting manual reconnect...']);

      // create a direct socket connection for testing
      const socket = io('http://localhost:3001', {
        path: '/socket.io',
        auth: { token: storedToken },
        extraHeaders: {
          Authorization: storedToken,
        },
        reconnection: true,
      });

      socket.on('connect', () => {
        console.log('Direct socket connection successful');
        setMessages((prev) => [...prev, 'Direct socket connection successful']);
      });

      socket.on('connect_error', (error) => {
        console.error('Direct socket connection error:', error);
        const errorMessage = error.message || 'Unknown error';
        setMessages((prev) => [...prev, `Direct socket error: ${errorMessage}`]);
      });

      socket.on('error', (error) => {
        console.error('Socket error event:', error);
        const errorMessage =
          typeof error === 'string'
            ? error
            : error && error.message
              ? error.message
              : 'Unknown error';
        setMessages((prev) => [...prev, `Socket error event: ${errorMessage}`]);
      });

      socket.on('disconnect', (reason) => {
        console.log('Direct socket disconnected:', reason);
        setMessages((prev) => [...prev, `Direct socket disconnected: ${reason}`]);
      });

      // listen for authentication events
      socket.on('authentication:success', () => {
        console.log('Authentication successful');
        setMessages((prev) => [...prev, 'Authentication successful']);
      });

      socket.on('authentication:error', (error) => {
        console.error('Authentication error:', error);
        setMessages((prev) => [...prev, `Authentication error: ${error}`]);
      });

      // also try the websocketService
      websocketService.disconnect();
      try {
        await websocketService.connect(storedToken);
        setMessages((prev) => [...prev, 'WebSocketService connect succeeded']);
      } catch (wsError) {
        console.error('WebSocketService connect error:', wsError);
        setMessages((prev) => [...prev, `WebSocketService error: ${wsError.message || wsError}`]);
      }

      setMessages((prev) => [...prev, 'Manual reconnect attempted']);
    } catch (error) {
      console.error('Reconnect error:', error);
      setMessages((prev) => [...prev, `Reconnect error: ${error}`]);
    }
  };

  // add a debug button to show the current token
  const showToken = async () => {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN);
      if (!storedToken) {
        setMessages((prev) => [...prev, 'No token found in storage']);
        return;
      }

      const tokenPreview = storedToken.substring(0, 10) + '...';
      setMessages((prev) => [...prev, `Current token: ${tokenPreview}`]);
      console.log('Current token:', storedToken);
    } catch (error) {
      console.error('Error retrieving token:', error);
      setMessages((prev) => [...prev, 'Error retrieving token']);
    }
  };

  //   console.log('rendering WebSocketTest component');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>WebSocket Test Component</Text>
      <Text style={[styles.status, { color: isConnected ? 'green' : 'red', fontWeight: 'bold' }]}>
        Status: {status}
      </Text>

      <View style={styles.buttonContainer}>
        <Button title="Force Reconnect" onPress={handleReconnect} color="#4CAF50" />
        <View style={{ height: 10 }} />
        <Button title="Check Token" onPress={showToken} color="#2196F3" />
      </View>

      <View style={styles.messagesContainer}>
        <Text style={styles.subtitle}>Messages:</Text>
        {messages.length === 0 ? (
          <Text>No messages yet</Text>
        ) : (
          messages.map((msg, index) => (
            <Text key={index} style={styles.message}>
              {msg}
            </Text>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  status: {
    fontSize: 16,
    marginBottom: 10,
    color: 'blue',
  },
  buttonContainer: {
    marginBottom: 20,
  },
  messagesContainer: {
    flex: 1,
  },
  message: {
    padding: 10,
    marginBottom: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
});
