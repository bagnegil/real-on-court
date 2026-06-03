// what3words API helper. Resolves a 3-word address to lat/lng so map pins
// can match the w3w on each court automatically. Key is referrer-restricted
// to our site on the what3words dashboard — safe to ship in the bundle.
const W3W_KEY = 'V8DOIDGF';

export async function w3wToCoords(words: string): Promise<{ lat: number; lng: number } | null> {
  const clean = words.replace(/^\/+/, '').trim();
  if (!clean) return null;
  try {
    const r = await fetch(
      `https://api.what3words.com/v3/convert-to-coordinates?words=${encodeURIComponent(clean)}&key=${W3W_KEY}`,
    );
    if (!r.ok) return null;
    const d = await r.json();
    const lat = d?.coordinates?.lat;
    const lng = d?.coordinates?.lng;
    if (typeof lat === 'number' && typeof lng === 'number') return { lat, lng };
    return null;
  } catch {
    return null;
  }
}
