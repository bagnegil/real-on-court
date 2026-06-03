// Loads Leaflet from CDN once, on web only (avoids an npm/CSS bundling step).
// `globalThis` access keeps DOM lib types out of the React Native project.
const g: any = globalThis;

export function loadLeaflet(): Promise<any> {
  return new Promise((resolve) => {
    if (g.L) return resolve(g.L);
    const doc = g.document;
    const css = doc.createElement('link');
    css.rel = 'stylesheet';
    css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    doc.head.appendChild(css);
    const script = doc.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.onload = () => resolve(g.L);
    doc.head.appendChild(script);
  });
}

// d3-delaunay for computing Voronoi polygons (court "territories" on the map).
export function loadD3Delaunay(): Promise<any> {
  return new Promise((resolve) => {
    if (g.d3?.Delaunay) return resolve(g.d3);
    const s = g.document.createElement('script');
    s.src = 'https://unpkg.com/d3-delaunay@6/dist/d3-delaunay.min.js';
    s.onload = () => resolve(g.d3);
    g.document.head.appendChild(s);
  });
}
