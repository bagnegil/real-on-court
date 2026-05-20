export type Court = {
  id: string;
  number: number;
  champions: [string, string] | null;
};

export const CLUB_NAME = 'David Lloyd Rugby';

export const COURTS: Court[] = [
  { id: '1', number: 1, champions: ['Carlos M.', 'Javier P.'] },
  { id: '2', number: 2, champions: null },
  { id: '3', number: 3, champions: ['Ana R.', 'Lucia F.'] },
];

export function getCourt(id: string): Court | undefined {
  return COURTS.find((c) => c.id === id);
}
