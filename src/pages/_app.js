import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
import Layout from "@/components/Layout";
import { RegionProvider } from "@/components/Region";
import { rememberCampaign } from "@/data/campaign";
import { useEffect } from "react";

// Display face — used loud, and only for the name, section titles, and project names.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

// Body face — everything that has to read like prose.
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

// Data face — reserved for machine truth: version strings and package IDs. Nowhere else.
const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export default function App({ Component, pageProps }) {
  // Ads land on any page, so every page load checks for an ad tag.
  useEffect(() => { rememberCampaign(); }, []);

  return (
    <RegionProvider>
      <Layout className={`${display.variable} ${body.variable} ${mono.variable}`}>
        <Component {...pageProps} />
      </Layout>
    </RegionProvider>
  );
}
