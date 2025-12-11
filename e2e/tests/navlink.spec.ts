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
  await page.locator('a:has-text("Sign in")').click();
  
  // Fill in credentials
  await page.locator('input[name="userName"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  
  // Submit login form
  await page.locator('input[type="submit"], button[type="submit"]').click();
  
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
    await expect(page.locator('.panel-heading:has-text("Settings for NavLink")')).toBeVisible();
    await expect(page.locator('input[name="globalMenuName"]')).toBeVisible();
    await expect(page.locator('input[name="globalMenuPath"]')).toBeVisible();
  });

  test('should update NavLink settings', async ({ page }) => {
    // Navigate to NavLink settings
    await page.goto('/navlink/settings');
    
    // Fill in the form
    const testMenuName = 'Test Menu';
    const testMenuPath = 'navlink/settings';
    
    await page.locator('input[name="globalMenuName"]').fill(testMenuName);
    await page.locator('input[name="globalMenuPath"]').fill(testMenuPath);
    
    // Submit the form
    await page.locator('input[type="submit"]').click();
    
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
    
    await page.locator('input[name="globalMenuName"]').fill(menuName);
    await page.locator('input[name="globalMenuPath"]').fill(menuPath);
    await page.locator('input[type="submit"]').click();
    
    // Wait for save confirmation
    await expect(page.locator('.alert-success, .alert-info')).toBeVisible({ timeout: 10000 });
    
    // Navigate to home page
    await page.goto('/');
    
    // Check if the NavLink appears in the navigation (may require page reload)
    await page.reload();
    
    // Note: The actual selector depends on how GitBucket renders the menu
    // This is a generic check that would need adjustment based on actual HTML structure
    const navLink = page.locator(`a:has-text("${menuName}")`);
    await expect(navLink.first()).toBeVisible();
  });

  test('should validate required fields in NavLink settings', async ({ page }) => {
    await page.goto('/navlink/settings');
    
    // Clear the fields
    await page.locator('input[name="globalMenuName"]').fill('');
    await page.locator('input[name="globalMenuPath"]').fill('');
    
    // Try to submit empty form
    await page.locator('input[type="submit"]').click();
    
    // Check that validation prevents submission:
    // 1. URL should still be on settings page (not redirected)
    const currentUrl = page.url();
    await expect(currentUrl).toContain('/navlink/settings');
    
    // 2. Check for validation error message or alert
    // The form should either show an error message or use HTML5 validation
    const errorMessage = page.locator('.alert-error, .alert-danger, .error');
    const hasErrorMessage = await errorMessage.count() > 0;
    
    // 3. Check if HTML5 validation is being used (fields should have required attribute)
    const nameField = page.locator('input[name="globalMenuName"]');
    const pathField = page.locator('input[name="globalMenuPath"]');
    
    // At least one validation mechanism should be present
    const nameRequired = await nameField.evaluate((el: HTMLInputElement) => el.hasAttribute('required'));
    const pathRequired = await pathField.evaluate((el: HTMLInputElement) => el.hasAttribute('required'));
    
    expect(hasErrorMessage || nameRequired || pathRequired).toBeTruthy();
  });

  test('should persist NavLink settings across page reloads', async ({ page }) => {
    // Set unique values
    const uniqueName = `Menu_${Date.now()}`;
    const uniquePath = 'navlink/settings';
    
    await page.goto('/navlink/settings');
    await page.locator('input[name="globalMenuName"]').fill(uniqueName);
    await page.locator('input[name="globalMenuPath"]').fill(uniquePath);
    await page.locator('input[type="submit"]').click();
    
    // Wait for save confirmation
    await expect(page.locator('.alert-success, .alert-info')).toBeVisible({ timeout: 10000 });
    
    // Navigate away and back
    await page.goto('/');
    await page.goto('/navlink/settings');
    
    // Verify values persisted
    await expect(page.locator('input[name="globalMenuName"]')).toHaveValue(uniqueName);
    await expect(page.locator('input[name="globalMenuPath"]')).toHaveValue(uniquePath);
  });
});
