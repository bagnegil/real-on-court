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

// Day/time helpers for the booking flow — show the next 7 days from now, and
// drop past time slots when "today" is selected.
const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export type UpcomingDay = { date: Date; day: string; label: string; sub: string };

export function upcomingDays(now: Date = new Date()): UpcomingDay[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    const day = DOW[d.getDay()];
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : day;
    const sub = `${d.getDate()} ${MONTH[d.getMonth()]}`;
    return { date: d, day, label, sub };
  });
}

export function timesAfterNow(times: readonly string[], date: Date, now: Date = new Date()): string[] {
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (!sameDay) return [...times];
  const cur = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return times.filter((t) => t > cur);
}

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
