import { Injectable } from '@nestjs/common';

interface MatchCandidate {
  userId: string;
  interests: string[];
  hobbies: string[];
  skills: string[];
  languages: string[];
  categories: string[];
  availability: any;
  timezone: string | null;
  city: string | null;
  country: string | null;
}

export interface MatchResult {
  userId: string;
  score: number;
  explanation: MatchExplanation;
}

interface MatchExplanation {
  sharedInterests: string[];
  sharedHobbies: string[];
  sharedSkills: string[];
  sharedLanguages: string[];
  sharedCategories: string[];
  locationMatch: boolean;
  timezoneMatch: boolean;
  availabilityOverlap: number;
  reasons: string[];
}

@Injectable()
export class MatchingEngine {
  // Weights for different matching criteria
  private readonly WEIGHTS = {
    interests: 25,
    hobbies: 20,
    skills: 15,
    languages: 10,
    categories: 15,
    location: 8,
    timezone: 4,
    availability: 3,
  };

  calculateMatch(user: MatchCandidate, candidate: MatchCandidate): MatchResult {
    const explanation: MatchExplanation = {
      sharedInterests: [],
      sharedHobbies: [],
      sharedSkills: [],
      sharedLanguages: [],
      sharedCategories: [],
      locationMatch: false,
      timezoneMatch: false,
      availabilityOverlap: 0,
      reasons: [],
    };

    let totalScore = 0;

    // Shared interests (25%)
    const sharedInterests = this.findOverlap(user.interests, candidate.interests);
    explanation.sharedInterests = sharedInterests;
    if (sharedInterests.length > 0) {
      const interestScore = Math.min(sharedInterests.length / Math.max(user.interests.length, 1), 1);
      totalScore += interestScore * this.WEIGHTS.interests;
      explanation.reasons.push(`${sharedInterests.length} shared interest${sharedInterests.length > 1 ? 's' : ''}: ${sharedInterests.slice(0, 3).join(', ')}`);
    }

    // Shared hobbies (20%)
    const sharedHobbies = this.findOverlap(user.hobbies, candidate.hobbies);
    explanation.sharedHobbies = sharedHobbies;
    if (sharedHobbies.length > 0) {
      const hobbyScore = Math.min(sharedHobbies.length / Math.max(user.hobbies.length, 1), 1);
      totalScore += hobbyScore * this.WEIGHTS.hobbies;
      explanation.reasons.push(`${sharedHobbies.length} shared hobb${sharedHobbies.length > 1 ? 'ies' : 'y'}: ${sharedHobbies.slice(0, 3).join(', ')}`);
    }

    // Shared skills (15%)
    const sharedSkills = this.findOverlap(user.skills, candidate.skills);
    explanation.sharedSkills = sharedSkills;
    if (sharedSkills.length > 0) {
      const skillScore = Math.min(sharedSkills.length / Math.max(user.skills.length, 1), 1);
      totalScore += skillScore * this.WEIGHTS.skills;
      explanation.reasons.push(`${sharedSkills.length} complementary skill${sharedSkills.length > 1 ? 's' : ''}`);
    }

    // Shared languages (10%)
    const sharedLanguages = this.findOverlap(user.languages, candidate.languages);
    explanation.sharedLanguages = sharedLanguages;
    if (sharedLanguages.length > 0) {
      const langScore = Math.min(sharedLanguages.length / Math.max(user.languages.length, 1), 1);
      totalScore += langScore * this.WEIGHTS.languages;
      explanation.reasons.push(`Speaks ${sharedLanguages.join(', ')}`);
    }

    // Shared categories (15%)
    const sharedCategories = this.findOverlap(user.categories, candidate.categories);
    explanation.sharedCategories = sharedCategories;
    if (sharedCategories.length > 0) {
      const catScore = Math.min(sharedCategories.length / Math.max(user.categories.length, 1), 1);
      totalScore += catScore * this.WEIGHTS.categories;
      const categoryLabels = sharedCategories.map((c) => this.formatCategory(c));
      explanation.reasons.push(`Looking for: ${categoryLabels.slice(0, 2).join(', ')}`);
    }

    // Location match (8%)
    if (user.city && candidate.city && user.city.toLowerCase() === candidate.city.toLowerCase()) {
      explanation.locationMatch = true;
      totalScore += this.WEIGHTS.location;
      explanation.reasons.push(`Same city: ${candidate.city}`);
    } else if (user.country && candidate.country && user.country.toLowerCase() === candidate.country.toLowerCase()) {
      explanation.locationMatch = true;
      totalScore += this.WEIGHTS.location * 0.5;
      explanation.reasons.push(`Same country: ${candidate.country}`);
    }

    // Timezone match (4%)
    if (user.timezone && candidate.timezone && user.timezone === candidate.timezone) {
      explanation.timezoneMatch = true;
      totalScore += this.WEIGHTS.timezone;
      explanation.reasons.push('Same timezone');
    }

    // Availability overlap (3%)
    const availOverlap = this.calculateAvailabilityOverlap(user.availability, candidate.availability);
    explanation.availabilityOverlap = availOverlap;
    if (availOverlap > 0) {
      totalScore += (availOverlap / 100) * this.WEIGHTS.availability;
      explanation.reasons.push('Schedule overlap');
    }

    return {
      userId: candidate.userId,
      score: Math.round(totalScore),
      explanation,
    };
  }

  private findOverlap(a: string[], b: string[]): string[] {
    const setB = new Set(b.map((s) => s.toLowerCase()));
    return a.filter((item) => setB.has(item.toLowerCase()));
  }

  private calculateAvailabilityOverlap(a: any, b: any): number {
    if (!a || !b) return 0;
    // Simplified: check if both have overlapping time slots
    try {
      const schedA = typeof a === 'string' ? JSON.parse(a) : a;
      const schedB = typeof b === 'string' ? JSON.parse(b) : b;
      if (!schedA || !schedB) return 0;

      const daysA = new Set(Object.keys(schedA));
      const daysB = new Set(Object.keys(schedB));
      const sharedDays = [...daysA].filter((d) => daysB.has(d));

      return sharedDays.length > 0 ? Math.round((sharedDays.length / 7) * 100) : 0;
    } catch {
      return 0;
    }
  }

  private formatCategory(category: string): string {
    return category
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Batch matching for discovery
  findBestMatches(user: MatchCandidate, candidates: MatchCandidate[], limit = 20): MatchResult[] {
    const results = candidates
      .filter((c) => c.userId !== user.userId)
      .map((candidate) => this.calculateMatch(user, candidate))
      .filter((result) => result.score > 10) // Minimum 10% compatibility
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  }
}
