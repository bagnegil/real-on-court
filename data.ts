export type Court = {
  id: string;
  number: number;
  champions: [string, string] | null;
};

export type ChallengeStatus = 'pending' | 'accepted' | 'declined';

export type Challenge = {
  id: string;
  courtId: string;
  challenger: [string, string];
  day: string;
  status: ChallengeStatus;
};

export const CLUB_NAME = 'David Lloyd Rugby';

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const INITIAL_COURTS: Court[] = [
  { id: '1', number: 1, champions: ['Carlos M.', 'Javier P.'] },
  { id: '2', number: 2, champions: null },
  { id: '3', number: 3, champions: ['Ana R.', 'Lucia F.'] },
];
