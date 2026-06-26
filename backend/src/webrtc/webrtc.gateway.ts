import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchmakingService } from './matchmaking.service';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({ cors: { origin: '*' }, namespace: '/webrtc' })
export class WebRTCGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private matchmakingService: MatchmakingService, private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      if (!token) return client.disconnect();
      const payload = this.jwtService.verify(token);
      client.data.userId = payload.sub;
      client.join(payload.sub); // Join room named after user ID for direct targeting
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    if (client.data.userId) {
      this.matchmakingService.removeFromQueue(client.data.userId);
      this.matchmakingService.handleDisconnect(client.data.userId, this.server);
    }
  }

  // --- STANDARD CALL SIGNALING ---
  
  @SubscribeMessage('call:start')
  handleCallStart(@ConnectedSocket() client: Socket, @MessageBody() data: { targetUserId: string, type: string }) {
    // Notify target user room of incoming call
    this.server.to(data.targetUserId).emit('call:incoming', {
      fromUserId: client.data.userId,
      type: data.type,
      callId: `call_${Date.now()}`
    });
  }

  @SubscribeMessage('webrtc:offer')
  handleOffer(@ConnectedSocket() client: Socket, @MessageBody() data: { targetUserId: string, offer: any, callId: string }) {
    this.server.to(data.targetUserId).emit('webrtc:offer', { fromUserId: client.data.userId, offer: data.offer, callId: data.callId });
  }

  @SubscribeMessage('webrtc:answer')
  handleAnswer(@ConnectedSocket() client: Socket, @MessageBody() data: { targetUserId: string, answer: any, callId: string }) {
    this.server.to(data.targetUserId).emit('webrtc:answer', { fromUserId: client.data.userId, answer: data.answer, callId: data.callId });
  }

  @SubscribeMessage('webrtc:ice-candidate')
  handleIceCandidate(@ConnectedSocket() client: Socket, @MessageBody() data: { targetUserId: string, candidate: any, callId: string }) {
    this.server.to(data.targetUserId).emit('webrtc:ice-candidate', { fromUserId: client.data.userId, candidate: data.candidate, callId: data.callId });
  }

  @SubscribeMessage('call:end')
  handleCallEnd(@ConnectedSocket() client: Socket, @MessageBody() data: { targetUserId: string, callId: string }) {
    this.server.to(data.targetUserId).emit('call:ended', { callId: data.callId });
  }

  // --- RANDOM MATCHMAKING ---

  @SubscribeMessage('match:join_queue')
  handleJoinQueue(@ConnectedSocket() client: Socket, @MessageBody() data: { interests: string[], country: string }) {
    this.matchmakingService.addToQueue(client.data.userId, client.id, data.interests, data.country, this.server);
  }

  @SubscribeMessage('match:leave_queue')
  handleLeaveQueue(@ConnectedSocket() client: Socket) {
    this.matchmakingService.removeFromQueue(client.data.userId);
  }

  @SubscribeMessage('match:skip')
  handleSkip(@ConnectedSocket() client: Socket) {
    this.matchmakingService.skipMatch(client.data.userId, this.server);
  }
}
