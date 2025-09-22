import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth/auth-provider';
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
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet" />
        <Script
          id="fb-sdk-config"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              window.fbAsyncInit = function() {
                window.FB.init({
                  appId      : '826418333144156',
                  cookie     : true,
                  xfbml      : true,
                  version    : 'v19.0'
                });
              };
            `,
          }}
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          {children}
        </AuthProvider>
        <Toaster />
        <Script
          id="fb-sdk"
          src="https://connect.facebook.net/en_US/sdk.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
