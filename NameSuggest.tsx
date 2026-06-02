import { useMemo, useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextStyle, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED, SIGNED_IN } from './theme';
import { useStore } from './store';

// Text input with a typeahead drop-down of matching player names. Signed-up
// players (with a Supabase account) appear first and are tinted + ✓-marked
// so it's obvious which suggestions are real accounts vs community names.
export function NameSuggest({
  value,
  onChange,
  placeholder,
  inputStyle,
  exclude = [],
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputStyle?: StyleProp<TextStyle>;
  exclude?: (string | null | undefined)[];
}) {
  const { players, signedUpNames } = useStore();
  const [focused, setFocused] = useState(false);

  const allNames = useMemo(() => {
    const set = new Set<string>();
    signedUpNames.forEach((n) => set.add(n));
    players.forEach((p) => set.add(p.name));
    return [...set];
  }, [signedUpNames, players]);

  const matches = useMemo(() => {
    const q = value.trim().toLowerCase();
    if (!q) return [];
    const excludeSet = new Set(
      exclude.filter(Boolean).map((e) => (e as string).toLowerCase()),
    );
    return allNames
      .filter(
        (n) =>
          !excludeSet.has(n.toLowerCase()) &&
          n.toLowerCase().includes(q) &&
          n.toLowerCase() !== q,
      )
      .sort((a, b) => {
        const aSU = signedUpNames.has(a) ? 0 : 1;
        const bSU = signedUpNames.has(b) ? 0 : 1;
        return aSU - bSU || a.localeCompare(b);
      })
      .slice(0, 6);
  }, [value, allNames, exclude, signedUpNames]);

  const showDropdown = focused && matches.length > 0;

  return (
    <View>
      <TextInput
        style={inputStyle}
        placeholder={placeholder}
        placeholderTextColor={MUTED}
        autoCapitalize="words"
        value={value}
        onChangeText={onChange}
        onFocus={() => setFocused(true)}
        // Delay blur so a tap on a suggestion registers before the list disappears.
        onBlur={() => setTimeout(() => setFocused(false), 120)}
      />
      {showDropdown ? (
        <View style={styles.dropdown}>
          {matches.map((n) => (
            <Pressable
              key={n}
              style={styles.row}
              onPress={() => {
                onChange(n);
                setFocused(false);
              }}
            >
              <Text style={[styles.name, signedUpNames.has(n) && styles.nameSignedIn]}>
                {n}
                {signedUpNames.has(n) ? '  ✓' : ''}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dropdown: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 10,
    overflow: 'hidden',
    zIndex: 100,
    elevation: 4,
  },
  row: { paddingVertical: 10, paddingHorizontal: 14 },
  name: { color: CREAM, fontSize: 15 },
  nameSignedIn: { color: SIGNED_IN, fontWeight: '600' },
});
