import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import { Context } from '../../types/context';

export interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

export interface WebSocketServiceOptions {
  httpServer: HttpServer;
  context: () => Promise<Context>;
}

export interface ChatMessagePayload {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
  groupId: string;
}

export interface AiChatMessagePayload {
  id: string;
  content: string;
  createdAt: string;
  sessionId: string;
  author: string;
}

export enum SocketEvents {
  // Connection events
  AUTHENTICATE = 'authenticate',
  AUTHENTICATION_SUCCESS = 'authentication:success',
  AUTHENTICATION_ERROR = 'authentication:error',

  // Room events
  JOIN_ROOM = 'join:room',
  LEAVE_ROOM = 'leave:room',

  // Chat events
  NEW_MESSAGE = 'chat:new_message',
  MESSAGE_RECEIVED = 'chat:message_received',

  // Typing indicators
  TYPING_START = 'chat:typing:start',
  TYPING_STOP = 'chat:typing:stop',

  // AI chat events
  AI_MESSAGE_START = 'ai:message:start',
  AI_MESSAGE_CHUNK = 'ai:message:chunk',
  AI_MESSAGE_COMPLETE = 'ai:message:complete',
  AI_MESSAGE_ERROR = 'ai:message:error',

  // Status events
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
}
