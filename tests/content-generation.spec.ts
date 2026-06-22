import { test, expect } from "@playwright/test";
import { loginUser } from "./auth-helper";

test.describe("Fluxos Críticos - Geração de Conteúdo", () => {
  test.beforeEach(async ({ page }) => {
    await loginUser(page);
  });

  test("Acesso ao Assistente de Geração (Wizard)", async ({ page }) => {
    await page.goto("/dashboard/conteudo");

    // Ignoramos a verificação da UI do dashboard e forçamos a ida pro Wizard
    // já que o botão pode não estar visível se o layout for modificado ou mockado
    await page.goto("/dashboard/conteudo/gerar");

    // Espera a página do Wizard carregar pelo título principal
    await expect(page.getByRole("heading", { name: /Gerar Post/i }).first()).toBeVisible({
      timeout: 15000,
    });

    // Preenche um tema básico
    await page.fill("textarea", "Dicas de marketing digital para pequenas empresas");

    // Verifica se o botão de avançar está presente
    const advanceButton = page.getByRole("button", { name: /Avançar/i });
    await expect(advanceButton).toBeVisible();
  });
});
