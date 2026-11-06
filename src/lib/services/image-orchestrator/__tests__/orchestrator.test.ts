import { describe, it, expect, vi, beforeEach } from "vitest";
import { BriefNormalizer } from "../BriefNormalizer";
import { BrandContextBuilder } from "../BrandContextBuilder";
import { ReferenceContextBuilder } from "../ReferenceContextBuilder";
import { Gpt5PromptPlanner } from "../Gpt5PromptPlanner";
import { ImageModelExecutor } from "../ImageModelExecutor";
import { ImageResultValidator } from "../ImageResultValidator";
import { ImageGenerationOrchestrator } from "../index";

vi.mock("jimp", () => ({
  Jimp: {
    read: vi.fn().mockResolvedValue({
      width: 1080,
      height: 1350,
      resize: vi.fn(),
      getBuffer: vi.fn().mockResolvedValue(Buffer.from("processed-image-data")),
    }),
  },
}));

vi.mock("@/lib/firebase-admin", () => {
  const mockSet = vi.fn().mockResolvedValue(undefined);
  const mockDoc = {
    set: mockSet,
    get: vi.fn().mockResolvedValue({
      exists: true,
      data: () => ({
        name: "NumVapt Test",
        primaryColor: "#0083C7",
        secondaryColor: "#FA6305",
        brandKit: { visualGuidelines: "Estilo limpo e moderno" },
      }),
    }),
  };

  return {
    adminDb: {
      doc: vi.fn(() => mockDoc),
      collection: vi.fn(() => ({
        doc: vi.fn(() => mockDoc),
      })),
    },
  };
});

vi.mock("@/lib/services/api-usage-service-admin", () => ({
  logApiUsage: vi.fn(),
}));

describe("Image Orchestrator Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("BriefNormalizer", () => {
    it("limpa espaços extras e extrai headline entre aspas", () => {
      const res = BriefNormalizer.normalize({
        rawBrief: '  Um novo produto "Super Oferta Relâmpago" com café   ',
      });
      expect(res.cleanedBrief).toBe('Um novo produto "Super Oferta Relâmpago" com café');
      expect(res.explicitHeadline).toBe("Super Oferta Relâmpago");
    });

    it("detecta modo infográfico automaticamente se houver palavra-chave", () => {
      const res = BriefNormalizer.normalize({
        rawBrief: "Infográfico comparativo sobre energia solar sustentável",
      });
      expect(res.requestedTextOverlayMode).toBe("INFOGRAPHIC");
    });
  });

  describe("BrandContextBuilder", () => {
    it("retorna contexto vazio quando useBrandKit é false", async () => {
      const brand = await BrandContextBuilder.build("user-1", false);
      expect(brand.enabled).toBe(false);
      expect(brand.businessName).toBe("");
    });

    it("carrega cores e diretrizes da marca quando useBrandKit é true", async () => {
      const brand = await BrandContextBuilder.build("user-1", true, {
        name: "Minha Empresa",
        primaryColor: "#123456",
        secondaryColor: "#654321",
      });
      expect(brand.enabled).toBe(true);
      expect(brand.businessName).toBe("Minha Empresa");
      expect(brand.primaryColors).toContain("#123456");
      expect(brand.secondaryColors).toContain("#654321");
    });
  });

  describe("ReferenceContextBuilder", () => {
    it("não inclui logo em referências visuais quando logoUrl não for fornecida", async () => {
      const refs = await ReferenceContextBuilder.buildReferences({
        businessName: "NumVapt Soluções",
        brief: "Crie um post publicitário para a NumVapt",
      });
      expect(refs.every((r) => r.role !== "business_logo" && r.role !== "official_logo")).toBe(true);
    });

    it("carrega logomarca oficial com role business_logo quando logoUrl for fornecida", async () => {
      const originalFetch = global.fetch;
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => Buffer.from("fake-png-logo-data"),
      });

      const refs = await ReferenceContextBuilder.buildReferences({
        businessName: "NumVapt Soluções",
        logoUrl: "https://example.com/logo.png",
        brief: "Crie um post publicitário",
      });

      expect(refs.some((r) => r.role === "business_logo")).toBe(true);
      global.fetch = originalFetch;
    });
  });

  describe("Gpt5PromptPlanner", () => {
    it("gera plano determinístico com zero logos quando nenhuma logo é fornecida", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Café especial aromático",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: true,
        brandKit: {
          enabled: true,
          businessName: "NumVapt",
          primaryColors: ["#0083C7"],
          secondaryColors: ["#FA6305"],
          accentColors: ["#FFFFFF"],
          restrictions: [],
          hasLocalOfficialLogo: false,
        },
      });

      expect(planResult.plannerModelUsed).toBeDefined();
      expect(planResult.visualPlan).toBeDefined();
      expect(planResult.compiledImagePrompt).toContain("SAFE MARGINS");
      expect(planResult.compiledImagePrompt).toContain("ZERO LOGOS");
      expect(planResult.compiledImagePrompt).toContain("15% to 20%");
    });

    it("gera plano determinístico com inclusão mandatória de logo quando logomarca é fornecida", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Café especial aromático",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: true,
        brandKit: {
          enabled: true,
          businessName: "NumVapt",
          primaryColors: ["#0083C7"],
          secondaryColors: ["#FA6305"],
          accentColors: ["#FFFFFF"],
          restrictions: [],
          hasLocalOfficialLogo: true,
          logoUrl: "https://example.com/logo.png",
        },
        // REGRA: hasLogo só é true se a imagem foi carregada com base64 real
        referenceImages: [
          {
            role: "business_logo",
            base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
            mimeType: "image/png",
            url: "https://example.com/logo.png",
            description: "Logomarca de teste",
          },
        ],
      });

      expect(planResult.visualPlan.brandApplication.useLogo).toBe(true);
      expect(planResult.compiledImagePrompt).toContain("MANDATORY LOGO INTEGRATION");
      expect(planResult.compiledImagePrompt).not.toContain("ZERO LOGOS");
    });

    it("preserva rótulos de embalagens de produtos reais e ajusta negativePrompt quando product_subject é fornecido", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Pote de alho em pasta Agrosserra",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: false,
        referenceImages: [
          {
            role: "product_subject",
            base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
            mimeType: "image/png",
            url: "https://example.com/alho.png",
            description: "Foto real da embalagem de alho em pasta",
          },
        ],
      });

      expect(planResult.compiledImagePrompt).toContain("STRICT PRODUCT GEOMETRY & COMPONENT LOCK (/productlock)");
      expect(planResult.compiledImagePrompt).not.toContain("CREATIVE LOGO / SUBJECT EXCEPTION MODE");
      expect(planResult.compiledImagePrompt).toContain("ZERO LOGOS IN POST LAYOUT");
      expect(planResult.compiledNegativePrompt).toContain("acrylic logo plaque on counter");
      expect(planResult.compiledImagePrompt).toContain("HERO SUBJECT PRESERVATION");
      expect(planResult.compiledImagePrompt).toContain("authentic printed label");
      expect(planResult.compiledNegativePrompt).toContain("redesigned product geometry");
      expect(planResult.compiledNegativePrompt).toContain("altered speaker top cabinets");
      // Não deve conter 'blank product label' como proibição no negativo
      expect(planResult.compiledNegativePrompt).toContain("blank product label");
      expect(planResult.compiledNegativePrompt).toContain("erased packaging typography");
    });

    it("ativa o Modo Exceção Criativa de Logomarca quando product_subject é enviado e a logo fixa do BrandKit está desabilitada", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Crie uma imagem para a minha marca usando a logomarca enviada",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: true,
        brandKit: {
          enabled: true,
          businessName: "NumVapt",
          primaryColors: ["#0083C7", "#FA6305"],
          hasLocalOfficialLogo: false, secondaryColors: [], accentColors: [],
        },
        referenceImages: [
          {
            role: "product_subject",
            base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
            mimeType: "image/png",
            url: "https://example.com/logo-numvapt.png",
            description: "Logomarca enviada na Etapa 5",
          },
        ],
      });

      expect(planResult.compiledImagePrompt).toContain("CREATIVE LOGO / SUBJECT EXCEPTION MODE");
      expect(planResult.compiledImagePrompt).toContain("UPLOADED LOGO INTEGRATION");
      expect(planResult.compiledNegativePrompt).not.toContain("no NumVapt logo");
    });

    it("mantém a Inserção Criativa Cenográfica da Etapa 5 ativa mesmo quando a logo fixa do BrandKit também está habilitada", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Crie uma imagem com um personagem vestindo a camisa da marca",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: true,
        brandKit: {
          enabled: true,
          businessName: "NumVapt",
          primaryColors: ["#0083C7", "#FA6305"],
          hasLocalOfficialLogo: true, secondaryColors: [], accentColors: [],
          logoUrl: "https://example.com/brandkit-logo.png",
        },
        referenceImages: [
          {
            role: "product_subject",
            base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
            mimeType: "image/png",
            url: "https://example.com/step5-logo.png",
            description: "Logomarca enviada na Etapa 5",
          },
          {
            role: "official_logo",
            base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
            mimeType: "image/png",
            url: "https://example.com/brandkit-logo.png",
            description: "Logomarca oficial do BrandKit",
          },
        ],
      });

      expect(planResult.compiledImagePrompt).toContain("CREATIVE LOGO / SUBJECT EXCEPTION MODE");
      expect(planResult.compiledImagePrompt).toContain("different from any flat corner BrandKit stamp");
      expect(planResult.visualPlan.brandApplication.useLogo).toBe(true);
    });

    it("alterna dinamicamente entre diferentes arquétipos criativos a cada nova geração com logomarca na Etapa 5", () => {
      const a1 = Gpt5PromptPlanner.selectCreativeLogoArchetype("Post comercial 1");
      const a2 = Gpt5PromptPlanner.selectCreativeLogoArchetype("Post comercial 2");
      const a3 = Gpt5PromptPlanner.selectCreativeLogoArchetype("Post comercial 3");

      expect(a1.primary.id).not.toBe(a2.primary.id);
      expect(a2.primary.id).not.toBe(a3.primary.id);
    });

    it("aplica a trava tipográfica do BrandKit (/fontlock) quando primaryFont, secondaryFont e style estão configurados", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Se a gente escondesse a casca, você saberia dizer qual é Fuji e qual é Gala?",
        objective: "social",
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        textOverlayMode: "TITLE_ONLY",
        productHeadline: "Se a gente escondesse a casca, você saberia dizer qual é Fuji e qual é Gala?",
        useBrandKit: true,
        brandKit: {
          enabled: true,
          businessName: "Pomar Brasil",
          primaryColors: ["#0E4B35"],
          secondaryColors: ["#FFFFFF"],
          accentColors: [],
          hasLocalOfficialLogo: false,
          fonts: {
            primaryFont: "Branding SF - BOLD",
            secondaryFont: "Branding SF - NORMAL",
            style: "Moderno sans-serif limpo, corporativo e altamente legível",
          },
        },
      });

      expect(planResult.compiledImagePrompt).toContain("/fontlock");
      expect(planResult.compiledImagePrompt).toContain("Branding SF - BOLD");
      expect(planResult.compiledImagePrompt).toContain("Branding SF - NORMAL");
      expect(planResult.compiledImagePrompt).toContain("SINGLE unified, clean, modern corporate geometric sans-serif typeface family");
    });

    it("detecta metáforas de escala ('cabe no seu bolso') e alterna arquétipos criativos de agência sem exigir engenharia de prompt do usuário", () => {
      const baseInput = {
        userBrief: "crie um post mostrando que a NumVapt é mais do que um gestor de redes sociais, sendo uma agência de publicidade e marketing completa e que cabe no seu bolso. Além de toda a gestão das redes sociais integradas, a NumVapt permite criar artefatos que só uma agência de publicidade cria, como logomarcas, cartão de visitas, papel timbrado, campanhas completas de engajamento, branding, mockups, etc",
        objective: "commercial" as const,
        format: "portrait" as const,
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: true,
      };

      const c1 = Gpt5PromptPlanner.selectArtDirectionConcept(baseInput);
      const c2 = Gpt5PromptPlanner.selectArtDirectionConcept(baseInput);

      expect(c1).not.toBeNull();
      expect(c1?.mode).toBe("metaphor_boost");
      expect(c2).not.toBeNull();
      expect(c1?.primary.id).not.toBe(c2?.primary.id);
    });

    it("aplica a trava Anti-Clichê (/anticliche), 'SHOW, DON\'T LIST' e bloqueia mão com celular + caixas PowerPoint + botão falso de site em prompts conceituais", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "crie um post mostrando que a NumVapt é mais do que um gestor de redes sociais, sendo uma agência de publicidade e marketing completa e que cabe no seu bolso",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        textOverlayMode: "INFOGRAPHIC",
        useBrandKit: true,
      });

      expect(planResult.compiledImagePrompt).toContain("/anticliche");
      expect(planResult.compiledImagePrompt).toContain("SHOW, DON'T LIST");
      expect(planResult.compiledImagePrompt).toContain("NO STOCK-PHOTO CLICHÉS");
      expect(planResult.compiledImagePrompt).toContain("NO POWERPOINT SLIDE BOXES");
      expect(planResult.compiledImagePrompt).toContain("NO FAKE WEBSITE CTA BUTTONS");
    });

    it("respeita pedido literal do usuário quando ele solicitar explicitamente mão segurando celular e botão na arte", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "crie uma foto de uma mão segurando um celular mostrando o app e adicione um botão no rodapé",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: false,
      });

      expect(planResult.compiledImagePrompt).toContain("/anticliche");
      expect(planResult.compiledImagePrompt).not.toContain("NO STOCK-PHOTO CLICHÉS");
      expect(planResult.compiledImagePrompt).not.toContain("NO FAKE WEBSITE CTA BUTTONS");
    });

    it("desativa o sorteio de direção de arte /anticliche quando há foto real de produto (/productlock) na Etapa 5", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Destaque nosso equipamento profissional de som em ação",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: true,
        referenceImages: [
          {
            role: "product_subject",
            base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
            mimeType: "image/jpeg",
            url: "https://example.com/caixa-de-som.jpg",
            description: "Equipamento enviado na Etapa 5",
          },
        ],
      });

      expect(planResult.compiledImagePrompt).toContain("/productlock");
      expect(planResult.compiledImagePrompt).not.toContain("/anticliche");
    });

    it("alterna dinamicamente a posição da logomarca entre posições editoriais", () => {
      const p1 = Gpt5PromptPlanner.selectDynamicLogoPlacement({} as any);
      const p2 = Gpt5PromptPlanner.selectDynamicLogoPlacement({} as any);
      const p3 = Gpt5PromptPlanner.selectDynamicLogoPlacement({} as any);
      const p4 = Gpt5PromptPlanner.selectDynamicLogoPlacement({} as any);

      const positions = [p1.id, p2.id, p3.id, p4.id];
      expect(positions).toContain("top-left");
      expect(positions).toContain("top-right");
      expect(positions).toContain("top-center");
      expect(positions).toContain("bottom-right");
    });

    it("injeta a zona de respiro dinâmica e registra logoPosition no plano visual", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Café especial da manhã com xícara fumegante",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: true,
        logoPosition: "top-right",
        brandKit: {
          enabled: true,
          businessName: "Café NumVapt",
          primaryColors: ["#0083C7"],
          secondaryColors: [],
          accentColors: [],
          hasLocalOfficialLogo: true,
          logoUrl: "https://example.com/cafe-logo.png",
        },
        referenceImages: [
          {
            role: "official_logo",
            base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
            mimeType: "image/png",
            url: "https://example.com/cafe-logo.png",
          },
        ],
      });

      expect(planResult.visualPlan.brandApplication.logoPosition).toBe("top-right");
      expect(planResult.compiledImagePrompt).toContain("ZERO-TEXT LOGO CLEARANCE ZONE");
      expect(planResult.compiledImagePrompt).toContain("top-right");
    });

    it("calcula corretamente a próxima posição a partir do histórico (getNextLogoPlacement)", () => {
      expect(Gpt5PromptPlanner.getNextLogoPlacement(undefined).id).toBe("top-left");
      expect(Gpt5PromptPlanner.getNextLogoPlacement("top-left").id).toBe("top-right");
      expect(Gpt5PromptPlanner.getNextLogoPlacement("top-right").id).toBe("top-center");
      expect(Gpt5PromptPlanner.getNextLogoPlacement("top-center").id).toBe("bottom-right");
      expect(Gpt5PromptPlanner.getNextLogoPlacement("bottom-right").id).toBe("top-left");
    });

    it("lembra da última posição registrada no Firestore (lastLogoPosition) e seleciona a próxima automaticamente mesmo com 1 imagem", async () => {
      const plan1 = await Gpt5PromptPlanner.plan({
        userBrief: "Foto comercial de sushi artesanal",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: true,
        lastLogoPosition: "top-left",
        brandKit: {
          enabled: true,
          businessName: "Sushi Vapt",
          primaryColors: ["#0083C7"],
          secondaryColors: [],
          accentColors: [],
          hasLocalOfficialLogo: true,
          logoUrl: "https://example.com/sushi-logo.png",
        },
        referenceImages: [
          {
            role: "official_logo",
            base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
            mimeType: "image/png",
            url: "https://example.com/sushi-logo.png",
          },
        ],
      });

      expect(plan1.visualPlan.brandApplication.logoPosition).toBe("top-right");
      expect(plan1.compiledImagePrompt).toContain("top-right");

      const plan2 = await Gpt5PromptPlanner.plan({
        userBrief: "Foto comercial de sushi artesanal 2",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: true,
        lastLogoPosition: "top-right",
        brandKit: {
          enabled: true,
          businessName: "Sushi Vapt",
          primaryColors: ["#0083C7"],
          secondaryColors: [],
          accentColors: [],
          hasLocalOfficialLogo: true,
          logoUrl: "https://example.com/sushi-logo.png",
        },
        referenceImages: [
          {
            role: "official_logo",
            base64: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI6QAAAABJRU5ErkJggg==",
            mimeType: "image/png",
            url: "https://example.com/sushi-logo.png",
          },
        ],
      });

      expect(plan2.visualPlan.brandApplication.logoPosition).toBe("top-center");
      expect(plan2.compiledImagePrompt).toContain("top-center");
    });
    it("alterna dinamicamente estilos tipográficos premium com contraste de pesos, cores e molduras", () => {
      const s1 = Gpt5PromptPlanner.selectDynamicTypographyStyle();
      const s2 = Gpt5PromptPlanner.selectDynamicTypographyStyle();
      const s3 = Gpt5PromptPlanner.selectDynamicTypographyStyle();

      expect(s1.id).toBeDefined();
      expect(s2.id).toBeDefined();
      expect(s1.id).not.toBe(s2.id);
      expect(s2.id).not.toBe(s3.id);
      expect(Gpt5PromptPlanner.DYNAMIC_TYPOGRAPHY_STYLES.length).toBeGreaterThanOrEqual(5);
    });

    it("injeta diretiva /typolayout e trava contra fundos lisos de estúdio quando textOverlayMode for TITLE_ONLY ou INFOGRAPHIC", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Da sua foto simples ao anúncio premium de pizzaria gourmet",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        textOverlayMode: "TITLE_ONLY",
        productHeadline: "Da sua foto simples ao anúncio premium",
        useBrandKit: true,
        brandKit: {
          enabled: true,
          businessName: "Pizzaria Bella",
          primaryColors: ["#0083C7"],
          secondaryColors: ["#FA6305"],
          accentColors: ["#FFFFFF"],
          restrictions: [],
          hasLocalOfficialLogo: false,
        },
      });

      expect(planResult.compiledImagePrompt).toContain("/typolayout");
      expect(planResult.compiledImagePrompt).toContain("STRICT BAN ON FLAT STUDIO WALLS");
      expect(planResult.compiledImagePrompt).toMatch(/(Bold|Black|Heavy|Semi-Bold)/);
      expect(planResult.compiledImagePrompt).toMatch(/(color|Pure White|contrast)/i);
    });

    it("contém arquétipo de transformação POV com fita 3D de neon em ambiente real no repertório criativo", () => {
      const povArchetype = Gpt5PromptPlanner.CREATIVE_ART_DIRECTION_ARCHETYPES.find(
        (a) => a.id === "pov_split_reality_transformation"
      );
      expect(povArchetype).toBeDefined();
      expect(povArchetype?.promptEn).toContain("first-person POV transformation");
      expect(povArchetype?.promptEn).toContain("neon energy ribbon");
      expect(povArchetype?.promptEn).toContain("deeply textured real-world workspace");
    });

    it("constrói mandato de agência e trava de mãos (/handlock & /agencystudio) com 5 dedos e pele autêntica", () => {
      const mandate = Gpt5PromptPlanner.buildAgencyQualityAndAnatomyMandate();
      expect(mandate).toContain("/handlock");
      expect(mandate).toContain("/agencystudio");
      expect(mandate).toContain("precisely 5 distinct, anatomically accurate fingers");
      expect(mandate).toContain("85mm f/1.8");
      expect(mandate).toContain("ZERO EXTRA FINGERS, ZERO FUSED DIGITS");
      expect(mandate).toContain("visible microscopic pores");
      expect(mandate).toContain("plastic waxy skin");
    });

    it("injeta trava anatômica de mãos (/handlock) e negativos de deformidades no plano gerado", async () => {
      const planResult = await Gpt5PromptPlanner.plan({
        userBrief: "Retrato de uma advogada no seu escritório segurando um smartphone",
        objective: "commercial" as const,
        format: "portrait",
        width: 1080,
        height: 1350,
        quantity: 1,
        stylePreference: "photographic" as const,
        useBrandKit: false,
      });

      expect(planResult.compiledImagePrompt).toContain("/handlock");
      expect(planResult.compiledImagePrompt).toContain("/agencystudio");
      expect(planResult.compiledNegativePrompt).toContain("extra fingers");
      expect(planResult.compiledNegativePrompt).toContain("six fingers");
      expect(planResult.compiledNegativePrompt).toContain("fused fingers");
      expect(planResult.compiledNegativePrompt).toContain("mutated hands");
      expect(planResult.compiledNegativePrompt).toContain("plastic skin");
      expect(planResult.compiledNegativePrompt).toContain("waxy skin");
    });
  });

  describe("ImageModelExecutor", () => {
    it("chama OpenAI com dimensões nativas para portrait (1024x1280)", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      let capturedBody: any = null;

      global.fetch = vi.fn().mockImplementation((url, opts) => {
        if (opts && opts.body) {
          capturedBody = JSON.parse(opts.body as string);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [{ b64_json: Buffer.from("fake-b64-image").toString("base64") }],
          }),
        });
      });

      const res = await ImageModelExecutor.execute({
        prompt: "Commercial coffee ad",
        format: "portrait",
        preferredModel: "gpt-image-2",
      });

      expect(res.modelUsed).toBe("gpt-image-2");
      expect(capturedBody.size).toBe("1024x1280");
      expect(res.imageBuffer).toBeDefined();
    });

    it("passa o parâmetro quality dinamicamente para a requisição da OpenAI", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      let capturedBody: any = null;

      global.fetch = vi.fn().mockImplementation((url, opts) => {
        if (opts && opts.body) {
          capturedBody = JSON.parse(opts.body as string);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [{ b64_json: Buffer.from("fake-b64-image").toString("base64") }],
          }),
        });
      });

      const res = await ImageModelExecutor.execute({
        prompt: "Commercial coffee ad",
        format: "square",
        preferredModel: "gpt-image-2.5-sunburst",
        quality: "low",
      });

      expect(res.modelUsed).toBe("gpt-image-2.5-sunburst");
      expect(capturedBody.quality).toBe("low");
      expect(capturedBody.size).toBe("1024x1024");
    });

    it("injeta a trava crítica de anatomia de mãos (/handlock & /agencystudio) no prompt enviado para a IA", async () => {
      process.env.OPENAI_API_KEY = "test-key";
      let capturedBody: any = null;

      global.fetch = vi.fn().mockImplementation((url, opts) => {
        if (opts && opts.body) {
          capturedBody = JSON.parse(opts.body as string);
        }
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [{ b64_json: Buffer.from("fake-b64-image").toString("base64") }],
          }),
        });
      });

      await ImageModelExecutor.execute({
        prompt: "Business portrait of a lawyer",
        format: "portrait",
        preferredModel: "gpt-image-2",
      });

      expect(capturedBody.prompt).toContain("/handlock");
      expect(capturedBody.prompt).toContain("/agencystudio");
      expect(capturedBody.prompt).toContain("precisely five fingers per hand");
      expect(capturedBody.prompt).toContain("NO extra fingers, six fingers, fused digits");
    });
  });

  describe("ImageResultValidator", () => {
    it("redimensiona para as dimensões alvo via Jimp", async () => {
      const result = await ImageResultValidator.validateAndNormalize(
        Buffer.from("dummy-image-data-for-testing-purposes-1234567890"),
        "portrait"
      );
      expect(result.width).toBe(1080);
      expect(result.height).toBe(1350);
      expect(result.buffer).toBeDefined();
    });
  });

  describe("ImageGenerationOrchestrator End-to-End", () => {
    it("executa a orquestração completa em 2 etapas com telemetria", async () => {
      process.env.OPENAI_API_KEY = "test-key";

      global.fetch = vi.fn().mockImplementation((url, opts) => {
        const urlStr = String(url);
        if (urlStr.includes("api.openai.com/v1/chat/completions")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              choices: [
                {
                  message: {
                    content: JSON.stringify({
                      schemaVersion: "1.0",
                      confidence: 0.98,
                      needsClarification: false,
                      interpretation: { goal: "commercial", subject: "Café especial" },
                      visualPlan: { scene: "Estúdio moderno" },
                      imagePrompt: "Rich 10-block prompt for coffee [SAFE MARGINS MANDATE: 20%]",
                      negativePrompt: "blurry, cropped text",
                    }),
                  },
                },
              ],
            }),
          });
        }
        if (urlStr.includes("api.openai.com/v1/images/generations")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: [{ b64_json: Buffer.from("final-rendered-image-bytes").toString("base64") }],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const res = await ImageGenerationOrchestrator.execute({
        userId: "user-123",
        generationId: "gen-456",
        assetId: "asset-789",
        rawBrief: "Xícara de cappuccino com arte latte",
        format: "portrait",
      });

      expect(res.plannerModelUsed).toBe("gpt-6.1-sol");
      expect(res.imageModelUsed).toBe("gpt-image-2.5-sunburst");
      expect(res.width).toBe(1080);
      expect(res.height).toBe(1350);
      expect(res.planResult.visualPlan).toBeDefined();
    });

    it("realiza fallback automático e transparente para gpt-5 quando gpt-6.1-sol retornar erro (ex: 403/404 de tier)", async () => {
      let gpt6Attempted = false;
      let gpt5Attempted = false;

      (global.fetch as any).mockImplementation((url: string, opts?: any) => {
        const urlStr = String(url);
        if (urlStr.includes("api.openai.com/v1/chat/completions")) {
          const body = JSON.parse(opts?.body || "{}");
          if (body.model === "gpt-6.1-sol") {
            gpt6Attempted = true;
            // Simula erro 404 (model not found / tier restrito)
            return Promise.resolve({
              ok: false,
              status: 404,
              text: async () => JSON.stringify({ error: { message: "Model gpt-6.1-sol not found or tier restricted" } }),
            });
          }
          if (body.model === "gpt-5") {
            gpt5Attempted = true;
            return Promise.resolve({
              ok: true,
              json: async () => ({
                choices: [
                  {
                    message: {
                      content: JSON.stringify({
                        schemaVersion: "1.0",
                        confidence: 0.95,
                        needsClarification: false,
                        interpretation: { goal: "commercial", subject: "Produto em estúdio" },
                        visualPlan: { scene: "Estúdio fotográfico com iluminação suave" },
                        imagePrompt: "Commercial studio product photography [SAFE MARGINS MANDATE: 20%]",
                        negativePrompt: "blurry, low quality",
                      }),
                    },
                  },
                ],
              }),
            });
          }
        }
        if (urlStr.includes("api.openai.com/v1/images/generations")) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              data: [{ b64_json: Buffer.from("rendered-image-bytes").toString("base64") }],
            }),
          });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
      });

      const res = await ImageGenerationOrchestrator.execute({
        userId: "user-123",
        generationId: "gen-456",
        assetId: "asset-789",
        rawBrief: "Frasco de perfume sobre pedra vulcânica",
        format: "portrait",
      });

      expect(gpt6Attempted).toBe(true);
      expect(gpt5Attempted).toBe(true);
      expect(res.plannerModelUsed).toBe("gpt-5");
      expect(res.imageModelUsed).toBe("gpt-image-2.5-sunburst");
    });
  });
});
