import { WebSocketService } from './websocket.service';
import { WebSocketServiceOptions } from './types';

let websocketService: WebSocketService | null = null;

export function initWebSocketService(options: WebSocketServiceOptions): WebSocketService {
  if (!websocketService) {
    websocketService = new WebSocketService(options);
  }
  return websocketService;
}

export function getWebSocketService(): WebSocketService {
  if (!websocketService) {
    throw new Error('WebSocket service has not been initialized');
  }
  return websocketService;
}

export * from './types';
export { WebSocketService } from './websocket.service';
