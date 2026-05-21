import React, { createContext, useContext, useState } from 'react';
import { Challenge, ChallengeStatus, Court, INITIAL_COURTS, Match } from './data';

type Store = {
  courts: Court[];
  challenges: Challenge[];
  matches: Match[];
  getCourt: (id: string) => Court | undefined;
  challengesForCourt: (courtId: string) => Challenge[];
  matchesForCourt: (courtId: string) => Match[];
  proposeChallenge: (courtId: string, day: string, time: string) => void;
  setChallengeStatus: (id: string, status: ChallengeStatus) => void;
  recordChallengeResult: (challengeId: string, championsWon: boolean) => void;
  claimVacant: (courtId: string, winners: [string, string]) => void;
  vacateCourt: (courtId: string) => void;
};

const StoreContext = createContext<Store | null>(null);

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [courts, setCourts] = useState<Court[]>(INITIAL_COURTS);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);

  function getCourt(id: string) {
    return courts.find((c) => c.id === id);
  }

  function challengesForCourt(courtId: string) {
    return challenges.filter((c) => c.courtId === courtId);
  }

  function matchesForCourt(courtId: string) {
    return matches.filter((m) => m.courtId === courtId);
  }

  function proposeChallenge(courtId: string, day: string, time: string) {
    setChallenges((prev) => [
      ...prev,
      { id: newId(), courtId, challenger: ['You', 'Your partner'], day, time, status: 'pending' },
    ]);
  }

  function setChallengeStatus(id: string, status: ChallengeStatus) {
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  function recordChallengeResult(challengeId: string, championsWon: boolean) {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return;
    const court = courts.find((c) => c.id === challenge.courtId);
    if (!court || !court.champions) return;

    const defenders = court.champions;
    const challengers = challenge.challenger;
    const winners = championsWon ? defenders : challengers;
    const losers = championsWon ? challengers : defenders;

    if (!championsWon) {
      setCourts((prev) =>
        prev.map((c) => (c.id === court.id ? { ...c, champions: challengers } : c)),
      );
    }
    setChallenges((prev) =>
      prev.map((c) => (c.id === challengeId ? { ...c, status: 'played' } : c)),
    );
    setMatches((prev) => [
      {
        id: newId(),
        courtId: court.id,
        winners,
        losers,
        note: championsWon ? 'Champions defended the crown' : 'New champions crowned',
      },
      ...prev,
    ]);
  }

  function claimVacant(courtId: string, winners: [string, string]) {
    setCourts((prev) => prev.map((c) => (c.id === courtId ? { ...c, champions: winners } : c)));
    setMatches((prev) => [
      { id: newId(), courtId, winners, losers: null, note: 'Claimed the vacant court' },
      ...prev,
    ]);
  }

  function vacateCourt(courtId: string) {
    const court = courts.find((c) => c.id === courtId);
    const formerChampions = court?.champions ?? null;
    setCourts((prev) => prev.map((c) => (c.id === courtId ? { ...c, champions: null } : c)));
    setMatches((prev) => [
      {
        id: newId(),
        courtId,
        winners: null,
        losers: formerChampions,
        note: 'Court forfeited — champions failed to defend',
      },
      ...prev,
    ]);
  }

  return (
    <StoreContext.Provider
      value={{
        courts,
        challenges,
        matches,
        getCourt,
        challengesForCourt,
        matchesForCourt,
        proposeChallenge,
        setChallengeStatus,
        recordChallengeResult,
        claimVacant,
        vacateCourt,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error('useStore must be used inside StoreProvider');
  }
  return ctx;
}
