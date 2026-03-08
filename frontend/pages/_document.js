import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta name="description" content="ScamShield AI - AI-powered scam detection system with blockchain registry" />
        <meta name="keywords" content="scam detection, AI, blockchain, phishing, security" />
        <meta name="author" content="ScamShield AI Team" />
        <meta property="og:title" content="ScamShield AI" />
        <meta property="og:description" content="AI-powered scam detection with blockchain registry" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
