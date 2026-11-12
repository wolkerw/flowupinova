import { test, expect } from "@playwright/test";
import { loginUser } from "./auth-helper";

const SAMPLE_1X1_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

test.describe("Fluxo Carrossel com IA (5 e 7 slides) — Regra de Ouro e Prévia", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(180000);
    await loginUser(page);
  });

  for (const slideCount of [5, 7] as const) {
    test(`Deve criar um carrossel de ${slideCount} slides, chamar imagem IA apenas 1 vez (Capa) e visualizar a prévia de todos os slides`, async ({
      page,
    }) => {
      let coverApiCalls = 0;

      // Intercepta /api/carousel/storyboard para responder instantaneamente com roteiro válido de 5 ou 7 slides
      await page.route("**/api/carousel/storyboard**", async (route) => {
        const reqBody = route.request().postDataJSON() || {};
        const count = Number(reqBody.slideCount || slideCount);

        const slides5 = [
          {
            n: 2,
            tipo: "contexto",
            titulo: "O erro comum na Reforma Tributária",
            texto:
              "Deixar a revisão fiscal para a última hora pode elevar a carga de IBS e CBS da sua empresa.",
          },
          {
            n: 3,
            tipo: "ponto_principal",
            titulo: "Simples ou Regime Híbrido?",
            texto:
              "Simule o impacto dos créditos tributários na sua cadeia de clientes antes de escolher.",
          },
          {
            n: 4,
            tipo: "complemento",
            titulo: "Na prática: exemplo comparativo",
            texto:
              "Empresas que vendem para outras empresas (B2B) costumam ganhar competitividade no híbrido.",
          },
          {
            n: 5,
            tipo: "cta",
            titulo: "Peça sua análise individual",
            texto: "Fale com nosso time contábil agora mesmo pelo WhatsApp.",
            botao: "Chamar no WhatsApp",
          },
        ];

        const slides7 = [
          {
            n: 2,
            tipo: "contexto",
            titulo: "Por que revisar seu regime agora?",
            texto:
              "A Reforma Tributária altera profundamente o cálculo de créditos no Simples Nacional.",
          },
          {
            n: 3,
            tipo: "desenvolvimento",
            titulo: "1. Mapeie seus clientes B2B e B2C",
            texto:
              "Identifique qual percentual do seu faturamento exige transferência de crédito integral.",
          },
          {
            n: 4,
            tipo: "desenvolvimento",
            titulo: "2. Compare IBS/CBS dentro e fora do DAS",
            texto:
              "No modelo híbrido você aproveita créditos de insumos, mas muda a apuração mensal.",
          },
          {
            n: 5,
            tipo: "desenvolvimento",
            titulo: "3. Projete a margem líquida de 2026",
            texto:
              "Coloque na ponta do lápis o custo operacional e o ganho tributário de cada cenário.",
          },
          {
            n: 6,
            tipo: "prova_resumo",
            titulo: "Resumo para decidir com clareza",
            texto:
              "Não existe resposta única: a melhor escolha depende de simulação contábil individual.",
          },
          {
            n: 7,
            tipo: "cta",
            titulo: "Agende seu diagnóstico tributário",
            texto: "Converse com nossos especialistas pelo WhatsApp oficial.",
            botao: "Falar no WhatsApp",
          },
        ];

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            slideCount: count,
            imageCallsExecuted: 0,
            modelUsed: "gemini-2.5-flash",
            storyboard: {
              chamadaCapa: `Reforma Tributária em ${count} Passos Práticos`,
              promptImagemCapa:
                "Composição editorial 4:5 (1080x1350) com executiva em escritório moderno e área superior limpa para tipografia.",
              slides: count === 5 ? slides5 : slides7,
            },
          }),
        });
      });

      // Intercepta /api/carousel/generate-cover e contabiliza chamadas de imagem
      let savedGalleryPayload: Record<string, any> | null = null;
      await page.route("**/api/galeria/salvar**", async (route) => {
        const postData = route.request().postData() || "";
        savedGalleryPayload = { rawBody: postData };
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            galleryId: `gal_${slideCount}`,
            url: SAMPLE_1X1_PNG_DATA_URL,
          }),
        });
      });

      await page.route("**/api/carousel/generate-cover**", async (route) => {
        coverApiCalls += 1;
        await new Promise((r) => setTimeout(r, 450));
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            carouselId: `e2e_carousel_${slideCount}`,
            slideNumber: 1,
            coverImageUrl: SAMPLE_1X1_PNG_DATA_URL,
            modelUsed: "gpt-image-2.6-sunburst",
            width: 1080,
            height: 1350,
            imageCallsExecuted: 1,
            designTokens: {
              dominantPalette: ["#0B253A", "#FA6305", "#0083C7"],
              backgroundColor: "#0B253A",
              secondaryColor: "#0083C7",
              accentColor: "#FA6305",
              textColor: "#FFFFFF",
              mutedTextColor: "#CBD5E1",
              titleAlignment: "left",
              coverTextPosition: "top",
              headingWeight: "800",
              graphicMotif: "accent_stripe",
              cornerRadius: 8,
              mood: "Executivo moderno",
              headingFont: "Poppins",
              bodyFont: "Inter",
              logoUrl: null,
            },
          }),
        });
      });

      // 1. Acessa a rota do Carrossel
      await page.goto("/dashboard/posts/gerar?mode=carousel");
      await page.waitForLoadState("domcontentloaded");

      // 2. Seleciona o tamanho (5 ou 7 slides) e preenche o tema
      const sizeBtn = page.getByTestId(`carousel-size-${slideCount}`);
      await expect(sizeBtn).toBeVisible({ timeout: 20000 });
      await sizeBtn.click();

      const themeInput = page.getByTestId("carousel-theme-input");
      await themeInput.fill(
        `Guia prático sobre Reforma Tributária em ${slideCount} slides`
      );

      // 3. Gera o roteiro completo (0 chamadas de imagem)
      const generateStoryboardBtn = page.getByTestId(
        "carousel-generate-storyboard-btn"
      );
      await generateStoryboardBtn.click();

      // 4. Na Etapa 2, verifica que a chamada da capa e os slides internos apareceram
      const chamadaInput = page.getByTestId("carousel-chamada-capa-input");
      await expect(chamadaInput).toBeVisible({ timeout: 15000 });
      await expect(chamadaInput).toHaveValue(
        `Reforma Tributária em ${slideCount} Passos Práticos`
      );

      // Verifica que ainda não houve nenhuma chamada de imagem
      expect(coverApiCalls).toBe(0);

      // 5. Gera a Capa com IA (única chamada de imagem em todo o fluxo) e verifica o counter de porcentagem
      const generateCoverBtn = page.getByTestId("carousel-generate-cover-btn");
      await generateCoverBtn.click();

      const progressOverlay = page.getByTestId("carousel-cover-progress");
      await expect(progressOverlay).toBeVisible({ timeout: 5000 });
      await expect(progressOverlay).toContainText("%");

      await expect(page.getByTestId("carousel-cover-preview-img")).toBeVisible({
        timeout: 15000,
      });
      expect(coverApiCalls).toBe(1);

      // 6. Navega pelos slides internos (2..N) e visualiza a prévia renderizada via Fabric.js
      for (let s = 2; s <= slideCount; s++) {
        await page.getByTestId(`carousel-thumb-${s}`).click();
        await expect(
          page.getByTestId(`carousel-internal-preview-img-${s}`)
        ).toBeVisible({ timeout: 10000 });
      }

      // 7. Avança para a Etapa 3 (Revisão Completa) e visualiza todos os slides
      await page.getByTestId("carousel-go-to-review-btn").click();
      const reviewGrid = page.getByTestId("carousel-full-review-grid");
      await expect(reviewGrid).toBeVisible({ timeout: 10000 });

      // 8. Verifica o botão "Salvar na Galeria" na Etapa 3 e executa o salvamento
      const saveGalleryBtn = page.getByTestId("carousel-save-gallery-btn");
      await expect(saveGalleryBtn).toBeVisible({ timeout: 10000 });
      await saveGalleryBtn.click();
      await expect(saveGalleryBtn).toContainText("Salvo na Galeria", {
        timeout: 15000,
      });
      expect(savedGalleryPayload).not.toBeNull();

      // Garante que após renderizar e revisar todos os slides, houve EXATAMENTE 1 chamada de imagem
      expect(coverApiCalls).toBe(1);
    });
  }
});
