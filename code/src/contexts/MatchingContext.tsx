import React, { createContext, useContext, useState } from 'react';
import { Mentor, Mentee, Match, MatchingCriterion } from '@/types/matching';

interface MatchingContextType {
  mentors: Mentor[];
  mentees: Mentee[];
  criteria: MatchingCriterion[];
  matches: Match[];
  setMentors: (mentors: Mentor[]) => void;
  setMentees: (mentees: Mentee[]) => void;
  addCriterion: (criterion: MatchingCriterion) => void;
  removeCriterion: (index: number) => void;
  setMatches: (matches: Match[]) => void;
  updateMatch: (mentorId: string, menteeId: string, status: 'approved' | 'rejected') => void;
}

const MatchingContext = createContext<MatchingContextType | undefined>(undefined);

export function MatchingProvider({ children }: { children: React.ReactNode }) {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [mentees, setMentees] = useState<Mentee[]>([]);
  const [criteria, setCriteria] = useState<MatchingCriterion[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  const addCriterion = (criterion: MatchingCriterion) => {
    setCriteria([...criteria, criterion]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateMatch = (mentorId: string, menteeId: string, status: 'approved' | 'rejected') => {
    setMatches(matches.map(match => 
      match.mentorId === mentorId && match.menteeId === menteeId
        ? { ...match, status }
        : match
    ));
  };

  return (
    <MatchingContext.Provider
      value={{
        mentors,
        mentees,
        criteria,
        matches,
        setMentors,
        setMentees,
        addCriterion,
        removeCriterion,
        setMatches,
        updateMatch
      }}
    >
      {children}
    </MatchingContext.Provider>
  );
}

export function useMatching() {
  const context = useContext(MatchingContext);
  if (context === undefined) {
    throw new Error('useMatching must be used within a MatchingProvider');
  }
  return context;
}
