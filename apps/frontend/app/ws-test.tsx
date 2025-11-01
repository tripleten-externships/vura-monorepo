import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, Button, ScrollView } from 'react-native';
import { useMutation } from '@apollo/client/react';
import { SEND_CHAT_MESSAGE } from '../src/graphql/mutations/chatMutations';
import { useWebSocket } from '../src/hooks/useWebSocket';
import { websocketService } from '../src/services/websocket';

export default function WSTestScreen() {
  const {
    isConnected,
    joinRoom,
    leaveRoom,
    onNewMessage,
    onTypingStart,
    onTypingStop,
    onUserOnline,
    onUserOffline,
  } = useWebSocket();

  const [groupId, setGroupId] = useState('');
  const [joined, setJoined] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [messageText, setMessageText] = useState('');

  const [sendMessage, { loading: sending }] = useMutation(SEND_CHAT_MESSAGE);

  const appendLog = useCallback((line: string) => {
    setLogs((prev) => [new Date().toLocaleTimeString() + ' ' + line, ...prev].slice(0, 200));
  }, []);

  useEffect(() => {
    const offNewMsg = onNewMessage((m) => {
      setMessages((prev) => [...prev, m]);
      appendLog(`NEW_MESSAGE from ${m.sender?.name || m.sender?.id}: ${m.message}`);
    });

    const offTypingStart = onTypingStart(({ userId, groupId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.set(userId, groupId);
        return next;
      });
      appendLog(`TYPING_START by ${userId} in ${groupId}`);
    });

    const offTypingStop = onTypingStop(({ userId, groupId }) => {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(userId);
        return next;
      });
      appendLog(`TYPING_STOP by ${userId} in ${groupId}`);
    });

    const offOnline = onUserOnline(({ userId }) => appendLog(`USER_ONLINE ${userId}`));
    const offOffline = onUserOffline(({ userId }) => appendLog(`USER_OFFLINE ${userId}`));

    return () => {
      offNewMsg();
      offTypingStart();
      offTypingStop();
      offOnline();
      offOffline();
    };
  }, [appendLog, onNewMessage, onTypingStart, onTypingStop, onUserOnline, onUserOffline]);

  const typingNow = useMemo(() => Array.from(typingUsers.keys()), [typingUsers]);

  const handleJoin = useCallback(() => {
    if (!groupId) return;
    joinRoom(groupId);
    setJoined(true);
    appendLog(`JOINED room ${groupId}`);
  }, [appendLog, groupId, joinRoom]);

  const handleLeave = useCallback(() => {
    if (!groupId) return;
    leaveRoom(groupId);
    setJoined(false);
    appendLog(`LEFT room ${groupId}`);
  }, [appendLog, groupId, leaveRoom]);

  const handleSend = useCallback(async () => {
    if (!groupId || !messageText) return;
    try {
      const res = await sendMessage({
        variables: {
          input: { groupId, message: messageText },
        },
      });
      const sent = (res as any)?.data?.sendChatMessage?.chatMessage;
      if (sent) {
        appendLog(`SENT message id=${sent.id}`);
      } else {
        appendLog('SENT (no payload)');
      }
      setMessageText('');
    } catch (e: any) {
      appendLog(`SEND_ERROR ${e?.message || String(e)}`);
    }
  }, [appendLog, groupId, messageText, sendMessage]);

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text style={{ fontSize: 20, fontWeight: '600' }}>WebSocket Test</Text>
      <Text>Connected: {isConnected ? 'yes' : 'no'}</Text>

      <View style={{ gap: 4, backgroundColor: '#f5f5f5', padding: 8, borderRadius: 6 }}>
        <Text style={{ fontWeight: '600', fontSize: 12 }}>Debug Tools</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            title="Enable Debug"
            onPress={() => {
              websocketService.enableDebugLogging();
              appendLog('Debug logging enabled - check console');
            }}
            color="#FF9800"
          />
          <Button
            title="Enable Socket.IO Debug"
            onPress={() => {
              websocketService.enableSocketIODebug();
              appendLog('Socket.IO debug - reload page');
            }}
            color="#9C27B0"
          />
        </View>
      </View>

      <View style={{ gap: 8 }}>
        <Text>Group ID</Text>
        <TextInput
          value={groupId}
          onChangeText={setGroupId}
          placeholder="Enter group id"
          autoCapitalize="none"
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 }}
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button title="Join" onPress={handleJoin} disabled={!isConnected || !groupId || joined} />
          <Button
            title="Leave"
            onPress={handleLeave}
            disabled={!isConnected || !groupId || !joined}
          />
        </View>
      </View>

      <View style={{ gap: 4 }}>
        <Text style={{ fontWeight: '600' }}>Typing</Text>
        <Text>{typingNow.length ? typingNow.join(', ') : 'none'}</Text>
      </View>

      <View style={{ gap: 8 }}>
        <Text style={{ fontWeight: '600' }}>Send Test Message</Text>
        <TextInput
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message"
          style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 6 }}
        />
        <Button
          title={sending ? 'Sending...' : 'Send message'}
          onPress={handleSend}
          disabled={!isConnected || !joined || !messageText || sending}
        />
      </View>

      <View style={{ gap: 4 }}>
        <Text style={{ fontWeight: '600' }}>Messages</Text>
        {messages.length === 0 ? (
          <Text>none</Text>
        ) : (
          messages.map((m) => (
            <Text key={m.id}>
              [{new Date(m.createdAt).toLocaleTimeString()}] {m.sender?.name || m.sender?.id}:{' '}
              {m.message}
            </Text>
          ))
        )}
      </View>

      <View style={{ gap: 4 }}>
        <Text style={{ fontWeight: '600' }}>Logs</Text>
        {logs.length === 0 ? <Text>none</Text> : logs.map((l, idx) => <Text key={idx}>{l}</Text>)}
      </View>
    </ScrollView>
  );
}
