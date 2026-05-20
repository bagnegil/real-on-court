import { Platform } from 'react-native';

export const NAVY = '#182C44';
export const CARD = '#21395A';
export const GOLD = '#C9A24B';
export const CREAM = '#E7D9B0';
export const MUTED = '#8FA0B5';

export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia, serif' });
