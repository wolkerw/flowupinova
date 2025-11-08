import type {Metadata} from 'next';
import './globals.css';
import { Providers } from '@/components/auth/providers';

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
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
