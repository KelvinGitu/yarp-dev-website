// The five reasons to buy these apps rather than use a web tool, as separate
// badges so each one reads on its own. Used on /store and every product page.

const icons = {
  // A crossed-out repeat arrow: no recurring charge.
  subscription: (
    <>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
      <path d="M4 4l16 16" />
    </>
  ),
  // A key: bought once, yours for good.
  own: (
    <>
      <circle cx="7.5" cy="15.5" r="4.5" />
      <path d="M10.7 12.3L21 2" />
      <path d="M16 7l3 3" />
      <path d="M19 4l2 2" />
    </>
  ),
  // Two chasing arrows: every new version comes to you.
  updates: (
    <>
      <path d="M21 12a9 9 0 0 1-15.4 6.4L3 16" />
      <path d="M3 21v-5h5" />
      <path d="M3 12a9 9 0 0 1 15.4-6.4L21 8" />
      <path d="M21 3v5h-5" />
    </>
  ),
  // A shield with a tick: your data is protected.
  data: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  // An eye with a slash: nobody watching.
  privacy: (
    <>
      <path d="M9.9 4.2A9.1 9.1 0 0 1 12 4c7 0 10 8 10 8a13.2 13.2 0 0 1-1.7 2.7" />
      <path d="M6.6 6.6A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.4-1.6" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M2 2l20 20" />
    </>
  ),
};

const PROMISES = [
  { icon: 'subscription', title: 'No subscription', text: 'One price, paid once' },
  { icon: 'own', title: 'Buy once, own forever', text: 'Your licence never expires' },
  { icon: 'updates', title: 'Lifetime updates', text: 'Every new version, free' },
  { icon: 'data', title: 'Your data stays yours', text: 'Kept on your computer, never uploaded' },
  { icon: 'privacy', title: 'Private', text: 'No account, no tracking, no ads' },
];

export default function StorePromises({ compact = false }) {
  return (
    <ul className={`store-promises${compact ? ' store-promises-compact' : ''}`}>
      {PROMISES.map((p) => (
        <li key={p.icon} className="store-promises-item">
          <svg className="store-promises-icon" viewBox="0 0 24 24" aria-hidden="true">
            {icons[p.icon]}
          </svg>
          <span>
            <span className="store-promises-title">{p.title}</span>
            <span className="store-promises-text">{p.text}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
