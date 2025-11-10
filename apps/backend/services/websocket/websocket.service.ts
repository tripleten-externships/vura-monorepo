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
import { carePlanEmitter } from '../careplan/careplan.service';
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
    this.subscribeToCarePlanEvents();

    logger.info('WebSocket service initialized');
  }

  private subscribeToCarePlanEvents() {
    carePlanEmitter.on('created', (payload) => {
      this.io.emit(SocketEvents.CAREPLAN_CREATED, payload);
      logger.info('Broadcasted care plan created event:', payload);
    });

    carePlanEmitter.on('updated', (payload) => {
      this.io.emit(SocketEvents.CAREPLAN_UPDATED, payload);
      logger.info('Broadcasted care plan updated event:', payload);
    });

    carePlanEmitter.on('deleted', (payload) => {
      this.io.emit(SocketEvents.CAREPLAN_DELETED, payload);
      logger.info('Broadcasted care plan deleted event:', payload);
    });

    logger.info('Subscribed to care plan events');
  }

  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // get token either from auth or header
        const token =
          socket.handshake.auth?.token ||
          (socket.handshake.headers.authorization as string)?.replace('Bearer ', '');

        if (!token) {
          socket.emit('authentication:error', 'Missing token');
          return next(new Error('Missing authentication token'));
        }

        // verify token
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

      // track user's socket connections
      this.trackUserConnection(userId, socket.id);

      // notify user's connections
      this.broadcastUserStatus(userId, true);

      // handle join room (for group chats)
      socket.on(SocketEvents.JOIN_ROOM, (groupId: string) => {
        this.joinRoom(socket, groupId, userId);
      });

      // handle leave room
      socket.on(SocketEvents.LEAVE_ROOM, (groupId: string) => {
        this.leaveRoom(socket, groupId, userId);
      });

      // handle typing indicators
      socket.on(SocketEvents.TYPING_START, (groupId: string) => {
        socket.to(`group:${groupId}`).emit(SocketEvents.TYPING_START, { userId, groupId });
      });

      socket.on(SocketEvents.TYPING_STOP, (groupId: string) => {
        socket.to(`group:${groupId}`).emit(SocketEvents.TYPING_STOP, { userId, groupId });
      });

      // handle disconnection
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

    // track users in group
    if (!this.groupUsers.has(groupId)) {
      this.groupUsers.set(groupId, new Set());
    }
    this.groupUsers.get(groupId)!.add(userId);

    logger.info(`User ${userId} joined room ${roomId}`);
  }

  private leaveRoom(socket: AuthenticatedSocket, groupId: string, userId: string) {
    const roomId = `group:${groupId}`;
    socket.leave(roomId);

    // remove user from group tracking
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

    // remove socket from tracking
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(socket.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
        // broadcast offline status only when all user's sockets are disconnected
        this.broadcastUserStatus(userId, false);
      }
    }
  }

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    const event = isOnline ? SocketEvents.USER_ONLINE : SocketEvents.USER_OFFLINE;
    this.io.emit(event, { userId });
  }

  // public methods for sending messages

  /**
   * emit a new chat message to all users in a group
   */
  public emitNewChatMessage(message: ChatMessagePayload) {
    const roomId = `group:${message.groupId}`;
    this.io.to(roomId).emit(SocketEvents.NEW_MESSAGE, message);
    logger.info(`Emitted new message to room ${roomId}`);
  }

  /**
   * emit AI message chunks for streaming responses
   */
  public emitAiMessageChunk(userId: string, chunk: string, sessionId: string) {
    this.emitToUser(userId, SocketEvents.AI_MESSAGE_CHUNK, {
      content: chunk,
      sessionId,
    });
  }

  /**
   * emit AI message completion
   */
  public emitAiMessageComplete(userId: string, message: AiChatMessagePayload) {
    this.emitToUser(userId, SocketEvents.AI_MESSAGE_COMPLETE, message);
  }

  /**
   * emit to a specific user (across all their devices/connections)
   */
  public emitToUser(userId: string, event: string, data: any) {
    if (!this.userSockets.has(userId)) return;

    const socketIds = this.userSockets.get(userId)!;
    for (const socketId of socketIds) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * get the socket.io server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}
