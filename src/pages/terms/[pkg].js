import PolicyPage from '@/components/PolicyPage';
import { apps } from '@/data/apps';
import extractedData from '@/data/extracted.json';

function getFallbackTerms(app) {
  return [
    `1. Acceptance of Terms`,
    `By downloading or using ${app.name}, you agree to be bound by these Terms of Service.`,
    `2. Permitted Use`,
    `You are granted a non-exclusive, non-transferable license to use the application for personal, non-commercial purposes.`,
    `3. Intellectual Property`,
    `All content, features, and functionality of ${app.name} are owned by Yarp Developers and are protected by international copyright laws.`,
    `4. Disclaimer of Warranties`,
    `The application is provided "as is" without any warranties of any kind.`,
    `5. Limitation of Liability`,
    `Yarp Developers shall not be liable for any indirect, incidental, or consequential damages resulting from your use of the application.`,
    `6. Governing Law`,
    `These Terms shall be governed by the laws of Kenya.`,
    `7. Contact Information`,
    `If you have any questions, contact yarpsports@gmail.com.`
  ];
}

export default function TermsOfService({ app, paragraphs }) {
  if (!app) return <div className="prose"><p>Terms not found.</p></div>;

  return (
    <PolicyPage 
      title={`Terms of Service for ${app.name}`} 
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
  
  if (app && extractedData[app.slug] && extractedData[app.slug].tos) {
    paragraphs = extractedData[app.slug].tos;
  } else if (app) {
    paragraphs = getFallbackTerms(app);
  }

  return { 
    props: { 
      app, 
      paragraphs 
    } 
  };
}
