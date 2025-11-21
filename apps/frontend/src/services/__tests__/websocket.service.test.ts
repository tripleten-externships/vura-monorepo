import { describe, beforeEach, it, expect, vi } from 'vitest';
import { WebSocketService, SocketEvents } from '../websocket';

const listeners = new Map<string, (...args: any[]) => void>();

const mockSocket = {
  on: vi.fn((event: string, callback: (...args: any[]) => void) => {
    listeners.set(event, callback);
    return mockSocket;
  }),
  emit: vi.fn(),
  disconnect: vi.fn(),
};

const ioMock = vi.fn(() => mockSocket as any);

const trigger = (event: string, ...args: any[]) => {
  const handler = listeners.get(event);
  if (handler) {
    handler(...args);
  }
};

describe('WebSocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listeners.clear();
  });

  it('passes auth token when establishing socket connection', async () => {
    const service = new WebSocketService({
      apiUrl: 'http://localhost:5000',
      socketFactory: ioMock,
    });

    const connectPromise = service.connect('test-token');
    trigger('connect');
    await connectPromise;

    expect(ioMock).toHaveBeenCalledWith(
      'http://localhost:5000',
      expect.objectContaining({
        auth: { token: 'test-token' },
      })
    );
  });

  it('allows joining rooms after authentication', async () => {
    const service = new WebSocketService({
      apiUrl: 'http://localhost:5000',
      socketFactory: ioMock,
    });

    const connectPromise = service.connect('jwt-token');
    trigger('connect');
    await connectPromise;

    service.joinRoom('forum-1');
    expect(mockSocket.emit).toHaveBeenCalledWith(SocketEvents.JOIN_ROOM, 'forum-1');
  });
});
