import type { Metadata } from "next";
import { HomePageContent } from "@/components/home/home-page-content";

export const metadata: Metadata = {
  title: "NumVapt - Marketing no modo Ultra Vapt com Inteligência Artificial",
  description:
    "A primeira plataforma com IA que cria textos brilhantes, gera imagens com a sua marca e agenda seus posts automaticamente. Economize 90% do seu tempo com marketing digital.",
  openGraph: {
    title: "NumVapt - Marketing no modo Ultra Vapt com Inteligência Artificial",
    description:
      "A primeira plataforma com IA que cria textos brilhantes, gera imagens com a sua marca e agenda seus posts automaticamente. Economize 90% do seu tempo com marketing digital.",
    url: "https://numvapt.com.br",
    type: "website",
    images: [
      {
        url: "/logo-numvapt.png",
        width: 1200,
        height: 630,
        alt: "NumVapt - Marketing com Inteligência Artificial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NumVapt - Marketing no modo Ultra Vapt com Inteligência Artificial",
    description:
      "A primeira plataforma com IA que cria textos brilhantes, gera imagens com a sua marca e agenda seus posts automaticamente. Economize 90% do seu tempo com marketing digital.",
    images: ["/logo-numvapt.png"],
  },
};

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "NumVapt",
    "operatingSystem": "All",
    "applicationCategory": "BusinessApplication",
    "description":
      "A primeira plataforma com IA que cria textos brilhantes, gera imagens com a sua marca e agenda seus posts automaticamente.",
    "offers": {
      "@type": "AggregateOffer",
      "priceCurrency": "BRL",
      "lowPrice": "0",
      "highPrice": "490",
      "offerCount": "2",
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "142",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomePageContent />
    </>
  );
}
