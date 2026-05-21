import React, { createContext, useContext, useState } from 'react';
import { Challenge, ChallengeStatus, Court, INITIAL_COURTS } from './data';

type Store = {
  courts: Court[];
  challenges: Challenge[];
  getCourt: (id: string) => Court | undefined;
  challengesForCourt: (courtId: string) => Challenge[];
  proposeChallenge: (courtId: string, day: string) => void;
  setChallengeStatus: (id: string, status: ChallengeStatus) => void;
  vacateCourt: (courtId: string) => void;
};

const StoreContext = createContext<Store | null>(null);

function newId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [courts, setCourts] = useState<Court[]>(INITIAL_COURTS);
  const [challenges, setChallenges] = useState<Challenge[]>([]);

  function getCourt(id: string) {
    return courts.find((c) => c.id === id);
  }

  function challengesForCourt(courtId: string) {
    return challenges.filter((c) => c.courtId === courtId);
  }

  function proposeChallenge(courtId: string, day: string) {
    setChallenges((prev) => [
      ...prev,
      { id: newId(), courtId, challenger: ['You', 'Your partner'], day, status: 'pending' },
    ]);
  }

  function setChallengeStatus(id: string, status: ChallengeStatus) {
    setChallenges((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }

  function vacateCourt(courtId: string) {
    setCourts((prev) => prev.map((c) => (c.id === courtId ? { ...c, champions: null } : c)));
  }

  return (
    <StoreContext.Provider
      value={{
        courts,
        challenges,
        getCourt,
        challengesForCourt,
        proposeChallenge,
        setChallengeStatus,
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
