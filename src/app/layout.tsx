import type {Metadata} from 'next';
import './globals.css';
import { Providers } from '@/components/auth/providers';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'FlowUp Chat',
  description: 'Seu assistente de marketing com IA',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400&family=Poppins:wght@700&display=swap" rel="stylesheet" />
        {/* Hotjar Tracking Code */}
        <script src="https://t.contentsquare.net/uxa/9ce52eb57993d.js"></script>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="afterInteractive">
          {`
            (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','GTM-M5LLZBRP');
          `}
        </Script>
        {/* End Google Tag Manager */}
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        {/* Google Tag Manager (noscript) */}
        <noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-M5LLZBRP"
        height="0" width="0" style={{display:"none", visibility:"hidden"}}></iframe></noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
