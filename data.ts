export type CourtStatus = 'pending' | 'approved' | 'rejected';

export type Court = {
  id: string;
  number: number;
  champions: [string, string] | null;
  clubId: string | null;
  status: CourtStatus;
  w3w: string | null;
  lat: number | null;
  lng: number | null;
  createdBy: string | null;
};

export type Club = { id: string; name: string; countryId: string | null };
export type Country = { id: string; name: string };

export type ChallengeStatus = 'pending' | 'accepted' | 'declined' | 'played';

export type Challenge = {
  id: string;
  courtId: string;
  challenger: [string, string];
  day: string;
  time: string; // kick-off time, "HH:MM"
  status: ChallengeStatus;
};

export type Match = {
  id: string;
  courtId: string;
  winners: [string, string] | null;
  losers: [string, string] | null;
  note: string;
  score: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type Player = {
  name: string;
  hometown: string | null;
  country: string | null;
  birthYear: number | null;
  playtomicLevel: number | null;
  playtomicUrl: string | null;
  preferredSide: string | null;
  bio: string | null;
};

export const PREFERRED_SIDES = ['Left', 'Right', 'Both'] as const;

export const CLUB_NAME = 'David Lloyd Rugby';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WEEKEND_DAYS = ['Sat', 'Sun'];

// A booking is assumed to be at least 90 minutes; the aspirant only picks the kick-off time.
export const BOOKING_MINUTES = 90;

// Selectable kick-off times (every 30 min, 06:00 – 23:00).
export const KICKOFF_TIMES: string[] = (() => {
  const out: string[] = [];
  for (let h = 6; h <= 23; h++) {
    out.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 23) out.push(`${String(h).padStart(2, '0')}:30`);
  }
  return out;
})();

export function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(':').map(Number);
  const total = (h * 60 + m + mins) % (24 * 60);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

// Categories that the 3 forcing challenges must cover.
export type SlotCategory = 'morning' | 'evening' | 'weekend';
export const REQUIRED_CATEGORIES: SlotCategory[] = ['morning', 'evening', 'weekend'];
export const CATEGORY_LABEL: Record<SlotCategory, string> = {
  morning: 'Morning',
  evening: 'Evening',
  weekend: 'Weekend',
};

// Morning: 05:00–17:00. Evening: 17:00–05:00. Weekend: Sat/Sun (any time).
export function challengeCategory(day: string, time: string): SlotCategory {
  if (WEEKEND_DAYS.includes(day)) return 'weekend';
  const hour = Number(time.split(':')[0]);
  return hour >= 5 && hour < 17 ? 'morning' : 'evening';
}
