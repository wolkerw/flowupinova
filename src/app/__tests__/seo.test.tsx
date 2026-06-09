import { metadata as layoutMetadata } from "../layout";
import { metadata as homeMetadata } from "../page";
import { metadata as termosMetadata } from "../termos/page";
import { metadata as privacidadeMetadata } from "../privacidade/page";
import sitemap from "../sitemap";
import robots from "../robots";

describe("Configuração de Metadados e SEO", () => {
  describe("Layout Global (layout.tsx)", () => {
    it("deve definir metadados base de título e descrição corretos", () => {
      expect(layoutMetadata.title).toBeDefined();
      expect(layoutMetadata.title).toEqual({
        default: "NumVapt - Marketing com Inteligência Artificial",
        template: "%s | NumVapt",
      });
      expect(layoutMetadata.description).toContain("plataforma definitiva para criação de conteúdo");
    });

    it("deve possuir palavras-chave e informações do autor configuradas", () => {
      expect(layoutMetadata.keywords).toContain("marketing digital");
      expect(layoutMetadata.keywords).toContain("inteligência artificial");
      expect(layoutMetadata.keywords).toContain("NumVapt");
      expect(layoutMetadata.authors).toEqual([{ name: "NumVapt Soluções e Inovações I.S." }]);
    });

    it("deve definir tags OpenGraph e Twitter corretas", () => {
      const og = layoutMetadata.openGraph as any;
      expect(og).toBeDefined();
      expect(og?.title).toBe("NumVapt - Marketing com Inteligência Artificial");
      expect(og?.locale).toBe("pt_BR");
      expect(og?.type).toBe("website");

      const tw = layoutMetadata.twitter as any;
      expect(tw).toBeDefined();
      expect(tw?.card).toBe("summary_large_image");
    });

    it("deve possuir regras corretas de robots globais", () => {
      expect(layoutMetadata.robots).toBeDefined();
      expect(layoutMetadata.robots).toEqual({
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      });
    });
  });

  describe("Página Inicial (page.tsx)", () => {
    it("deve exportar metadados específicos e atrativos focados em conversão", () => {
      expect(homeMetadata).toBeDefined();
      expect(homeMetadata?.title).toContain("Marketing no modo Ultra Vapt");
      expect(homeMetadata?.description).toContain("Economize 90% do seu tempo");
    });

    it("deve definir tags OpenGraph e Twitter específicas da Home", () => {
      const og = homeMetadata?.openGraph as any;
      expect(og?.title).toContain("Marketing no modo Ultra Vapt");
      expect(og?.url).toBe("https://numvapt.com.br");
      expect(og?.images).toEqual([
        {
          url: "/logo-numvapt.png",
          width: 1200,
          height: 630,
          alt: "NumVapt - Marketing com Inteligência Artificial",
        },
      ]);

      const tw = homeMetadata?.twitter as any;
      expect(tw?.card).toBe("summary_large_image");
    });
  });

  describe("Páginas Institucionais (Termos e Privacidade)", () => {
    it("deve possuir metadados específicos para os Termos de Uso", () => {
      expect(termosMetadata).toBeDefined();
      expect(termosMetadata?.title).toBe("Termos de Uso");
      expect(termosMetadata?.description).toContain("condições para utilização dos serviços");
    });

    it("deve possuir metadados específicos para a Política de Privacidade", () => {
      expect(privacidadeMetadata).toBeDefined();
      expect(privacidadeMetadata?.title).toBe("Política de Privacidade");
      expect(privacidadeMetadata?.description).toContain("proteção de dados pessoais");
    });
  });

  describe("Indexadores de Busca Automáticos (Sitemap e Robots)", () => {
    it("deve gerar o sitemap.xml dinamicamente com todas as rotas públicas", () => {
      const sitemapResult = sitemap();
      expect(sitemapResult).toBeDefined();
      expect(sitemapResult).toHaveLength(3);

      const urls = sitemapResult.map((entry) => entry.url);
      expect(urls).toContain("https://numvapt.com.br");
      expect(urls).toContain("https://numvapt.com.br/termos");
      expect(urls).toContain("https://numvapt.com.br/privacidade");

      const homeEntry = sitemapResult.find((entry) => entry.url === "https://numvapt.com.br");
      expect(homeEntry?.priority).toBe(1.0);
    });

    it("deve gerar o robots.txt dinamicamente em conformidade com as regras de indexação", () => {
      const robotsResult = robots() as any;
      expect(robotsResult).toBeDefined();
      expect(robotsResult.rules).toBeDefined();

      const rules = robotsResult.rules;
      const disallowRules = Array.isArray(rules) ? rules[0]?.disallow : rules?.disallow;
      expect(disallowRules).toContain("/dashboard/");
      expect(disallowRules).toContain("/acesso/");
      expect(disallowRules).toContain("/api/");

      expect(robotsResult.sitemap).toBe("https://numvapt.com.br/sitemap.xml");
    });
  });
});
