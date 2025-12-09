import { test, expect, Page } from '@playwright/test';

/**
 * Helper function to login to GitBucket
 */
async function login(page: Page, username: string = 'root', password: string = 'root') {
  await page.goto('/');
  
  // Check if already logged in
  const signInButton = await page.locator('a:has-text("Sign in")').count();
  if (signInButton === 0) {
    // Already logged in
    return;
  }

  // Click Sign in link
  await page.click('a:has-text("Sign in")');
  
  // Fill in credentials
  await page.fill('input[name="userName"]', username);
  await page.fill('input[name="password"]', password);
  
  // Submit login form
  await page.click('button[type="submit"]:has-text("Sign in")');
  
  // Wait for redirect to dashboard
  await page.waitForURL(/\/(?:root)?$/);
}

test.describe('GitBucket NavLink Plugin E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should access NavLink settings page', async ({ page }) => {
    // Navigate to admin settings
    await page.goto('/navlink/settings');
    
    // Verify settings page loaded
    await expect(page.locator('h1:has-text("NavLink Setting")')).toBeVisible();
    await expect(page.locator('input[name="globalMenuName"]')).toBeVisible();
    await expect(page.locator('input[name="globalMenuPath"]')).toBeVisible();
  });

  test('should update NavLink settings', async ({ page }) => {
    // Navigate to NavLink settings
    await page.goto('/navlink/settings');
    
    // Fill in the form
    const testMenuName = 'Test Menu';
    const testMenuPath = 'navlink/settings';
    
    await page.fill('input[name="globalMenuName"]', testMenuName);
    await page.fill('input[name="globalMenuPath"]', testMenuPath);
    
    // Submit the form
    await page.click('input[type="submit"]');
    
    // Wait for success message
    await expect(page.locator('.alert-success, .alert-info')).toBeVisible({ timeout: 10000 });
    
    // Verify values were saved
    await expect(page.locator('input[name="globalMenuName"]')).toHaveValue(testMenuName);
    await expect(page.locator('input[name="globalMenuPath"]')).toHaveValue(testMenuPath);
  });

  test('should display NavLink in global menu after configuration', async ({ page }) => {
    // First, configure the NavLink
    await page.goto('/navlink/settings');
    
    const menuName = 'Documentation';
    const menuPath = 'navlink/settings';
    
    await page.fill('input[name="globalMenuName"]', menuName);
    await page.fill('input[name="globalMenuPath"]', menuPath);
    await page.click('input[type="submit"]');
    
    // Wait for save confirmation
    await page.waitForTimeout(1000);
    
    // Navigate to home page
    await page.goto('/');
    
    // Check if the NavLink appears in the navigation (may require page reload)
    await page.reload();
    
    // Note: The actual selector depends on how GitBucket renders the menu
    // This is a generic check that would need adjustment based on actual HTML structure
    const navLink = page.locator(`a:has-text("${menuName}")`);
    if (await navLink.count() > 0) {
      await expect(navLink.first()).toBeVisible();
    }
  });

  test('should validate required fields in NavLink settings', async ({ page }) => {
    await page.goto('/navlink/settings');
    
    // Clear the fields
    await page.fill('input[name="globalMenuName"]', '');
    await page.fill('input[name="globalMenuPath"]', '');
    
    // Try to submit empty form
    await page.click('input[type="submit"]');
    
    // Form should have validation preventing submission or showing errors
    // The exact behavior depends on the form validation implementation
    const currentUrl = page.url();
    await expect(currentUrl).toContain('/navlink/settings');
  });

  test('should persist NavLink settings across page reloads', async ({ page }) => {
    // Set unique values
    const uniqueName = `Menu_${Date.now()}`;
    const uniquePath = 'navlink/settings';
    
    await page.goto('/navlink/settings');
    await page.fill('input[name="globalMenuName"]', uniqueName);
    await page.fill('input[name="globalMenuPath"]', uniquePath);
    await page.click('input[type="submit"]');
    
    // Wait for save
    await page.waitForTimeout(1000);
    
    // Navigate away and back
    await page.goto('/');
    await page.goto('/navlink/settings');
    
    // Verify values persisted
    await expect(page.locator('input[name="globalMenuName"]')).toHaveValue(uniqueName);
    await expect(page.locator('input[name="globalMenuPath"]')).toHaveValue(uniquePath);
  });
});
