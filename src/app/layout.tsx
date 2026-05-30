import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/auth/providers";
import Script from "next/script";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  weight: ["600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "NumVapt - Marketing com Inteligência Artificial",
    template: "%s | NumVapt",
  },
  description:
    "Sua plataforma definitiva para criação de conteúdo, anúncios e gestão de negócio com IA.",
  keywords: [
    "marketing digital",
    "inteligência artificial",
    "automação de posts",
    "criação de conteúdo",
    "gerador de imagens",
    "gestão de anúncios",
    "redes sociais",
    "Vapti AI",
    "NumVapt",
  ],
  authors: [{ name: "NumVapt Soluções e Inovações I.S." }],
  metadataBase: new URL("https://numvapt.com.br"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NumVapt - Marketing com Inteligência Artificial",
    description:
      "Sua plataforma definitiva para criação de conteúdo, anúncios e gestão de negócio com IA.",
    url: "https://numvapt.com.br",
    siteName: "NumVapt",
    locale: "pt_BR",
    type: "website",
    images: [
      {
        url: "/logo-numvapt.png",
        width: 800,
        height: 600,
        alt: "NumVapt Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NumVapt - Marketing com Inteligência Artificial",
    description:
      "Sua plataforma definitiva para criação de conteúdo, anúncios e gestão de negócio com IA.",
    images: ["/logo-numvapt.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
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
      <body
        className="font-body antialiased selection:bg-primary/20 selection:text-primary"
        suppressHydrationWarning
      >
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-M5LLZBRP"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          ></iframe>
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
