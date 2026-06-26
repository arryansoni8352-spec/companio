import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

const adapter = new PrismaBetterSqlite3({ url: 'dev.db' });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Wiping database...');
  // Delete everything
  await prisma.aIMessage.deleteMany();
  await prisma.aIConversation.deleteMany();
  await prisma.aICompanion.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.callParticipant.deleteMany();
  await prisma.callSession.deleteMany();
  
  await prisma.notification.deleteMany();
  await prisma.notificationSetting.deleteMany();
  await prisma.privacySetting.deleteMany();
  await prisma.review.deleteMany();
  await prisma.trustScore.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.block.deleteMany();
  await prisma.report.deleteMany();
  await prisma.eventRSVP.deleteMany();
  await prisma.event.deleteMany();
  await prisma.communityPost.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();
  await prisma.match.deleteMany();
  await prisma.matchPreference.deleteMany();
  await prisma.companionCategory.deleteMany();
  await prisma.companionProfile.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.bookmark.deleteMany();
  await prisma.save.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.story.deleteMany();
  await prisma.post.deleteMany();
  await prisma.follow.deleteMany();
  
  await prisma.loginHistory.deleteMany();
  await prisma.device.deleteMany();
  await prisma.session.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database wiped.');

  // Create Admin
  const admin = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@companio.test',
      passwordHash: '$2b$10$iOF1j5uPc9CXeDQeKyJeee6dtsJ9S/NYBqjEaJ4Fh1eQ0iU7v4c9a', // Hash of 'AdminPassword123!'
      role: 'admin',
      verified: true,
      profile: {
        create: {
          displayName: 'Companio Admin',
          bio: 'Official platform administrator.',
        }
      }
    }
  });

  console.log('Admin account created:', admin.username);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
