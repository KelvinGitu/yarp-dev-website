import { Html, Head, Main, NextScript } from 'next/document';
import { ADSENSE_CLIENT } from '@/data/studio';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="google-adsense-account" content={ADSENSE_CLIENT} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
