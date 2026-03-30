const { test, expect } = require('@playwright/test');

test('admin can log in and see queue plus alerts sections', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('#login-screen')).toBeVisible();
  await page.locator('#login-email').fill('admin@plxyground.local');
  await page.locator('#login-password').fill('Internet2026@');
  await page.getByRole('button', { name: 'Sign In' }).click();

  await expect(page.locator('#login-screen')).toBeHidden();
  await expect(page.locator('#section-title')).toHaveText('Moderation Queue');

  await page.getByRole('button', { name: 'Live Alerts' }).click();
  await expect(page.locator('#section-title')).toHaveText('Live Alerts');
  await expect(page.locator('#alerts-body')).toBeVisible();
});
