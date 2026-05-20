import { Page } from '@playwright/test';

export async function loginUser(page: Page) {
  await page.goto('/acesso');
  await page.waitForURL('**/acesso**');
  await page.fill('input[id="login-email"]', 'contato@wolker.com.br');
  await page.fill('input[id="login-password"]', '123456');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
}
