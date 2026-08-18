import { test, expect } from "@playwright/test";
import { loginUser } from "./auth-helper";

test.describe("Smoke Tests - Navegação Padrão", () => {
  test("Acesso a Landing Page (deslogado/home)", async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto("/");
    await expect(page).toHaveTitle(/NumVapt/i);
    await context.close();
  });

  test.describe("Páginas Autenticadas", () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page);
    });

    test("Acesso ao Dashboard", async ({ page }) => {
      await page.goto("/dashboard");
      // Verificamos a URL em vez do texto Início por causa do modal de período de teste
      await expect(page).toHaveURL(/.*\/dashboard/);
    });

    test("Acesso a Meu Negócio", async ({ page }) => {
      await page.goto("/dashboard/meu-negocio");
      await expect(page.getByText("Meu Negócio", { exact: false }).first()).toBeVisible();
    });

    test("Acesso a Posts", async ({ page }) => {
      await page.goto("/dashboard/posts");
      await expect(page.getByRole("heading", { name: /Posts/i }).first()).toBeVisible();
    });

    test("Acesso a Relatórios", async ({ page }) => {
      await page.goto("/dashboard/relatorios");
      await expect(page.getByRole("heading", { name: /Relatórios/i }).first()).toBeVisible({
        timeout: 15000,
      });
    });

    test("Acesso a Marketplace", async ({ page }) => {
      await page.goto("/dashboard/marketplace");
      await expect(page.getByRole("heading", { name: /Marketplace/i }).first()).toBeVisible({
        timeout: 15000,
      });
    });
  });
});
