import { useRouter } from 'expo-router';
import { StyleProp, Text, TextStyle } from 'react-native';
import { SIGNED_IN } from './theme';
import { useStore } from './store';

// A player's name rendered as a tappable link to their profile. Uses Text's
// onPress so it composes inline (inside sentences / nested Text) without
// introducing nested Pressables. Names of players with a Supabase account
// are tinted light blue so signed-up users stand out everywhere.
export function PlayerName({ name, style }: { name: string; style?: StyleProp<TextStyle> }) {
  const router = useRouter();
  const { signedUpNames } = useStore();
  const tint = signedUpNames.has(name) ? { color: SIGNED_IN } : null;
  return (
    <Text style={[style, tint]} onPress={() => router.push(`/player/${encodeURIComponent(name)}`)}>
      {name}
    </Text>
  );
}
