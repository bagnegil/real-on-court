import React, { createContext, useContext, useEffect, useState } from 'react';
import { Challenge, ChallengeStatus, Club, Country, Court, CourtStatus, Match, Player } from './data';
import { supabase } from './supabase';

// Returned by every mutation so callers can react to failure instead of
// assuming success. recordChallengeResult adds the human-readable outcome note.
type Result = { error?: string };

// A new court request. Country/club are referenced by id, or created by name.
export type AddCourtInput = {
  countryId?: string;
  newCountryName?: string;
  clubId?: string;
  newClubName?: string;
  number: number;
  w3w: string | null;
  lat: number | null;
  lng: number | null;
  champions: [string, string];
};

type Store = {
  courts: Court[];
  challenges: Challenge[];
  matches: Match[];
  players: Player[];
  countries: Country[];
  clubs: Club[];
  // Display names of every Supabase auth account (one per profiles row).
  signedUpNames: Set<string>;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  getCourt: (id: string) => Court | undefined;
  getPlayer: (name: string) => Player | undefined;
  getClub: (id: string | null) => Club | undefined;
  getCountry: (id: string | null) => Country | undefined;
  addCourt: (input: AddCourtInput) => Promise<Result>;
  setCourtStatus: (courtId: string, status: CourtStatus) => Promise<Result>;
  updateCourtW3W: (courtId: string, w3w: string) => Promise<Result>;
  updateCourtCoords: (courtId: string, lat: number, lng: number) => Promise<Result>;
  challengesForCourt: (courtId: string) => Challenge[];
  matchesForCourt: (courtId: string) => Match[];
  updatePlayer: (name: string, fields: Partial<Omit<Player, 'name'>>) => Promise<Result>;
  proposeChallenge: (
    courtId: string,
    day: string,
    time: string,
    challenger: [string, string],
  ) => Promise<Result>;
  setChallengeStatus: (id: string, status: ChallengeStatus) => Promise<Result>;
  recordChallengeResult: (
    challengeId: string,
    defendersWon: boolean,
    defenders?: [string, string],
    score?: string | null,
  ) => Promise<Result & { note?: string }>;
  claimVacant: (
    courtId: string,
    winners: [string, string],
    losers?: [string, string],
    score?: string | null,
  ) => Promise<Result>;
  vacateCourt: (courtId: string) => Promise<Result>;
};

const StoreContext = createContext<Store | null>(null);

// Supabase row shapes (snake_case, a pair stored as two text columns; both null = vacant).
type CourtRow = {
  id: string;
  number: number;
  champion1: string | null;
  champion2: string | null;
  club_id: string | null;
  status: CourtStatus;
  w3w: string | null;
  lat: number | null;
  lng: number | null;
  created_by: string | null;
};
type ClubRow = { id: string; name: string; country_id: string | null };
type CountryRow = { id: string; name: string };
type ChallengeRow = {
  id: string;
  court_id: string;
  challenger1: string;
  challenger2: string;
  day: string;
  time: string;
  status: ChallengeStatus;
};
type MatchRow = {
  id: string;
  court_id: string;
  winner1: string | null;
  winner2: string | null;
  loser1: string | null;
  loser2: string | null;
  note: string;
  score: string | null;
  created_at: string;
};

type PlayerRow = {
  name: string;
  hometown: string | null;
  country: string | null;
  birth_year: number | null;
  playtomic_level: number | null;
  playtomic_url: string | null;
  preferred_side: string | null;
  bio: string | null;
};

function toPlayer(r: PlayerRow): Player {
  return {
    name: r.name,
    hometown: r.hometown,
    country: r.country,
    birthYear: r.birth_year,
    playtomicLevel: r.playtomic_level,
    playtomicUrl: r.playtomic_url,
    preferredSide: r.preferred_side,
    bio: r.bio,
  };
}

function toCourt(r: CourtRow): Court {
  return {
    id: r.id,
    number: r.number,
    champions: r.champion1 && r.champion2 ? [r.champion1, r.champion2] : null,
    clubId: r.club_id,
    status: r.status,
    w3w: r.w3w,
    lat: r.lat,
    lng: r.lng,
    createdBy: r.created_by,
  };
}

function toClub(r: ClubRow): Club {
  return { id: r.id, name: r.name, countryId: r.country_id };
}

function toCountry(r: CountryRow): Country {
  return { id: r.id, name: r.name };
}

function toChallenge(r: ChallengeRow): Challenge {
  return {
    id: r.id,
    courtId: r.court_id,
    challenger: [r.challenger1, r.challenger2],
    day: r.day,
    time: r.time,
    status: r.status,
  };
}

function toMatch(r: MatchRow): Match {
  return {
    id: r.id,
    courtId: r.court_id,
    winners: r.winner1 && r.winner2 ? [r.winner1, r.winner2] : null,
    losers: r.loser1 && r.loser2 ? [r.loser1, r.loser2] : null,
    note: r.note,
    score: r.score,
    createdAt: r.created_at,
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [courts, setCourts] = useState<Court[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [signedUpNames, setSignedUpNames] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    const [c, ch, ma, pl, co, cl, pf] = await Promise.all([
      supabase.from('courts').select('*').order('number'),
      supabase.from('challenges').select('*').order('created_at'),
      supabase.from('matches').select('*').order('created_at', { ascending: false }),
      supabase.from('players').select('*'),
      supabase.from('countries').select('*').order('name'),
      supabase.from('clubs').select('*').order('name'),
      supabase.from('profiles').select('name'),
    ]);
    const failed = c.error || ch.error || ma.error || pl.error || co.error || cl.error || pf.error;
    if (failed) {
      setError(failed.message);
      setLoading(false);
      return;
    }
    setCourts((c.data ?? []).map(toCourt));
    setChallenges((ch.data ?? []).map(toChallenge));
    setMatches((ma.data ?? []).map(toMatch));
    setPlayers((pl.data ?? []).map(toPlayer));
    setCountries((co.data ?? []).map(toCountry));
    setClubs((cl.data ?? []).map(toClub));
    setSignedUpNames(new Set((pf.data ?? []).map((r: any) => r.name).filter(Boolean)));
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // Live updates from other devices. Requires the tables to be in the
    // `supabase_realtime` publication (see the realtime SQL in the repo notes);
    // harmless no-op until then.
    const channel = supabase
      .channel('roc-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'courts' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'challenges' }, () => refresh())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => refresh())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function getCourt(id: string) {
    return courts.find((c) => c.id === id);
  }

  function getPlayer(name: string) {
    return players.find((p) => p.name === name);
  }

  function getClub(id: string | null) {
    return id ? clubs.find((c) => c.id === id) : undefined;
  }

  function getCountry(id: string | null) {
    return id ? countries.find((c) => c.id === id) : undefined;
  }

  function fail(message: string): Result {
    setError(message);
    return { error: message };
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
      return { error: err.message };
    }
    setChallenges((prev) => [...prev, toChallenge(data)]);
    return {};
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
      return { error: err.message };
    }
    setChallenges((prev) => prev.map((c) => (c.id === id ? toChallenge(data) : c)));
    return {};
  }

  async function recordChallengeResult(
    challengeId: string,
    defendersWon: boolean,
    defenders?: [string, string],
    score?: string | null,
  ) {
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) return { error: 'Challenge no longer available.' };
    const court = courts.find((c) => c.id === challenge.courtId);
    if (!court || !court.champions) return { error: 'This court has no champions to defend.' };

    const original = court.champions;
    const challengers = challenge.challenger;
    // The pair that actually defended (may be one original champion + a substitute).
    const defendingPair = defenders ?? original;
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
        .update({ champion1: winners[0], champion2: winners[1] })
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
          score: score ?? null,
        })
        .select()
        .single(),
    ]);
    const err = courtRes.error || chRes.error || maRes.error;
    if (err) {
      setError(err.message);
      return { error: err.message };
    }
    setCourts((prev) => prev.map((c) => (c.id === court.id ? toCourt(courtRes.data) : c)));
    setChallenges((prev) => prev.map((c) => (c.id === challengeId ? toChallenge(chRes.data) : c)));
    setMatches((prev) => [toMatch(maRes.data), ...prev]);
    return { note };
  }

  async function claimVacant(
    courtId: string,
    winners: [string, string],
    losers?: [string, string],
    score?: string | null,
  ) {
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
          score: score ?? null,
        })
        .select()
        .single(),
    ]);
    const err = courtRes.error || maRes.error;
    if (err) {
      setError(err.message);
      return { error: err.message };
    }
    setCourts((prev) => prev.map((c) => (c.id === courtId ? toCourt(courtRes.data) : c)));
    setMatches((prev) => [toMatch(maRes.data), ...prev]);
    return {};
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
      return { error: err.message };
    }
    setCourts((prev) => prev.map((c) => (c.id === courtId ? toCourt(courtRes.data) : c)));
    setMatches((prev) => [toMatch(maRes.data), ...prev]);
    return {};
  }

  async function updatePlayer(name: string, fields: Partial<Omit<Player, 'name'>>) {
    const row = {
      name,
      hometown: fields.hometown ?? null,
      country: fields.country ?? null,
      birth_year: fields.birthYear ?? null,
      playtomic_level: fields.playtomicLevel ?? null,
      playtomic_url: fields.playtomicUrl ?? null,
      preferred_side: fields.preferredSide ?? null,
      bio: fields.bio ?? null,
    };
    const { data, error: err } = await supabase
      .from('players')
      .upsert(row, { onConflict: 'name' })
      .select()
      .single();
    if (err) {
      setError(err.message);
      return { error: err.message };
    }
    const updated = toPlayer(data);
    setPlayers((prev) => {
      const without = prev.filter((p) => p.name !== name);
      return [...without, updated];
    });
    return {};
  }

  async function addCourt(input: AddCourtInput): Promise<Result> {
    let countryId = input.countryId ?? null;
    if (!countryId && input.newCountryName?.trim()) {
      const { data, error: err } = await supabase
        .from('countries')
        .insert({ name: input.newCountryName.trim() })
        .select()
        .single();
      if (err) return fail(err.message);
      countryId = data.id;
      setCountries((prev) => [...prev, toCountry(data)]);
    }

    let clubId = input.clubId ?? null;
    if (!clubId && input.newClubName?.trim()) {
      const { data, error: err } = await supabase
        .from('clubs')
        .insert({ name: input.newClubName.trim(), country_id: countryId })
        .select()
        .single();
      if (err) return fail(err.message);
      clubId = data.id;
      setClubs((prev) => [...prev, toClub(data)]);
    }
    if (!clubId) return { error: 'Pick or name a club.' };

    const userId = (await supabase.auth.getUser()).data.user?.id ?? null;
    const { data, error: err } = await supabase
      .from('courts')
      .insert({
        club_id: clubId,
        number: input.number,
        champion1: input.champions[0],
        champion2: input.champions[1],
        w3w: input.w3w,
        lat: input.lat,
        lng: input.lng,
        status: 'pending',
        created_by: userId,
      })
      .select()
      .single();
    if (err) return fail(err.message);
    setCourts((prev) => [...prev, toCourt(data)]);
    return {};
  }

  async function setCourtStatus(courtId: string, status: CourtStatus): Promise<Result> {
    const { data, error: err } = await supabase
      .from('courts')
      .update({ status })
      .eq('id', courtId)
      .select()
      .single();
    if (err) return fail(err.message);
    setCourts((prev) => prev.map((c) => (c.id === courtId ? toCourt(data) : c)));
    return {};
  }

  async function updateCourtW3W(courtId: string, w3w: string): Promise<Result> {
    const { data, error: err } = await supabase
      .from('courts')
      .update({ w3w })
      .eq('id', courtId)
      .select()
      .single();
    if (err) return fail(err.message);
    setCourts((prev) => prev.map((c) => (c.id === courtId ? toCourt(data) : c)));
    return {};
  }

  async function updateCourtCoords(courtId: string, lat: number, lng: number): Promise<Result> {
    const { data, error: err } = await supabase
      .from('courts')
      .update({ lat, lng })
      .eq('id', courtId)
      .select()
      .single();
    if (err) return fail(err.message);
    setCourts((prev) => prev.map((c) => (c.id === courtId ? toCourt(data) : c)));
    return {};
  }

  return (
    <StoreContext.Provider
      value={{
        courts,
        challenges,
        matches,
        players,
        countries,
        clubs,
        signedUpNames,
        loading,
        error,
        refresh,
        getCourt,
        getPlayer,
        getClub,
        getCountry,
        addCourt,
        setCourtStatus,
        updateCourtW3W,
        updateCourtCoords,
        challengesForCourt,
        matchesForCourt,
        proposeChallenge,
        setChallengeStatus,
        recordChallengeResult,
        claimVacant,
        vacateCourt,
        updatePlayer,
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
