// Player settings and case results, kept in localStorage.
export const settings = (() => {
  const d = { bright: 1.3, sens: 1.0, vol: 0.8, quality: 'medium', qualityManual: false, fov: 70, invert: false, calm: false, sub: 1, pads: true };
  try { return { ...d, ...JSON.parse(localStorage.getItem('hb_settings') || '{}') }; } catch { return d; }
})();
export const saveSettings = () => { try { localStorage.setItem('hb_settings', JSON.stringify(settings)); } catch {} };
export const results = (() => { try { return JSON.parse(localStorage.getItem('hb_results') || '{}'); } catch { return {}; } })();
export const saveResults = () => { try { localStorage.setItem('hb_results', JSON.stringify(results)); } catch {} };
