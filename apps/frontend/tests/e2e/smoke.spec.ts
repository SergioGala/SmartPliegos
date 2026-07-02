import { test, expect } from '@playwright/test';

test('la app carga en la raíz', async ({ page }) => {
  await page.goto('/');
  // La página responde y tiene un <body> renderizado
  await expect(page.locator('body')).toBeVisible();
});