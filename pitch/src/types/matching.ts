export interface Mentor {
  id: string;
  levelOfStudies: string;
  birthYear: number;
  gender: string;
  nationality: string;
  city: string;
  germanLevel: string;
  englishLevel: string;
  otherLanguages: string;
}

export interface Mentee {
  id: string;
  birthYear: number;
  desiredGender: string;
  englishLevel: string;
  otherLanguages: string;
  gender: string;
  germanLevel: string;
  nationality: string;
  levelOfStudies: string;
  city: string;
}

export interface MatchingCriterion {
  menteeId: string;
  attribute: string;
  condition: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value: string;
}

export interface Match {
  mentorId: string;
  menteeId: string;
  score: number;
  distance: number;
  normalizedScore: number;
  reasons: MatchReason[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface MatchReason {
  criterion: string;
  weight: number;
  contribution: number;
  explanation: string;
}
