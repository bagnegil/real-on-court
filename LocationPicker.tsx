import { useEffect, useRef } from 'react';
import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { CARD, CREAM, GOLD, MUTED } from './theme';
import { loadLeaflet } from './leafletWeb';

// Lets a player set a court's exact location. On web: tap a Leaflet map to
// drop/move a pin. On native (no map yet): manual latitude/longitude fields.
export function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number, lng: number) => void;
}) {
  const ref = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let cancelled = false;
    loadLeaflet().then((L) => {
      if (cancelled || !ref.current || !L || mapRef.current) return;
      const hasPin = lat != null && lng != null;
      const map = L.map(ref.current).setView(hasPin ? [lat, lng] : [40, -3], hasPin ? 14 : 4);
      mapRef.current = map;
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);
      if (hasPin) markerRef.current = L.marker([lat, lng]).addTo(map);
      map.on('click', (e: any) => {
        const la = Number(e.latlng.lat.toFixed(6));
        const ln = Number(e.latlng.lng.toFixed(6));
        if (markerRef.current) markerRef.current.setLatLng([la, ln]);
        else markerRef.current = L.marker([la, ln]).addTo(map);
        onChange(la, ln);
      });
      setTimeout(() => map.invalidateSize(), 150);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (Platform.OS !== 'web') {
    return (
      <View style={styles.manualRow}>
        <TextInput
          style={styles.manualInput}
          placeholder="Latitude"
          placeholderTextColor={MUTED}
          value={lat != null ? String(lat) : ''}
          onChangeText={(t) => onChange(Number(t) || 0, lng ?? 0)}
        />
        <TextInput
          style={styles.manualInput}
          placeholder="Longitude"
          placeholderTextColor={MUTED}
          value={lng != null ? String(lng) : ''}
          onChangeText={(t) => onChange(lat ?? 0, Number(t) || 0)}
        />
      </View>
    );
  }

  return (
    <View>
      <div
        ref={ref}
        style={{ width: '100%', height: 220, borderRadius: 10, overflow: 'hidden', backgroundColor: CARD }}
      />
      <Text style={styles.coordText}>
        {lat != null && lng != null ? `Pinned at ${lat}, ${lng}` : 'Tap the map to drop a pin'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  manualRow: { flexDirection: 'row', gap: 10 },
  manualInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: MUTED,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    color: CREAM,
    fontSize: 15,
    backgroundColor: CARD,
  },
  coordText: { color: GOLD, fontSize: 13, marginTop: 8 },
});
