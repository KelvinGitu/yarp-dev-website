import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_REGION, INTL, REGIONS, guessRegion, isRegion, priceFor } from '@/data/regions';

// Which prices the visitor sees: their saved choice, else a guess from their
// time zone, else DEFAULT_REGION (regions.js). Pages are prerendered with
// DEFAULT_REGION's prices; anything else applies once the page has loaded.

const STORAGE_KEY = 'yarp-region';
const RegionContext = createContext({ region: DEFAULT_REGION, setRegion: () => {} });

export function RegionProvider({ children }) {
  const [region, setRegionState] = useState(DEFAULT_REGION);

  useEffect(() => {
    let saved = null;
    try { saved = window.localStorage.getItem(STORAGE_KEY); } catch { /* private window */ }
    setRegionState(isRegion(saved) ? saved : guessRegion());
  }, []);

  function setRegion(code) {
    if (!isRegion(code)) return;
    setRegionState(code);
    try { window.localStorage.setItem(STORAGE_KEY, code); } catch { /* still works for this visit */ }
  }

  return <RegionContext.Provider value={{ region, setRegion }}>{children}</RegionContext.Provider>;
}

export const useRegion = () => useContext(RegionContext);

// A product's price in the visitor's region.
export function Price({ product }) {
  const { region } = useRegion();
  return priceFor(product, region);
}

export function RegionPicker({ className = '' }) {
  const { region, setRegion } = useRegion();
  return (
    <label className={`region-picker ${className}`}>
      <span>Prices for</span>
      <select value={region} onChange={(e) => setRegion(e.target.value)}>
        <option value={INTL}>Everywhere else (EUR)</option>
        {Object.entries(REGIONS).map(([code, r]) => (
          <option key={code} value={code}>{r.name} ({r.currency})</option>
        ))}
      </select>
    </label>
  );
}
