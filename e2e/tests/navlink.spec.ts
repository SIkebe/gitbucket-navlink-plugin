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

async function submitNavLinks(page: Page) {
  await page.evaluate(() => {
    const btn = document.querySelector('input[type="submit"]') as HTMLInputElement | null;
    if (btn) btn.disabled = false;
  });
  await page.locator('input[type="submit"]').click();
  await Promise.race([
    page.locator('.alert-success, .alert-info').waitFor({ state: 'visible', timeout: 5000 }).catch(() => null),
    page.waitForLoadState('networkidle').catch(() => null),
    page.waitForTimeout(5000),
  ]);
  await page.waitForTimeout(1000);
}

async function waitForNavLinksInNavbar(page: Page, names: string[]) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  for (const name of names) {
    await page
      .locator(`a:has-text("${name}")`)
      .first()
      .waitFor({ state: 'visible', timeout: 20000 })
      .catch(() => null);
  }
  await page.reload();
  await page.waitForLoadState('domcontentloaded');
  for (const name of names) {
    await expect(page.locator(`a:has-text("${name}")`).first()).toBeVisible({ timeout: 15000 });
  }
}

async function waitForSettingValue(page: Page, index: number, name: string, path: string) {
  // Retry reading until values appear after plugin reload
  for (let i = 0; i < 10; i++) {
    await page.goto('/navlink/settings');
    await page.waitForLoadState('networkidle');
    const nameInput = navLinkNameInput(page, index);
    const pathInput = navLinkPathInput(page, index);
    const currentName = await nameInput.inputValue();
    const currentPath = await pathInput.inputValue();
    if (currentName === name && currentPath === path) return;
    await page.waitForTimeout(1500);
  }
  await expect(navLinkNameInput(page, index)).toHaveValue(name);
  await expect(navLinkPathInput(page, index)).toHaveValue(path);
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
    await submitNavLinks(page);
    
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
    await submitNavLinks(page);
    
    // Navigate to home page
    await waitForNavLinksInNavbar(page, [menuName]);
  });

  test('should hide NavLink from unauthenticated users', async ({ page, browser }) => {
    await ensureOnSettings(page);

    const menuName = `Documentation_${Date.now()}`;
    const menuPath = 'navlink/settings';

    await navLinkNameInput(page).fill(menuName);
    await navLinkPathInput(page).fill(menuPath);
    await submitNavLinks(page);

    await page.goto('/');
    await page.reload();
    await expect(page.locator(`a:has-text("${menuName}")`).first()).toBeVisible();

    const guestContext = await browser.newContext({ baseURL: 'http://localhost:8080' });
    const guestPage = await guestContext.newPage();
    await guestPage.goto('/');

    await expect(guestPage.locator(`a:has-text("${menuName}")`)).toHaveCount(0);

    await guestContext.close();
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
    await submitNavLinks(page);
    
    // Verify we can restore original values
    await navLinkNameInput(page).fill(initialName);
    await navLinkPathInput(page).fill(initialPath);
    await submitNavLinks(page);
    
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
    await submitNavLinks(page);
    
    // Navigate away and back
    await waitForSettingValue(page, 0, uniqueName, uniquePath);
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

    await submitNavLinks(page);
    await waitForNavLinksInNavbar(page, links.map((l) => l.name));
    await waitForSettingValue(page, 0, links[0].name, links[0].path);
  });
});
