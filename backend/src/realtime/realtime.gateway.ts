import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, MessageBody, ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/realtime',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server!: Server;

  private connectedUsers = new Map<string, Set<string>>(); // userId -> Set<socketId>

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    // Remove from connected users
    for (const [userId, sockets] of this.connectedUsers) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.connectedUsers.delete(userId);
        this.server.emit('user:offline', { userId });
      }
    }
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('auth')
  handleAuth(@ConnectedSocket() client: Socket, @MessageBody() data: { userId: string }) {
    if (!this.connectedUsers.has(data.userId)) {
      this.connectedUsers.set(data.userId, new Set());
    }
    this.connectedUsers.get(data.userId)!.add(client.id);

    // Join user's personal room
    client.join(`user:${data.userId}`);

    this.server.emit('user:online', { userId: data.userId });
    return { status: 'authenticated' };
  }

  @SubscribeMessage('join:conversation')
  handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(`conversation:${data.conversationId}`);
    return { status: 'joined' };
  }

  @SubscribeMessage('leave:conversation')
  handleLeaveConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.leave(`conversation:${data.conversationId}`);
    return { status: 'left' };
  }

  @SubscribeMessage('message:send')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; message: any }) {
    this.server.to(`conversation:${data.conversationId}`).emit('message:new', data.message);
  }

  @SubscribeMessage('typing:start')
  handleTypingStart(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; userId: string }) {
    client.to(`conversation:${data.conversationId}`).emit('typing:start', { userId: data.userId, conversationId: data.conversationId });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string; userId: string }) {
    client.to(`conversation:${data.conversationId}`).emit('typing:stop', { userId: data.userId, conversationId: data.conversationId });
  }

  // Utility methods for sending notifications
  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  sendToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}
