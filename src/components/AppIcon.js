import { useState } from 'react';

// An app's icon from /assets/icons, or its first letter if there isn't one yet.
export default function AppIcon({ slug, name, size }) {
  const [error, setError] = useState(false);
  if (error) return <span className="project-icon-fallback">{name.charAt(0)}</span>;
  return <img src={`/assets/icons/${slug}.png`} alt="" width={size} height={size} onError={() => setError(true)} />;
}
