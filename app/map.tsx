import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { CREAM, MUTED, NAVY } from '../theme';
import { useStore } from '../store';
import { loadLeaflet } from '../leafletWeb';

export default function MapScreen() {
  const { courts, getClub } = useStore();
  const ref = useRef<any>(null);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    const pins = courts.filter((c) => c.status === 'approved' && c.lat != null && c.lng != null);
    loadLeaflet().then((L) => {
      if (cancelled || !ref.current || !L) return;
      if (!mapRef.current) {
        mapRef.current = L.map(ref.current).setView([46, 2], 4);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap',
          maxZoom: 19,
        }).addTo(mapRef.current);
      }
      const map = mapRef.current;
      (map._rocMarkers ?? []).forEach((m: any) => map.removeLayer(m));
      map._rocMarkers = [];
      const bounds: [number, number][] = [];
      pins.forEach((c) => {
        const club = getClub(c.clubId);
        const champs = c.champions ? `${c.champions[0]} & ${c.champions[1]}` : 'Vacant';
        const marker = L.marker([c.lat, c.lng]).addTo(map);
        marker.bindPopup(
          `<b>Court ${c.number}</b><br/>${club ? club.name : ''}<br/>${champs}` +
            `<br/><a href="/court/${c.id}">Open court →</a>`,
        );
        map._rocMarkers.push(marker);
        bounds.push([c.lat as number, c.lng as number]);
      });
      if (bounds.length) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
      setTimeout(() => map.invalidateSize(), 150);
    });
    return () => {
      cancelled = true;
    };
  }, [courts, getClub]);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ title: 'Courts map' }} />
        <Text style={styles.note}>The map is available on the web version for now.</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Courts map' }} />
      <div ref={ref} style={{ width: '100%', height: '100%', backgroundColor: NAVY }} />
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: NAVY, alignItems: 'center', justifyContent: 'center', padding: 24 },
  note: { color: CREAM, fontSize: 15, textAlign: 'center' },
  muted: { color: MUTED },
});
