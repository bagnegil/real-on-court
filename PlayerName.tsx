import { useRouter } from 'expo-router';
import { StyleProp, Text, TextStyle } from 'react-native';

// A player's name rendered as a tappable link to their profile. Uses Text's
// onPress so it composes inline (inside sentences / nested Text) without
// introducing nested Pressables.
export function PlayerName({ name, style }: { name: string; style?: StyleProp<TextStyle> }) {
  const router = useRouter();
  return (
    <Text style={style} onPress={() => router.push(`/player/${encodeURIComponent(name)}`)}>
      {name}
    </Text>
  );
}
