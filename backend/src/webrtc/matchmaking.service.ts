import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';
import { PrismaService } from '../common/prisma.service';

interface QueueUser {
  userId: string;
  socketId: string;
  interests: string[];
  country: string;
}

@Injectable()
export class MatchmakingService {
  private queue: QueueUser[] = [];
  private activeMatches: Map<string, string> = new Map(); // userId -> matchedUserId

  constructor(private prisma: PrismaService) {}

  addToQueue(userId: string, socketId: string, interests: string[], country: string, server: Server) {
    // Avoid duplicates
    this.removeFromQueue(userId);
    if (this.activeMatches.has(userId)) {
      this.skipMatch(userId, server);
    }

    this.queue.push({ userId, socketId, interests, country });
    this.tryMatch(server);
  }

  removeFromQueue(userId: string) {
    this.queue = this.queue.filter(u => u.userId !== userId);
  }

  private tryMatch(server: Server) {
    if (this.queue.length < 2) return;

    // Simple matching: just take first two
    const user1 = this.queue.shift();
    const user2 = this.queue.shift();

    if (user1 && user2) {
      const callId = `random_${Date.now()}`;
      
      this.activeMatches.set(user1.userId, user2.userId);
      this.activeMatches.set(user2.userId, user1.userId);

      // Notify both users they found a match via their private room channels
      server.to(user1.userId).emit('match:found', { matchedUserId: user2.userId, callId, isInitiator: true });
      server.to(user2.userId).emit('match:found', { matchedUserId: user1.userId, callId, isInitiator: false });
    }
  }

  skipMatch(userId: string, server: Server) {
    const matchedUser = this.activeMatches.get(userId);
    if (matchedUser) {
      this.activeMatches.delete(userId);
      this.activeMatches.delete(matchedUser);

      // Notify the other user that the match skipped
      server.to(matchedUser).emit('match:ended', { reason: 'partner_skipped' });
      server.to(userId).emit('match:ended', { reason: 'skipped' });
    }
  }

  handleDisconnect(userId: string, server: Server) {
    this.skipMatch(userId, server);
  }
}
