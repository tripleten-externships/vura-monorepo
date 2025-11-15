import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import {
  AuthenticatedSocket,
  WebSocketServiceOptions,
  SocketEvents,
  ChatMessagePayload,
  AiChatMessagePayload,
} from './types';
import { logger } from '../../utils/logger';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../../utils/jwt';
import { notificationService } from '../notification/notification.service';

export class WebSocketService {
  private io: SocketIOServer;
  private userSockets: Map<string, Set<string>> = new Map();
  private groupUsers: Map<string, Set<string>> = new Map();
  private contextProvider: () => Promise<any>;

  constructor(options: WebSocketServiceOptions) {
    const { httpServer, context } = options;
    this.contextProvider = context;

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io',
    });

    this.setupMiddleware();
    this.setupEventHandlers();

    // Removed obsolete subscribeToCarePlanEvents() call
    logger.info('WebSocket service initialized');
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token =
          socket.handshake.auth?.token ||
          (socket.handshake.headers.authorization as string)?.replace('Bearer ', '');

        if (!token) {
          socket.emit('authentication:error', 'Missing token');
          return next(new Error('Missing authentication token'));
        }

        const decoded = verifyToken(token);
        if (!decoded || typeof decoded === 'string') {
          socket.emit('authentication:error', 'Invalid or expired token');
          return next(new Error('Invalid or expired token'));
        }

        socket.userId = decoded.id;
        socket.username = decoded.email;

        logger.info(`Socket authenticated for user ${socket.userId}`);
        socket.emit('authentication:success', { userId: socket.userId });
        next();
      } catch (err: any) {
        logger.error('Socket authentication failed:', err.message);
        socket.emit('authentication:error', 'Authentication failed');
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      const userId = socket.userId;

      if (!userId) {
        socket.disconnect();
        return;
      }

      logger.info(`User connected: ${userId}`);
      this.trackUserConnection(userId, socket.id);
      this.broadcastUserStatus(userId, true);

      socket.on(SocketEvents.JOIN_ROOM, (groupId: string) => {
        this.joinRoom(socket, groupId, userId);
      });

      socket.on(SocketEvents.LEAVE_ROOM, (groupId: string) => {
        this.leaveRoom(socket, groupId, userId);
      });

      socket.on(SocketEvents.TYPING_START, (groupId: string) => {
        socket.to(`group:${groupId}`).emit(SocketEvents.TYPING_START, { userId, groupId });
      });

      socket.on(SocketEvents.TYPING_STOP, (groupId: string) => {
        socket.to(`group:${groupId}`).emit(SocketEvents.TYPING_STOP, { userId, groupId });
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket, userId);
      });
    });
  }

  private trackUserConnection(userId: string, socketId: string) {
    if (!this.userSockets.has(userId)) {
      this.userSockets.set(userId, new Set());
    }
    this.userSockets.get(userId)!.add(socketId);
  }

  private joinRoom(socket: AuthenticatedSocket, groupId: string, userId: string) {
    const roomId = `group:${groupId}`;
    socket.join(roomId);

    if (!this.groupUsers.has(groupId)) {
      this.groupUsers.set(groupId, new Set());
    }
    this.groupUsers.get(groupId)!.add(userId);

    logger.info(`User ${userId} joined room ${roomId}`);
  }

  private leaveRoom(socket: AuthenticatedSocket, groupId: string, userId: string) {
    const roomId = `group:${groupId}`;
    socket.leave(roomId);

    if (this.groupUsers.has(groupId)) {
      this.groupUsers.get(groupId)!.delete(userId);
      if (this.groupUsers.get(groupId)!.size === 0) {
        this.groupUsers.delete(groupId);
      }
    }

    logger.info(`User ${userId} left room ${roomId}`);
  }

  private handleDisconnect(socket: AuthenticatedSocket, userId: string) {
    if (!userId) return;

    logger.info(`User disconnected: ${userId}`);

    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(socket.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
        this.broadcastUserStatus(userId, false);
      }
    }
  }

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    const event = isOnline ? SocketEvents.USER_ONLINE : SocketEvents.USER_OFFLINE;
    this.io.emit(event, { userId });
  }

  public emitNewChatMessage(message: ChatMessagePayload) {
    const roomId = `group:${message.groupId}`;
    this.io.to(roomId).emit(SocketEvents.NEW_MESSAGE, message);
    logger.info(`Emitted new message to room ${roomId}`);
  }

  public emitAiMessageChunk(userId: string, chunk: string, sessionId: string) {
    this.emitToUser(userId, SocketEvents.AI_MESSAGE_CHUNK, {
      content: chunk,
      sessionId,
    });
  }

  public emitAiMessageComplete(userId: string, message: AiChatMessagePayload) {
    this.emitToUser(userId, SocketEvents.AI_MESSAGE_COMPLETE, message);
  }

  public emitToUser(userId: string, event: string, data: any) {
    if (!this.userSockets.has(userId)) return;
    const socketIds = this.userSockets.get(userId)!;
    for (const socketId of socketIds) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public getIO(): SocketIOServer {
    return this.io;
  }
}
