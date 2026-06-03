import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { CREAM, MUTED, NAVY } from '../theme';
import { useStore } from '../store';
import { loadD3Delaunay, loadLeaflet } from '../leafletWeb';

// Deterministic colour for a champion pair: hash → HSL so the same pair always
// gets the same hue. Vacant courts get muted grey.
function pairColor(pair: [string, string] | null) {
  if (!pair) return '#7c8595';
  const key = [...pair].sort().join('|');
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return `hsl(${h % 360}, 60%, 55%)`;
}

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
      (map._rocPolys ?? []).forEach((p: any) => map.removeLayer(p));
      map._rocPolys = [];

      // Draw Voronoi territories under the markers — each court "owns" the
      // area closest to it, coloured by its champion pair.
      loadD3Delaunay().then((d3: any) => {
        if (!d3?.Delaunay || pins.length === 0) return;
        const pts = pins.map((c) => [c.lng as number, c.lat as number]);
        const lngs = pts.map((p) => p[0]);
        const lats = pts.map((p) => p[1]);
        const pad = 10; // generous padding so cells extend well beyond the pins
        const box: [number, number, number, number] = [
          Math.min(...lngs) - pad,
          Math.min(...lats) - pad,
          Math.max(...lngs) + pad,
          Math.max(...lats) + pad,
        ];
        const voronoi = d3.Delaunay.from(pts).voronoi(box);
        pins.forEach((c, i) => {
          const cell = voronoi.cellPolygon(i);
          if (!cell) return;
          const latlngs = cell.map(([lng, lat]: number[]) => [lat, lng]);
          const color = pairColor(c.champions);
          const poly = L.polygon(latlngs, {
            color,
            weight: 1.5,
            fillColor: color,
            fillOpacity: 0.32,
          }).addTo(map);
          map._rocPolys.push(poly);
        });
      });

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
