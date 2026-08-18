import { test, expect } from "@playwright/test";
import { loginUser } from "./auth-helper";

test.describe("Fluxos Críticos - Geração e Publicação Completa de Conteúdo", () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(240000);
    await loginUser(page);
  });

  test("Jornada Completa do Usuário: Gerar Post (mode=concept) até a Publicação", async ({ page }) => {
    // 1. Acesso direto com modo conceito (Concept / Ideia livre)
    await page.goto("/dashboard/posts/gerar?mode=concept");
    await page.waitForLoadState("domcontentloaded");

    // 2. Etapa 1: Preenchimento da ideia/prompt
    const textarea = page.locator("textarea").first();
    await expect(textarea).toBeVisible({ timeout: 15000 });
    await textarea.fill("Novidades da semana: Dicas imperdíveis para impulsionar seu negócio em 2026 com IA!");

    // Clica no botão de avançar na Etapa 1
    const nextButtonStep1 = page.getByRole("button", { name: /(Avançar|Gerar|Próximo)/i }).first();
    await expect(nextButtonStep1).toBeEnabled({ timeout: 10000 });
    await nextButtonStep1.click();

    // 3. Etapa 2: Aguarda a geração das ideias de texto pela IA
    const generateTextBtn = page.getByRole("button", { name: /Gerar Conteúdo de Texto/i }).first();
    if (await generateTextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (await generateTextBtn.isEnabled()) {
        await generateTextBtn.click();
      }
    }

    const firstOptionRadio = page.locator('#option-0, label[for="option-0"], label[htmlfor="option-0"]').first();
    await expect(firstOptionRadio).toBeVisible({ timeout: 120000 });
    await firstOptionRadio.click();

    // Seleciona a opção "Não, apenas a imagem"
    const noTextBtn = page.getByRole("button", { name: /Não, apenas a imagem/i }).first();
    await expect(noTextBtn).toBeVisible({ timeout: 15000 });
    await noTextBtn.click();

    // Clica em Avançar na Etapa 2
    const nextButtonStep2 = page.getByRole("button", { name: /Avançar/i }).first();
    await expect(nextButtonStep2).toBeEnabled({ timeout: 10000 });
    await nextButtonStep2.click();

    // 4. Etapa 3: Aguarda a geração completa da imagem (espera a tag <img> com alt="Opção..." ser renderizada)
    const realGeneratedImage = page.locator('img[alt^="Opção"]').first();
    await expect(realGeneratedImage).toBeVisible({ timeout: 180000 });
    await realGeneratedImage.click({ force: true });

    // Aguarda a habilitação do botão Avançar na Etapa 3
    const nextButtonStep3 = page.getByRole("button", { name: /Avançar/i }).first();
    await expect(nextButtonStep3).toBeEnabled({ timeout: 60000 });
    await nextButtonStep3.click();

    // 5. Etapa 4: Edição da Marca e avanço para Revisão
    const nextButtonStep4 = page.getByRole("button", { name: /Revisar publicação/i }).first();
    await expect(nextButtonStep4).toBeVisible({ timeout: 20000 });
    await expect(nextButtonStep4).toBeEnabled({ timeout: 20000 });
    await nextButtonStep4.click({ force: true });

    // 6. Etapa 5: Revise e Publique no Instagram
    const step5Heading = page.locator('h3:has-text("Preview do Post"), h3:has-text("Publicar"), #edit-title').first();
    await expect(step5Heading).toBeAttached({ timeout: 45000 });

    const publishButton = page.locator("button").filter({ hasText: /Publicar Agora/i }).first();
    await expect(publishButton).toBeAttached({ timeout: 15000 });

    // Seleciona a plataforma Instagram se disponível e não marcada
    const instagramCheckbox = page.locator('#platform-instagram');
    if (await instagramCheckbox.isVisible()) {
      const isChecked = await instagramCheckbox.isChecked();
      if (!isChecked && !(await instagramCheckbox.isDisabled())) {
        await instagramCheckbox.check({ force: true });
      }
    }

    // Preenche título e legenda na Etapa 5 se visíveis
    const titleInput = page.locator("#edit-title");
    if (await titleInput.isVisible()) {
      await titleInput.fill("Dicas de IA para Negócios 🚀");
    }

    const subtitleTextarea = page.locator("#edit-subtitle");
    if (await subtitleTextarea.isVisible()) {
      await subtitleTextarea.fill("Confira as melhores práticas para integrar inteligência artificial no seu dia a dia!");
    }

    // Clica no botão Publicar Agora se habilitado
    if (await publishButton.isEnabled()) {
      await publishButton.click({ force: true });
      await page.waitForTimeout(5000);
    }
  });
});
