import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { MatchingEngine } from './matching.engine';

const COMPANION_CATEGORIES = [
  'friend', 'study_partner', 'language_partner', 'gaming_partner',
  'mentor', 'accountability_partner', 'travel_companion', 'local_guide',
  'fitness_partner', 'walking_partner', 'business_networking',
  'creative_collaborator', 'book_club_partner', 'hobby_partner',
  'event_companion', 'emotional_support', 'volunteer_partner',
];

@Injectable()
export class CompanioService {
  constructor(
    private prisma: PrismaService,
    private matchingEngine: MatchingEngine,
  ) {}

  async createOrUpdateProfile(userId: string, data: {
    introduction?: string;
    aboutMe?: string;
    interests?: string[];
    hobbies?: string[];
    skills?: string[];
    languages?: string[];
    education?: string;
    occupation?: string;
    availability?: any;
    timezone?: string;
    city?: string;
    country?: string;
    categories?: string[];
  }) {
    const existing = await this.prisma.companionProfile.findUnique({ where: { userId } });

    const profileData = {
      introduction: data.introduction,
      aboutMe: data.aboutMe,
      interests: data.interests ? JSON.stringify(data.interests) : undefined,
      hobbies: data.hobbies ? JSON.stringify(data.hobbies) : undefined,
      skills: data.skills ? JSON.stringify(data.skills) : undefined,
      languages: data.languages ? JSON.stringify(data.languages) : undefined,
      education: data.education,
      occupation: data.occupation,
      availability: data.availability ? JSON.stringify(data.availability) : undefined,
      timezone: data.timezone,
      city: data.city,
      country: data.country,
    };

    let profile;
    if (existing) {
      profile = await this.prisma.companionProfile.update({
        where: { userId },
        data: profileData,
      });
    } else {
      profile = await this.prisma.companionProfile.create({
        data: { userId, ...profileData },
      });
    }

    // Update categories
    if (data.categories) {
      await this.prisma.companionCategory.deleteMany({ where: { profileId: profile.id } });
      await this.prisma.companionCategory.createMany({
        data: data.categories.map((cat) => ({
          profileId: profile.id,
          category: cat,
        })),
      });
    }

    return this.getProfile(userId);
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.companionProfile.findUnique({
      where: { userId },
      include: {
        user: { include: { profile: true, trustScore: true } },
        categories: true,
      },
    });

    if (!profile) return null;

    return {
      ...profile,
      interests: profile.interests ? JSON.parse(profile.interests) : [],
      hobbies: profile.hobbies ? JSON.parse(profile.hobbies) : [],
      skills: profile.skills ? JSON.parse(profile.skills) : [],
      languages: profile.languages ? JSON.parse(profile.languages) : [],
      availability: profile.availability ? JSON.parse(profile.availability) : null,
    };
  }

  async discover(userId: string, filters: {
    category?: string;
    city?: string;
    country?: string;
    language?: string;
    verifiedOnly?: boolean;
    skip?: number;
    take?: number;
  }) {
    // Get current user's companion profile
    const userProfile = await this.prisma.companionProfile.findUnique({
      where: { userId },
      include: { categories: true },
    });

    if (!userProfile) {
      throw new NotFoundException('Create a Companion profile first');
    }

    // Build filter
    const where: any = {
      userId: { not: userId },
      active: true,
    };

    if (filters.category) {
      where.categories = { some: { category: filters.category } };
    }
    if (filters.city) where.city = { contains: filters.city };
    if (filters.country) where.country = { contains: filters.country };
    if (filters.language) {
      where.languages = { contains: filters.language };
    }

    const candidates = await this.prisma.companionProfile.findMany({
      where,
      include: {
        user: { include: { profile: true, trustScore: true } },
        categories: true,
      },
      skip: filters.skip || 0,
      take: filters.take || 30,
    });

    // Run matching engine
    const userCandidate = this.profileToCandidate(userProfile);
    const candidateData = candidates.map((c) => this.profileToCandidate(c));
    const matches = this.matchingEngine.findBestMatches(userCandidate, candidateData);

    // Merge match scores with profile data
    const matchMap = new Map(matches.map((m) => [m.userId, m]));

    const results = candidates
      .map((c) => {
        const match = matchMap.get(c.userId);
        return {
          profile: {
            ...c,
            interests: c.interests ? JSON.parse(c.interests) : [],
            hobbies: c.hobbies ? JSON.parse(c.hobbies) : [],
            skills: c.skills ? JSON.parse(c.skills) : [],
            languages: c.languages ? JSON.parse(c.languages) : [],
          },
          compatibility: match ? {
            score: match.score,
            reasons: match.explanation.reasons,
            sharedInterests: match.explanation.sharedInterests,
            sharedHobbies: match.explanation.sharedHobbies,
          } : {
            score: 0,
            reasons: [],
            sharedInterests: [],
            sharedHobbies: [],
          },
        };
      })
      .sort((a, b) => b.compatibility.score - a.compatibility.score);

    return results;
  }

  async getMatches(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
        status: { in: ['suggested', 'accepted'] },
      },
      include: {
        user1: { include: { profile: true, companionProfile: { include: { categories: true } } } },
        user2: { include: { profile: true, companionProfile: { include: { categories: true } } } },
      },
      orderBy: { score: 'desc' },
    });

    return matches.map((m) => {
      const otherUser = m.user1Id === userId ? m.user2 : m.user1;
      return {
        matchId: m.id,
        score: m.score,
        category: m.category,
        explanation: m.explanation ? JSON.parse(m.explanation) : null,
        status: m.status,
        user: {
          id: otherUser.id,
          username: otherUser.username,
          displayName: otherUser.profile?.displayName,
          avatar: otherUser.profile?.avatar,
          companionProfile: otherUser.companionProfile,
        },
      };
    });
  }

  async respondToMatch(userId: string, matchId: string, accept: boolean) {
    const match = await this.prisma.match.findUnique({ where: { id: matchId } });
    if (!match) throw new NotFoundException('Match not found');

    const isUser1 = match.user1Id === userId;
    const isUser2 = match.user2Id === userId;
    if (!isUser1 && !isUser2) throw new NotFoundException('Match not found');

    const updateData: any = {};
    if (isUser1) updateData.user1Accepted = accept;
    if (isUser2) updateData.user2Accepted = accept;

    if (!accept) {
      updateData.status = 'declined';
    } else {
      // Check if both accepted
      const otherAccepted = isUser1 ? match.user2Accepted : match.user1Accepted;
      if (otherAccepted) {
        updateData.status = 'accepted';
      }
    }

    return this.prisma.match.update({
      where: { id: matchId },
      data: updateData,
    });
  }

  getCategories() {
    return COMPANION_CATEGORIES.map((cat) => ({
      id: cat,
      name: cat.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    }));
  }

  private profileToCandidate(profile: any) {
    return {
      userId: profile.userId,
      interests: profile.interests ? (typeof profile.interests === 'string' ? JSON.parse(profile.interests) : profile.interests) : [],
      hobbies: profile.hobbies ? (typeof profile.hobbies === 'string' ? JSON.parse(profile.hobbies) : profile.hobbies) : [],
      skills: profile.skills ? (typeof profile.skills === 'string' ? JSON.parse(profile.skills) : profile.skills) : [],
      languages: profile.languages ? (typeof profile.languages === 'string' ? JSON.parse(profile.languages) : profile.languages) : [],
      categories: profile.categories ? profile.categories.map((c: any) => c.category || c) : [],
      availability: profile.availability,
      timezone: profile.timezone,
      city: profile.city,
      country: profile.country,
    };
  }
}
