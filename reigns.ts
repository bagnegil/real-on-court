import { Match } from './data';

export const DAY_MS = 86_400_000;

// Order-independent identity for a pair, so [A,B] and [B,A] are the same reign.
export function pairKey(pair: [string, string]) {
  return [...pair].sort().join(' & ');
}

export function humanizeDays(days: number) {
  if (days < 30) return `${days} day${days === 1 ? '' : 's'}`;
  const months = Math.floor(days / 30);
  const rest = days % 30;
  return rest ? `${months} mo ${rest} d` : `${months} mo`;
}

export type Standing = { label: string; days: number; courtId: string };

type Acc = { label: string; ms: number; lastCourtId: string; lastSince: number };

function groupByCourt(matches: Match[]) {
  const byCourt = new Map<string, Match[]>();
  for (const m of matches) {
    const list = byCourt.get(m.courtId) ?? [];
    list.push(m);
    byCourt.set(m.courtId, list);
  }
  return byCourt;
}

function ascByDate(matches: Match[]) {
  return [...matches].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

// Walk a court's history: a win by the current holder is a defense (no change),
// a win by a new pair starts a new reign, a forfeit (no winner) ends one. The
// current holder's reign stays open until `now`. Totals time held per pair.
export function standingsFromMatches(matches: Match[]): Standing[] {
  const totals = new Map<string, Acc>();
  const now = Date.now();

  for (const [courtId, list] of groupByCourt(matches)) {
    let holderKey: string | null = null;
    let holderLabel = '';
    let since = 0;

    const close = (end: number) => {
      if (!holderKey) return;
      const acc = totals.get(holderKey) ?? { label: holderLabel, ms: 0, lastCourtId: courtId, lastSince: -1 };
      acc.ms += Math.max(0, end - since);
      if (since >= acc.lastSince) {
        acc.lastSince = since;
        acc.lastCourtId = courtId;
      }
      totals.set(holderKey, acc);
    };

    for (const m of ascByDate(list)) {
      const t = new Date(m.createdAt).getTime();
      if (m.winners) {
        const key = pairKey(m.winners);
        if (key !== holderKey) {
          close(t);
          holderKey = key;
          holderLabel = `${m.winners[0]} & ${m.winners[1]}`;
          since = t;
        }
      } else {
        close(t);
        holderKey = null;
      }
    }
    close(now);
  }

  return [...totals.values()]
    .map((v) => ({ label: v.label, days: Math.round(v.ms / DAY_MS), courtId: v.lastCourtId }))
    .filter((v) => v.days > 0)
    .sort((a, b) => b.days - a.days);
}

export type PlayerReign = { courtId: string; partner: string; days: number; current: boolean };

// Every reign a player was part of, across all courts (the open reign is current).
export function playerReigns(matches: Match[], name: string): PlayerReign[] {
  const out: PlayerReign[] = [];
  const now = Date.now();

  for (const [courtId, list] of groupByCourt(matches)) {
    let holder: [string, string] | null = null;
    let holderKey: string | null = null;
    let since = 0;

    const close = (end: number, current: boolean) => {
      if (!holder || !holder.includes(name)) return;
      const partner = holder[0] === name ? holder[1] : holder[0];
      out.push({ courtId, partner, days: Math.round(Math.max(0, end - since) / DAY_MS), current });
    };

    for (const m of ascByDate(list)) {
      const t = new Date(m.createdAt).getTime();
      if (m.winners) {
        const key = pairKey(m.winners);
        if (key !== holderKey) {
          close(t, false);
          holder = m.winners;
          holderKey = key;
          since = t;
        }
      } else {
        close(t, false);
        holder = null;
        holderKey = null;
      }
    }
    close(now, true);
  }

  return out.filter((r) => r.days > 0 || r.current).sort((a, b) => b.days - a.days);
}

// Start time (ms) of the court's current open reign, or null if vacant.
export function currentReignStart(courtMatches: Match[]): number | null {
  let holderKey: string | null = null;
  let since: number | null = null;
  for (const m of ascByDate(courtMatches)) {
    const t = new Date(m.createdAt).getTime();
    if (m.winners) {
      const key = pairKey(m.winners);
      if (key !== holderKey) {
        holderKey = key;
        since = t;
      }
    } else {
      holderKey = null;
      since = null;
    }
  }
  return holderKey ? since : null;
}
