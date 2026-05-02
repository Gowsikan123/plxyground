/**
 * Playwright E2E smoke tests for the admin panel.
 * Run with: cd admin-panel && npx playwright test
 */
const { test, expect } = require('@playwright/test');

const BASE = 'http://localhost:3012';

test.describe('Admin Panel — Login', () => {
  test('renders login screen on first load', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator('#login-screen')).toBeVisible();
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
  });

  test('shows error on bad credentials', async ({ page }) => {
    await page.goto(BASE);
    await page.fill('#login-email', 'wrong@example.com');
    await page.fill('#login-password', 'WrongPassword1');
    await page.click('#login-submit');
    await expect(page.locator('#login-error')).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Admin Panel — Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Skip login by injecting token directly into the page
    await page.goto(BASE);
    await page.evaluate(() => {
      window._adminToken = 'test-bypass';
      window._bypassAuth = true;
    });
  });

  test('navigation links are present', async ({ page }) => {
    await page.goto(BASE);
    const navItems = page.locator('nav a, nav button, [data-nav]');
    await expect(navItems.first()).toBeVisible();
  });
});
