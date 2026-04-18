import PolicyPage from '@/components/PolicyPage';
import { apps } from '@/data/apps';
import extractedData from '@/data/extracted.json';

// Basic fallback policy generator for apps missing formal policies
function getFallbackPolicy(app) {
  return [
    `1. Introduction`,
    `${app.name} ("we", "our", or "us") respects your privacy. This privacy policy explains our data practices for the ${app.name} mobile application.`,
    `2. Information We Collect`,
    `We collect standard analytics and crash reports to improve the application. We may collect information required for in-app purchases and ad serving (if applicable).`,
    `3. Data Sharing`,
    `We do not sell your personal information. Data is only shared with third-party service providers (like Google AdMob or RevenueCat) to provide core application functionality.`,
    `4. Contact Us`,
    `For any privacy-related questions, please contact yarpsports@gmail.com.`
  ];
}

export default function PrivacyPolicy({ app, paragraphs }) {
  if (!app) return <div className="prose"><p>Policy not found.</p></div>;

  return (
    <PolicyPage 
      title={`Privacy Policy for ${app.name}`} 
      paragraphs={paragraphs} 
      lastUpdated="April 2026" 
    />
  );
}

export async function getStaticPaths() {
  const paths = apps.map(app => ({
    params: { pkg: app.packageId }
  }));
  return { paths, fallback: false };
}

export async function getStaticProps({ params }) {
  const app = apps.find(a => a.packageId === params.pkg);
  let paragraphs = [];
  
  if (app && extractedData[app.slug] && extractedData[app.slug].privacy) {
    paragraphs = extractedData[app.slug].privacy;
  } else if (app) {
    paragraphs = getFallbackPolicy(app);
  }

  return { 
    props: { 
      app, 
      paragraphs 
    } 
  };
}
