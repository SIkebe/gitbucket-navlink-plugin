import { test, expect, Page } from '@playwright/test';

/**
 * Helper function to login to GitBucket
 */
async function login(page: Page, username: string = 'root', password: string = 'root') {
  await page.goto('/signin');
  if (!(await page.locator('input[name="userName"]').isVisible())) {
    return;
  }
  
  // Fill in credentials
  await page.locator('input[name="userName"]').fill(username);
  await page.locator('input[name="password"]').fill(password);
  
  // Submit login form
  await page.locator('input[type="submit"], button[type="submit"]').click();
  
  // Wait for redirect to dashboard
  await page.waitForURL(/\/(?:root)?$/);
}

function navLinkNameInput(page: Page, index: number = 0) {
  return page.locator(`input[name="navlinks[${index}].globalMenuName"]`);
}

function navLinkPathInput(page: Page, index: number = 0) {
  return page.locator(`input[name="navlinks[${index}].globalMenuPath"]`);
}

async function ensureOnSettings(page: Page) {
  await page.goto('/navlink/settings');
  await expect(page.locator('form#form')).toBeVisible();
}

test.describe('GitBucket NavLink Plugin E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
  });

  test('should access NavLink settings page', async ({ page }) => {
    // Navigate to admin settings
    await ensureOnSettings(page);
    
    // Verify settings page loaded
    await expect(page.locator('.panel-heading:has-text("Settings for NavLink")')).toBeVisible();
    await expect(navLinkNameInput(page)).toBeVisible();
    await expect(navLinkPathInput(page)).toBeVisible();
  });

  test('should update NavLink settings', async ({ page }) => {
    // Navigate to NavLink settings
    await ensureOnSettings(page);
    
    // Fill in the form
    const testMenuName = 'Test Menu';
    const testMenuPath = 'navlink/settings';
    
    await navLinkNameInput(page).fill(testMenuName);
    await navLinkPathInput(page).fill(testMenuPath);
    
    // Submit the form
    await page.locator('input[type="submit"]').click();
    
    // Wait for success message
    await expect(page.locator('.alert-success, .alert-info')).toBeVisible({ timeout: 10000 });
    
    // Verify values were saved
    await expect(navLinkNameInput(page)).toHaveValue(testMenuName);
    await expect(navLinkPathInput(page)).toHaveValue(testMenuPath);
  });

  test('should display NavLink in global menu after configuration', async ({ page }) => {
    // First, configure the NavLink
    await ensureOnSettings(page);
    
    const menuName = 'Documentation';
    const menuPath = 'navlink/settings';
    
    await navLinkNameInput(page).fill(menuName);
    await navLinkPathInput(page).fill(menuPath);
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

  test('should handle empty form submission in NavLink settings', async ({ page }) => {
    await ensureOnSettings(page);
    
    // Store initial values to restore later
    const initialName = await navLinkNameInput(page).inputValue();
    const initialPath = await navLinkPathInput(page).inputValue();
    
    // Clear the fields
    await navLinkNameInput(page).fill('');
    await navLinkPathInput(page).fill('');
    
    // Try to submit empty form
    await page.locator('input[type="submit"]').click();
    
    // Wait for any response
    await page.waitForTimeout(1000);
    
    // Verify we can restore original values
    await navLinkNameInput(page).fill(initialName);
    await navLinkPathInput(page).fill(initialPath);
    await page.locator('input[type="submit"]').click();
    
    // Wait for save operation
    await page.waitForTimeout(1000);
    
    // Verify restoration was successful
    await expect(navLinkNameInput(page)).toHaveValue(initialName);
    await expect(navLinkPathInput(page)).toHaveValue(initialPath);
  });

  test('should persist NavLink settings across page reloads', async ({ page }) => {
    // Set unique values
    const uniqueName = `Menu_${Date.now()}`;
    const uniquePath = 'navlink/settings';
    
    await ensureOnSettings(page);
    await navLinkNameInput(page).fill(uniqueName);
    await navLinkPathInput(page).fill(uniquePath);
    await page.locator('input[type="submit"]').click();
    
    // Wait for save confirmation
    await expect(page.locator('.alert-success, .alert-info')).toBeVisible({ timeout: 10000 });
    
    // Navigate away and back
    await page.goto('/');
    await page.goto('/navlink/settings');
    
    // Verify values persisted
    await expect(navLinkNameInput(page)).toHaveValue(uniqueName);
    await expect(navLinkPathInput(page)).toHaveValue(uniquePath);
  });

  test('should register multiple navlinks up to the maximum limit', async ({ page }) => {
    await ensureOnSettings(page);

    const links = [
      { name: 'Docs', path: 'navlink/settings' },
      { name: 'Issues', path: 'issues' },
    ];

    for (let i = 0; i < links.length; i++) {
      await navLinkNameInput(page, i).fill(links[i].name);
      await navLinkPathInput(page, i).fill(links[i].path);
    }

    await page.locator('input[type="submit"]').click();
    await expect(page.locator('.alert-success, .alert-info')).toBeVisible({ timeout: 10000 });

    await page.goto('/');
    await page.reload();

    for (const link of links) {
      await expect(page.locator(`a:has-text("${link.name}")`).first()).toBeVisible();
    }

    await page.goto('/navlink/settings');
    await expect(page.locator('input[name*=".globalMenuName"]')).toHaveCount(5);
  });
});
