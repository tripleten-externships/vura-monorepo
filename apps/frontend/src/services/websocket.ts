import { io, Socket } from 'socket.io-client';

// Define event types to match backend
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

export interface ChatMessage {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    name: string;
  };
  groupId: string;
}

export interface AiChatChunk {
  content: string;
  sessionId: string;
}

export interface AiChatComplete {
  sessionId: string;
  completed: boolean;
}

type EventCallback<T> = (data: T) => void;
type EventListeners = Map<string, Set<EventCallback<any>>>;

class WebSocketService {
  private socket: Socket | null = null;
  private connected: boolean = false;
  private token: string | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private listeners: EventListeners = new Map();
  private baseUrl: string = '';
  private joinedRooms: Set<string> = new Set();

  constructor() {
    // Get API URL from environment or use default
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
  }

  /**
   * Initialize the WebSocket connection with authentication
   */
  public connect(token: string): Promise<void> {
    if (this.socket && this.connected) {
      return Promise.resolve();
    }

    this.token = token;

    return new Promise((resolve, reject) => {
      try {
        console.log('Connecting to WebSocket with token:', token.substring(0, 10) + '...');

        this.socket = io(this.baseUrl, {
          path: '/socket.io',
          auth: { token },
          extraHeaders: {
            Authorization: token,
          },
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        this.socket.on('connect', () => {
          console.log('WebSocket connected');
          this.connected = true;
          this.reconnectAttempts = 0;

          // rebind event listeners after (re)connect
          for (const [event, callbacks] of this.listeners.entries()) {
            for (const cb of callbacks) {
              this.socket!.on(event, cb);
            }
          }

          // rejoin previously joined rooms
          for (const groupId of this.joinedRooms.values()) {
            this.socket!.emit(SocketEvents.JOIN_ROOM, groupId);
          }

          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('WebSocket connection error:', error);
          if (!this.connected) {
            reject(error);
          }
        });

        this.socket.on('disconnect', (reason) => {
          console.log('WebSocket disconnected:', reason);
          this.connected = false;

          if (reason === 'io server disconnect') {
            // The server has forcefully disconnected the socket
            this.reconnect();
          }
        });

        // Setup authentication listeners
        this.socket.on(SocketEvents.AUTHENTICATION_SUCCESS, () => {
          console.log('WebSocket authentication successful');
        });

        this.socket.on(SocketEvents.AUTHENTICATION_ERROR, (error) => {
          console.error('WebSocket authentication error:', error);
          this.disconnect();
          reject(error);
        });
      } catch (error) {
        console.error('Failed to initialize WebSocket:', error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect the WebSocket
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Attempt to reconnect
   */
  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.token) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      this.connect(this.token).catch(() => {
        // Failed to reconnect
      });
    }
  }

  /**
   * Join a chat room
   */
  public joinRoom(groupId: string): void {
    if (!this.socket || !this.connected) {
      console.error('Cannot join room: WebSocket not connected');
      return;
    }
    this.joinedRooms.add(groupId);
    this.socket.emit(SocketEvents.JOIN_ROOM, groupId);
  }

  /**
   * Leave a chat room
   */
  public leaveRoom(groupId: string): void {
    if (!this.socket || !this.connected) {
      console.error('Cannot leave room: WebSocket not connected');
      return;
    }
    this.joinedRooms.delete(groupId);
    this.socket.emit(SocketEvents.LEAVE_ROOM, groupId);
  }

  /**
   * Send typing indicator
   */
  public sendTypingStart(groupId: string): void {
    if (!this.socket || !this.connected) return;
    this.socket.emit(SocketEvents.TYPING_START, groupId);
  }

  /**
   * Stop typing indicator
   */
  public sendTypingStop(groupId: string): void {
    if (!this.socket || !this.connected) return;
    this.socket.emit(SocketEvents.TYPING_STOP, groupId);
  }

  /**
   * Add event listener
   */
  public on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);

    // If socket exists, register the listener
    if (this.socket) {
      this.socket.on(event, callback);
    }

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Remove event listener
   */
  public off<T>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) return;

    this.listeners.get(event)!.delete(callback);

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  /**
   * Listen for new chat messages
   */
  public onNewMessage(callback: EventCallback<ChatMessage>): () => void {
    return this.on<ChatMessage>(SocketEvents.NEW_MESSAGE, callback);
  }

  /**
   * Listen for typing indicators
   */
  public onTypingStart(callback: EventCallback<{ userId: string; groupId: string }>): () => void {
    return this.on<{ userId: string; groupId: string }>(SocketEvents.TYPING_START, callback);
  }

  /**
   * Listen for typing stop indicators
   */
  public onTypingStop(callback: EventCallback<{ userId: string; groupId: string }>): () => void {
    return this.on<{ userId: string; groupId: string }>(SocketEvents.TYPING_STOP, callback);
  }

  /**
   * Listen for AI message chunks
   */
  public onAiMessageChunk(callback: EventCallback<AiChatChunk>): () => void {
    return this.on<AiChatChunk>(SocketEvents.AI_MESSAGE_CHUNK, callback);
  }

  /**
   * Listen for AI message completion
   */
  public onAiMessageComplete(callback: EventCallback<AiChatComplete>): () => void {
    return this.on<AiChatComplete>(SocketEvents.AI_MESSAGE_COMPLETE, callback);
  }

  /**
   * Listen for user online status
   */
  public onUserOnline(callback: EventCallback<{ userId: string }>): () => void {
    return this.on<{ userId: string }>(SocketEvents.USER_ONLINE, callback);
  }

  /**
   * Listen for user offline status
   */
  public onUserOffline(callback: EventCallback<{ userId: string }>): () => void {
    return this.on<{ userId: string }>(SocketEvents.USER_OFFLINE, callback);
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
