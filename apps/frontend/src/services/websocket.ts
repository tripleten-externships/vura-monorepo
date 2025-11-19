import { io, Socket } from 'socket.io-client';
import { AUTH_TOKEN_KEY } from './storage';

export enum SocketEvents {
  AUTHENTICATE = 'authenticate',
  AUTHENTICATION_SUCCESS = 'authentication:success',
  AUTHENTICATION_ERROR = 'authentication:error',
  JOIN_ROOM = 'join:room',
  LEAVE_ROOM = 'leave:room',
  NEW_MESSAGE = 'chat:new_message',
  MESSAGE_RECEIVED = 'chat:message_received',
  TYPING_START = 'chat:typing:start',
  TYPING_STOP = 'chat:typing:stop',
  AI_MESSAGE_START = 'ai:message:start',
  AI_MESSAGE_CHUNK = 'ai:message:chunk',
  AI_MESSAGE_COMPLETE = 'ai:message:complete',
  AI_MESSAGE_ERROR = 'ai:message:error',
  USER_ONLINE = 'user:online',
  USER_OFFLINE = 'user:offline',
  CAREPLAN_CREATED = 'carePlan:created',
  CAREPLAN_UPDATED = 'carePlan:updated',
  CAREPLAN_DELETED = 'carePlan:deleted',
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
type SocketFactory = typeof io;

const DEFAULT_API_URL =
  typeof VITE_API_URL !== 'undefined' && VITE_API_URL ? VITE_API_URL : 'http://localhost:3001';
const isBrowser = typeof window !== 'undefined';

const resolveBaseUrl = (raw: string): URL => {
  try {
    return new URL(raw);
  } catch {
    return new URL(DEFAULT_API_URL);
  }
};

export interface WebSocketServiceOptions {
  apiUrl?: string;
  socketFactory?: SocketFactory;
}

export class WebSocketService {
  private socket: Socket | null = null;
  private connected = false;
  private token: string | null = null;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly listeners: EventListeners = new Map();
  private readonly joinedRooms: Set<string> = new Set();
  private readonly baseUrl: URL;
  private readonly socketFactory: SocketFactory;

  constructor(options: WebSocketServiceOptions = {}) {
    this.baseUrl = resolveBaseUrl(options.apiUrl ?? DEFAULT_API_URL);
    this.socketFactory = options.socketFactory ?? io;

    if (isBrowser) {
      window.addEventListener('storage', (event) => {
        if (event.key !== AUTH_TOKEN_KEY) return;
        const newToken = event.newValue;
        if (newToken && newToken !== this.token) {
          this.disconnect();
          this.connect(newToken).catch((err) => console.error('Reconnect failed:', err));
        } else if (!newToken && this.token) {
          this.disconnect();
        }
      });
    }
  }

  public connect(token: string): Promise<void> {
    if (this.socket && this.connected) {
      return Promise.resolve();
    }

    this.token = token;

    return new Promise((resolve, reject) => {
      try {
        this.socket = this.socketFactory(this.baseUrl.origin, {
          path: '/socket.io',
          withCredentials: true,
          reconnection: true,
          reconnectionAttempts: this.maxReconnectAttempts,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
          auth: token ? { token } : undefined,
          ...(token && !isBrowser
            ? {
                transportOptions: {
                  polling: {
                    extraHeaders: {
                      Authorization: `Bearer ${token}`,
                    },
                  },
                },
              }
            : {}),
        });

        this.socket.on('connect', () => {
          this.connected = true;
          this.reconnectAttempts = 0;
          for (const [event, callbacks] of this.listeners.entries()) {
            for (const cb of callbacks) {
              this.socket!.on(event, cb);
            }
          }
          for (const groupId of this.joinedRooms.values()) {
            this.socket!.emit(SocketEvents.JOIN_ROOM, groupId);
          }
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          if (!this.connected) {
            reject(error);
          }
        });

        this.socket.on('disconnect', (reason) => {
          this.connected = false;
          if (reason === 'io server disconnect') {
            this.reconnect();
          }
        });

        this.socket.on(SocketEvents.AUTHENTICATION_ERROR, (error) => {
          this.disconnect();
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  private reconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts && this.token) {
      this.reconnectAttempts++;
      this.connect(this.token).catch(() => undefined);
    }
  }

  public joinRoom(groupId: string): void {
    if (!this.socket || !this.connected) return;
    this.joinedRooms.add(groupId);
    this.socket.emit(SocketEvents.JOIN_ROOM, groupId);
  }

  public leaveRoom(groupId: string): void {
    if (!this.socket || !this.connected) return;
    this.joinedRooms.delete(groupId);
    this.socket.emit(SocketEvents.LEAVE_ROOM, groupId);
  }

  public sendTypingStart(groupId: string): void {
    if (!this.socket || !this.connected) return;
    this.socket.emit(SocketEvents.TYPING_START, groupId);
  }

  public sendTypingStop(groupId: string): void {
    if (!this.socket || !this.connected) return;
    this.socket.emit(SocketEvents.TYPING_STOP, groupId);
  }

  public on<T>(event: string, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(callback);
    if (this.socket) {
      this.socket.on(event, callback);
    }

    return () => this.off(event, callback);
  }

  public off<T>(event: string, callback: EventCallback<T>): void {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event)!.delete(callback);
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  public onNewMessage(callback: EventCallback<ChatMessage>): () => void {
    return this.on(SocketEvents.NEW_MESSAGE, callback);
  }

  public onTypingStart(callback: EventCallback<{ userId: string; groupId: string }>): () => void {
    return this.on(SocketEvents.TYPING_START, callback);
  }

  public onTypingStop(callback: EventCallback<{ userId: string; groupId: string }>): () => void {
    return this.on(SocketEvents.TYPING_STOP, callback);
  }

  public onAiMessageChunk(callback: EventCallback<AiChatChunk>): () => void {
    return this.on(SocketEvents.AI_MESSAGE_CHUNK, callback);
  }

  public onAiMessageComplete(callback: EventCallback<AiChatComplete>): () => void {
    return this.on(SocketEvents.AI_MESSAGE_COMPLETE, callback);
  }

  public onUserOnline(callback: EventCallback<{ userId: string }>): () => void {
    return this.on(SocketEvents.USER_ONLINE, callback);
  }

  public onUserOffline(callback: EventCallback<{ userId: string }>): () => void {
    return this.on(SocketEvents.USER_OFFLINE, callback);
  }

  public onCarePlanCreated(callback: EventCallback<any>): () => void {
    return this.on(SocketEvents.CAREPLAN_CREATED, callback);
  }

  public onCarePlanUpdated(callback: EventCallback<any>): () => void {
    return this.on(SocketEvents.CAREPLAN_UPDATED, callback);
  }

  public onCarePlanDeleted(callback: EventCallback<any>): () => void {
    return this.on(SocketEvents.CAREPLAN_DELETED, callback);
  }

  public enableDebugLogging(): void {
    if (!this.socket) {
      console.warn('Socket not initialized yet.');
      return;
    }

    const originalEmit = this.socket.emit.bind(this.socket);
    this.socket.emit = function (event: string, ...args: any[]) {
      console.log('Socket OUT:', event, args);
      return originalEmit(event, ...args);
    };

    const originalOnevent = (this.socket as any).onevent;
    (this.socket as any).onevent = function (packet: any) {
      console.log('Socket IN:', packet.data);
      if (originalOnevent) {
        originalOnevent.call(this, packet);
      }
    };
  }

  public enableSocketIODebug(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.debug = 'socket.io-client:*';
    }
  }
}

export const websocketService = new WebSocketService();

if (typeof window !== 'undefined') {
  (window as any).websocketService = websocketService;
}
