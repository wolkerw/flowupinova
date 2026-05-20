import { test as setup, expect } from '@playwright/test';
import * as path from 'path';

const authFile = path.join('.auth', 'user.json');

setup('authenticate', async ({ page }) => {
  // Navigate to the login page
  await page.goto('/acesso');
  
  // Wait for the login form or redirect to /acesso/login to complete
  await page.waitForURL('**/acesso**');

  // Fill in the credentials
  await page.fill('input[id="login-email"]', 'contato@wolker.com.br');
  await page.fill('input[id="login-password"]', '123456');

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation to dashboard after successful login
  await page.waitForURL('**/dashboard**', { timeout: 15000 });
  
  // Removemos a checagem explícita de texto (como "Início") 
  // porque a conta pode estar exibindo o modal de "Trial Ended", o que faria o teste falhar
  // sendo que o login em si foi um sucesso.

  // Save authentication state
  await page.context().storageState({ path: authFile });
});
