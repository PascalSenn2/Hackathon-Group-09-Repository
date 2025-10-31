import { Mentor, Mentee, Match, MatchReason, MatchingCriterion } from '@/types/matching';

// Language level mapping
const languageLevelMap: { [key: string]: number } = {
  'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6,
  'Beginner': 1, 'Elementary': 2, 'Intermediate': 3, 
  'Upper Intermediate': 4, 'Advanced': 5, 'Proficient': 6, 'Muttersprache / Native language': 6
};

// Study level mapping
const studyLevelMap: { [key: string]: number } = {
  'Other': 0, 'Bachelor': 1, 'Master': 2, 'Doktorat / PhD': 3, 'PostDoc': 4, 'Professor': 5
};

// Weights for different matching criteria
const WEIGHTS = {
  age: 0.30,
  gender: 0.20,
  language: 0.50,
  city: 0.15,
  studyLevel: 0.15,
  nationality: 1
};

function getLanguageLevel(level: string): number {
  return languageLevelMap[level] || 0;
}

function getStudyLevel(level: string): number {
  return studyLevelMap[level] || 0;
}

function calculateAgeDifference(mentor: Mentor, mentee: Mentee): number {
  const ageDiff = Math.abs(mentor.birthYear - mentee.birthYear);
  // Normalize to 0-1, assuming max reasonable age difference is 30 years
  return Math.min(ageDiff / 30, 1);
}

function calculateGenderMatch(mentor: Mentor, mentee: Mentee): number {
  if (mentee.desiredGender.toLowerCase() === 'doesn\'t matter') {
    return 0; // Neutral match
  }
  return mentor.gender.toLowerCase() === mentee.desiredGender.toLowerCase() ? 0 : 1;
}

function calculateLanguageMatch(mentor: Mentor, mentee: Mentee): number {
  const mentorGerman = getLanguageLevel(mentor.germanLevel);
  const menteeGerman = getLanguageLevel(mentee.germanLevel);
  const mentorEnglish = getLanguageLevel(mentor.englishLevel);
  const menteeEnglish = getLanguageLevel(mentee.englishLevel);

  const germanDiff = Math.abs(mentorGerman - menteeGerman);
  const englishDiff = Math.abs(mentorEnglish - menteeEnglish);

  // Take the better language match
  const bestMatch = Math.min(germanDiff, englishDiff);
  return Math.min(bestMatch / 6, 1); // Normalize to 0-1
}

function calculateCityMatch(mentor: Mentor, mentee: Mentee): number {
  if (mentor.city.toLowerCase() === mentee.city.toLowerCase()) {
    return 0; // Perfect match
  }
  // For now, assume different cities = 1 (could be enhanced with actual distance calculation)
  return 1;
}

function calculateStudyLevelMatch(mentor: Mentor, mentee: Mentee): number {
  const mentorLevel = getStudyLevel(mentor.levelOfStudies);
  const menteeLevel = getStudyLevel(mentee.levelOfStudies);
  
  if (mentorLevel >= menteeLevel) {
    return 0; // Good match - mentor is at or above mentee level
  }
  // Penalty for mentor being below mentee
  return Math.min((menteeLevel - mentorLevel) / 4, 1);
}

function calculateNationalityMatch(mentor: Mentor, mentee: Mentee): number {
  return mentor.nationality.toLowerCase() === mentee.nationality.toLowerCase() ? 0 : 1;
}

function passesExclusionCriteria(
  mentor: Mentor,
  mentee: Mentee,
  criteria: MatchingCriterion[]
): boolean {
  for (const criterion of criteria) {
    // Only apply criterion if it matches this mentee
    if (criterion.menteeId !== mentee.id) continue;
    
    // Check the attribute value based on whether it's mentorId or another attribute
    const value = criterion.attribute === 'mentorId' 
      ? mentor.id 
      : (mentor as any)[criterion.attribute];
    
    const criterionValue = criterion.value.toLowerCase();
    const actualValue = value?.toString().toLowerCase() || '';
    
    switch (criterion.condition) {
      case 'equals':
        if (actualValue === criterionValue) return false;
        break;
      case 'not_equals':
        if (actualValue !== criterionValue) return false;
        break;
      case 'at_least':
        if (Number(actualValue) >= Number(criterionValue)) return false;
        break;
      case 'at_most':
        if (Number(actualValue) <= Number(criterionValue)) return false;
        break;
    }
  }
  return true;
}

export function calculateMatches(
  mentors: Mentor[],
  mentees: Mentee[],
  exclusionCriteria: MatchingCriterion[] = []
): Match[] {
  const matches: Match[] = [];

  for (const mentor of mentors) {
    for (const mentee of mentees) {
      // Check exclusion criteria
      if (!passesExclusionCriteria(mentor, mentee, exclusionCriteria)) {
        continue;
      }

      const ageDiff = calculateAgeDifference(mentor, mentee);
      const genderMatch = calculateGenderMatch(mentor, mentee);
      const languageMatch = calculateLanguageMatch(mentor, mentee);
      const cityMatch = calculateCityMatch(mentor, mentee);
      const studyMatch = calculateStudyLevelMatch(mentor, mentee);
      const nationalityMatch = calculateNationalityMatch(mentor, mentee);

      const distance = 
        WEIGHTS.age * ageDiff +
        WEIGHTS.gender * genderMatch +
        WEIGHTS.language * languageMatch +
        WEIGHTS.city * cityMatch +
        WEIGHTS.studyLevel * studyMatch +
        WEIGHTS.nationality * nationalityMatch;

      const reasons: MatchReason[] = [
        {
          criterion: 'Age Difference',
          weight: WEIGHTS.age,
          contribution: WEIGHTS.age * ageDiff,
          explanation: `Age difference: ${Math.abs(mentor.birthYear - mentee.birthYear)} years (${mentor.birthYear} / ${mentee.birthYear})`
        },
        {
          criterion: 'Gender Preference',
          weight: WEIGHTS.gender,
          contribution: WEIGHTS.gender * genderMatch,
          explanation: genderMatch === 0 ? 'Prefered gender matched / no gender preference' : 'Gender preference mismatch'
        },
        {
          criterion: 'Language Compatibility',
          weight: WEIGHTS.language,
          contribution: WEIGHTS.language * languageMatch,
          explanation: `Language levels - German: ${mentor.germanLevel}/${mentee.germanLevel}, English: ${mentor.englishLevel}/${mentee.englishLevel}`
        },
        {
          criterion: 'Location',
          weight: WEIGHTS.city,
          contribution: WEIGHTS.city * cityMatch,
          explanation: cityMatch === 0 ? `Same city: ${mentor.city}` : `Different cities: ${mentor.city} / ${mentee.city}`
        },
        {
          criterion: 'Academic Level',
          weight: WEIGHTS.studyLevel,
          contribution: WEIGHTS.studyLevel * studyMatch,
          explanation: `Study levels: ${mentor.levelOfStudies} | ${mentee.levelOfStudies}`
        },
        {
          criterion: 'Nationality',
          weight: WEIGHTS.nationality,
          contribution: WEIGHTS.nationality * nationalityMatch,
          explanation: nationalityMatch === 0 ? `Same nationality: ${mentor.nationality}` : 'Different nationalities'
        }
      ];

      matches.push({
        mentorId: mentor.id,
        menteeId: mentee.id,
        score: 1 - distance,
        distance,
        normalizedScore: 0, // Will be calculated after
        reasons,
        status: 'pending'
      });
    }
  }

  // Normalize scores
  const distances = matches.map(m => m.distance);
  const minDist = Math.min(...distances);
  const maxDist = Math.max(...distances);
  const range = maxDist - minDist || 1;

  matches.forEach(match => {
    match.normalizedScore = 1 - ((match.distance - minDist) / range);
  });

  return matches.sort((a, b) => b.normalizedScore - a.normalizedScore);
}

export function getTopMatches(
  matches: Match[],
  mentorId?: string,
  menteeId?: string,
  limit: number = 3
): Match[] {
  let filtered = matches;
  
  if (mentorId) {
    filtered = matches.filter(m => m.mentorId === mentorId);
  } else if (menteeId) {
    filtered = matches.filter(m => m.menteeId === menteeId);
  }

  return filtered.slice(0, limit);
}
