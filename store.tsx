import React, { createContext, useContext, useEffect, useState } from 'react';
import { Challenge, ChallengeStatus, Court, Match } from './data';
import { supabase } from './supabase';

type Store = {
  courts: Court[];
  challenges: Challenge[];
  matches: Match[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getCourt: (id: string) => Court | undefined;
  challengesForCourt: (courtId: string) => Challenge[];
  matchesForCourt: (courtId: string) => Match[];
  proposeChallenge: (
    courtId: string,
    day: string,
    time: string,
    challenger: [string, string],
  ) => Promise<void>;
  setChallengeStatus: (id: string, status: ChallengeStatus) => Promise<void>;
  recordChallengeResult: (
    challengeId: string,
    defendersWon: boolean,
    defenders?: [string, string],
  ) => Promise<void>;
  claimVacant: (courtId: string, winners: [string, string], losers?: [string, string]) => Promise<void>;
  vacateCourt: (courtId: string) => Promise<void>;
};

const StoreContext = createContext<Store | null>(null);

// --- Mappers: Supabase rows (snake_case, separate columns) -> app types. ---
// A pair is stored as two text columns; null/null means vacant.
function toCourt(r: any): Court {
  return {
    id: r.id,
    number: r.number,
    champions: r.champion1 && r.champion2 ? [r.champion1, r.champion2] : null,
  };
}

function toChallenge(r: any): Challenge {
  return {
    id: r.id,
    courtId: r.court_id,
    challenger: [r.challenger1, r.challenger2],
    day: r.day,
    time: r.time,
    status: r.status,
  };
}

function toMatch(r: any): Match {
  return {
    id: r.id,
    courtId: r.court_id,
    winners: r.winner1 && r.winner2 ? [r.winner1, r.winner2] : null,
    losers: r.loser1 && r.loser2 ? [r.loser1, r.loser2] : null,
    note: r.note,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    const [c, ch, ma] = await Promise.all([
      supabase.from('courts').select('*').order('number'),
      supabase.from('challenges').select('*').order('created_at'),
      supabase.from('matches').select('*').order('created_at', { ascending: false }),
    ]);
    const failed = c.error || ch.error || ma.error;
    if (failed) {
      setError(failed.message);
      setLoading(false);
      return;
    }
    setCourts((c.data ?? []).map(toCourt));
    setChallenges((ch.data ?? []).map(toChallenge));
    setMatches((ma.data ?? []).map(toMatch));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  function getCourt(id: string) {
    return courts.find((c) => c.id === id);
  }

  function challengesForCourt(courtId: string) {
    return challenges.filter((c) => c.courtId === courtId);
  }

  function matchesForCourt(courtId: string) {
    return matches.filter((m) => m.courtId === courtId);
  }

  async function proposeChallenge(
    courtId: string,
    day: string,
    time: string,
    challenger: [string, string],
  ) {
    const { data, error: err } = await supabase
      .from('challenges')
      .insert({
        court_id: courtId,
        challenger1: challenger[0],
        challenger2: challenger[1],
        day,
        time,
        status: 'pending',
      })
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setChallenges((prev) => [...prev, toChallenge(data)]);
  }

  async function setChallengeStatus(id: string, status: ChallengeStatus) {
    const { data, error: err } = await supabase
      .from('challenges')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    if (err) {
      setError(err.message);
      return;
    }
    setChallenges((prev) => prev.map((c) => (c.id === id ? toChallenge(data) : c)));
  }

  async function recordChallengeResult(
    challengeId: string,
    defendersWon: boolean,
    defenders?: [string, string],
  ) {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return;
    const court = courts.find((c) => c.id === challenge.courtId);
    if (!court || !court.champions) return;

    const original = court.champions;
    const challengers = challenge.challenger;
    // The pair that actually defended (may be one original champion + a substitute).
    const defendingPair = defenders ?? original;
    const newChampions = defendersWon ? defendingPair : challengers;
    const winners = defendersWon ? defendingPair : challengers;
    const losers = defendersWon ? challengers : defendingPair;
    const subbed =
      defendersWon && (defendingPair[0] !== original[0] || defendingPair[1] !== original[1]);
    const note = defendersWon
      ? subbed
        ? 'Defended with a substitute — new lineup'
        : 'Champions defended the crown'
      : 'New champions crowned';

    const [courtRes, chRes, maRes] = await Promise.all([
      supabase
        .from('courts')
        .update({ champion1: newChampions[0], champion2: newChampions[1] })
        .eq('id', court.id)
        .select()
        .single(),
      supabase.from('challenges').update({ status: 'played' }).eq('id', challengeId).select().single(),
      supabase
        .from('matches')
        .insert({
          court_id: court.id,
          winner1: winners[0],
          winner2: winners[1],
          loser1: losers[0],
          loser2: losers[1],
          note,
        })
        .select()
        .single(),
    ]);
    const err = courtRes.error || chRes.error || maRes.error;
    if (err) {
      setError(err.message);
      return;
    }
    setCourts((prev) => prev.map((c) => (c.id === court.id ? toCourt(courtRes.data) : c)));
    setChallenges((prev) => prev.map((c) => (c.id === challengeId ? toChallenge(chRes.data) : c)));
    setMatches((prev) => [toMatch(maRes.data), ...prev]);
  }

  async function claimVacant(courtId: string, winners: [string, string], losers?: [string, string]) {
    const [courtRes, maRes] = await Promise.all([
      supabase
        .from('courts')
        .update({ champion1: winners[0], champion2: winners[1] })
        .eq('id', courtId)
        .select()
        .single(),
      supabase
        .from('matches')
        .insert({
          court_id: courtId,
          winner1: winners[0],
          winner2: winners[1],
          loser1: losers?.[0] ?? null,
          loser2: losers?.[1] ?? null,
          note: losers ? 'Won the vacant court' : 'Claimed the vacant court',
        })
        .select()
        .single(),
    ]);
    const err = courtRes.error || maRes.error;
    if (err) {
      setError(err.message);
      return;
    }
    setCourts((prev) => prev.map((c) => (c.id === courtId ? toCourt(courtRes.data) : c)));
    setMatches((prev) => [toMatch(maRes.data), ...prev]);
  }

  async function vacateCourt(courtId: string) {
    const court = courts.find((c) => c.id === courtId);
    const former = court?.champions ?? null;
    const [courtRes, maRes] = await Promise.all([
      supabase
        .from('courts')
        .update({ champion1: null, champion2: null })
        .eq('id', courtId)
        .select()
        .single(),
      supabase
        .from('matches')
        .insert({
          court_id: courtId,
          winner1: null,
          winner2: null,
          loser1: former?.[0] ?? null,
          loser2: former?.[1] ?? null,
          note: 'Court forfeited — champions failed to defend',
        })
        .select()
        .single(),
    ]);
    const err = courtRes.error || maRes.error;
    if (err) {
      setError(err.message);
      return;
    }
    setCourts((prev) => prev.map((c) => (c.id === courtId ? toCourt(courtRes.data) : c)));
    setMatches((prev) => [toMatch(maRes.data), ...prev]);
  }

  return (
    <StoreContext.Provider
      value={{
        courts,
        challenges,
        matches,
        loading,
        error,
        refresh,
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
