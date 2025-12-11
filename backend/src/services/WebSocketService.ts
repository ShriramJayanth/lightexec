import { WebSocketServer, WebSocket } from 'ws';
import { Logger } from 'pino';
import { nanoid } from 'nanoid';

interface WebSocketClient {
  id: string;
  ws: WebSocket;
  executionId?: string;
}

const clients = new Map<string, WebSocketClient>();

export function setupWebSocket(wss: WebSocketServer, logger: Logger): void {
  wss.on('connection', (ws: WebSocket) => {
    const clientId = nanoid();
    const client: WebSocketClient = { id: clientId, ws };
    clients.set(clientId, client);

    logger.info(`WebSocket client connected: ${clientId}`);

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'subscribe' && data.executionId) {
          client.executionId = data.executionId;
          logger.debug(`Client ${clientId} subscribed to execution ${data.executionId}`);
        }
      } catch (error) {
        logger.error(`Error parsing WebSocket message from ${clientId}:`, error);
      }
    });

    ws.on('close', () => {
      clients.delete(clientId);
      logger.info(`WebSocket client disconnected: ${clientId}`);
    });

    ws.on('error', (error) => {
      logger.error(`WebSocket error for client ${clientId}:`, error);
    });

    // Send welcome message
    ws.send(JSON.stringify({
      type: 'connected',
      clientId,
      timestamp: new Date().toISOString(),
    }));
  });
}

export function broadcastExecutionUpdate(executionId: string, data: any): void {
  for (const client of clients.values()) {
    if (client.executionId === executionId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        type: 'execution_update',
        executionId,
        data,
        timestamp: new Date().toISOString(),
      }));
    }
  }
}

export function broadcastSystemStats(stats: any): void {
  const message = JSON.stringify({
    type: 'system_stats',
    data: stats,
    timestamp: new Date().toISOString(),
  });

  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}
