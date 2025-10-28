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

    logger.info('WebSocket service initialized');
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        // Try to get the token from various places
        const authToken = socket.handshake.auth.token;
        const authHeaderToken = socket.handshake.headers.authorization as string;
        const token = authToken || authHeaderToken;

        logger.info('Socket connection attempt', {
          id: socket.id,
          hasAuthToken: !!authToken,
          hasAuthHeader: !!authHeaderToken,
        });

        if (!token) {
          logger.error('Authentication token is missing');
          return next(new Error('Authentication token is missing'));
        }

        // Get context to access session
        const context = await this.contextProvider();

        try {
          const req = {
            headers: {
              authorization: token,
            },
            cookies: {
              'keystonejs-session': token,
            },
          } as any;

          const session = await context.sessionStrategy.get({ req, context });

          if (session?.data?.id) {
            socket.userId = session.data.id;
            socket.username = session.data.name || session.data.email;

            logger.info(`Socket authenticated for user: ${socket.userId}`);
            socket.emit('authentication:success', { userId: socket.userId });
            return next();
          }

          logger.warn('Session verification returned no user ID');
          socket.emit('authentication:error', 'Invalid authentication token');
          return next(new Error('Invalid authentication token'));
        } catch (sessionError) {
          logger.error('Session verification failed');
          socket.emit('authentication:error', 'Session verification failed');
          return next(new Error('Invalid authentication token'));
        }
      } catch (error: any) {
        logger.error('Socket authentication error');
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

      // Track user's socket connections
      this.trackUserConnection(userId, socket.id);

      // Notify user's connections
      this.broadcastUserStatus(userId, true);

      // Handle join room (for group chats)
      socket.on(SocketEvents.JOIN_ROOM, (groupId: string) => {
        this.joinRoom(socket, groupId, userId);
      });

      // Handle leave room
      socket.on(SocketEvents.LEAVE_ROOM, (groupId: string) => {
        this.leaveRoom(socket, groupId, userId);
      });

      // Handle typing indicators
      socket.on(SocketEvents.TYPING_START, (groupId: string) => {
        socket.to(`group:${groupId}`).emit(SocketEvents.TYPING_START, { userId, groupId });
      });

      socket.on(SocketEvents.TYPING_STOP, (groupId: string) => {
        socket.to(`group:${groupId}`).emit(SocketEvents.TYPING_STOP, { userId, groupId });
      });

      // Handle disconnection
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

    // Track users in group
    if (!this.groupUsers.has(groupId)) {
      this.groupUsers.set(groupId, new Set());
    }
    this.groupUsers.get(groupId)!.add(userId);

    logger.info(`User ${userId} joined room ${roomId}`);
  }

  private leaveRoom(socket: AuthenticatedSocket, groupId: string, userId: string) {
    const roomId = `group:${groupId}`;
    socket.leave(roomId);

    // Remove user from group tracking
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

    // Remove socket from tracking
    if (this.userSockets.has(userId)) {
      this.userSockets.get(userId)!.delete(socket.id);
      if (this.userSockets.get(userId)!.size === 0) {
        this.userSockets.delete(userId);
        // Broadcast offline status only when all user's sockets are disconnected
        this.broadcastUserStatus(userId, false);
      }
    }
  }

  private broadcastUserStatus(userId: string, isOnline: boolean) {
    const event = isOnline ? SocketEvents.USER_ONLINE : SocketEvents.USER_OFFLINE;
    this.io.emit(event, { userId });
  }

  // Public methods for sending messages

  /**
   * Emit a new chat message to all users in a group
   */
  public emitNewChatMessage(message: ChatMessagePayload) {
    const roomId = `group:${message.groupId}`;
    this.io.to(roomId).emit(SocketEvents.NEW_MESSAGE, message);
    logger.info(`Emitted new message to room ${roomId}`);
  }

  /**
   * Emit AI message chunks for streaming responses
   */
  public emitAiMessageChunk(userId: string, chunk: string, sessionId: string) {
    this.emitToUser(userId, SocketEvents.AI_MESSAGE_CHUNK, {
      content: chunk,
      sessionId,
    });
  }

  /**
   * Emit AI message completion
   */
  public emitAiMessageComplete(userId: string, message: AiChatMessagePayload) {
    this.emitToUser(userId, SocketEvents.AI_MESSAGE_COMPLETE, message);
  }

  /**
   * Emit to a specific user (across all their devices/connections)
   */
  public emitToUser(userId: string, event: string, data: any) {
    if (!this.userSockets.has(userId)) return;

    const socketIds = this.userSockets.get(userId)!;
    for (const socketId of socketIds) {
      this.io.to(socketId).emit(event, data);
    }
  }

  /**
   * Get the Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}
