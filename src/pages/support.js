import Head from 'next/head';
import { apps } from '@/data/apps';

export default function Support() {
  return (
    <>
      <Head>
        <title>Support - Yarp Developers</title>
      </Head>
      <div className="prose">
        <h1>Help & Support</h1>
        <p>If you're experiencing issues with any of our applications, or have questions regarding billing, privacy, or features, please reach out to us using the contact information below.</p>
        
        <div style={{ padding: '2rem', background: 'var(--bg-card)', borderRadius: '16px', marginBottom: '3rem', marginTop: '2rem' }}>
          <h2 style={{ borderBottom: 'none', margin: '0 0 1rem' }}>General Contact</h2>
          <p style={{ margin: 0 }}>
            <strong>Email:</strong> <a href="mailto:yarpsports@gmail.com">yarpsports@gmail.com</a>
          </p>
        </div>

        <h2>App-Specific Information</h2>
        {apps.map(app => (
          <div key={app.slug} className="support-item">
            <h3>{app.name}</h3>
            <p style={{ marginBottom: '1rem' }}>{app.tagline}</p>
            <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.95rem' }}>
              <div><strong>Package:</strong> <code>{app.packageId}</code></div>
              <div><strong>Support:</strong> <a href={`mailto:yarpsports@gmail.com?subject=${app.name} Support Request`}>Email Support</a></div>
              <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                <a href={`/privacy/${app.packageId}`}>Privacy Policy</a>
                <a href={`/terms/${app.packageId}`}>Terms of Service</a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
