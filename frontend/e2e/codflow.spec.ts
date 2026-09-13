import { test, expect } from '@playwright/test';

test.describe('COD Flow E2E Operations Flow', () => {
  test('1. User Login & Dashboard Metrics Display', async ({ page }) => {
    await page.goto('/login');

    // Verify title
    await expect(page.locator('h1')).toContainText('Sign in to COD Flow');

    // Click quick role test login for Seller
    await page.click('button:has-text("Seller (Merchant)")');

    // Click Sign In
    await page.click('button:has-text("Sign In to Operations")');

    // Should redirect to dashboard
    await page.waitForURL('/');
    await expect(page.locator('h1')).toContainText('Executive Operations Dashboard');

    // Verify KPI Cards are rendered
    await expect(page.locator('text=Total COD Pipeline')).toBeVisible();
    await expect(page.locator('text=Net Cash Collected')).toBeVisible();
    await expect(page.locator('text=Confirmation Rate')).toBeVisible();
  });

  test('2. Order Processing & Status Update Workflow', async ({ page }) => {
    await page.goto('/orders');

    // Check header
    await expect(page.locator('h1')).toContainText('Orders Center');

    // Verify orders table has items
    await expect(page.locator('table')).toBeVisible();

    // Click on the first row
    const firstRow = page.locator('tbody tr').first();
    await firstRow.click();

    // Verify Order Details drawer opens
    await expect(page.locator('text=Order Details')).toBeVisible();
    await expect(page.locator('text=Cash Collection Breakdown')).toBeVisible();

    // Click Confirm Order button
    const confirmBtn = page.locator('button:has-text("Confirm Order")');
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
  });

  test('3. Call Center Agent Queue & WhatsApp Trigger', async ({ page }) => {
    await page.goto('/call-center');

    // Verify header
    await expect(page.locator('h1')).toContainText('Call Center Agent Workspace');

    // Verify queue panel
    await expect(page.locator('text=Verification Queue')).toBeVisible();

    // Click Simulate Dial
    const dialBtn = page.locator('button:has-text("Simulate Dial")');
    if (await dialBtn.isVisible()) {
      await dialBtn.click();
      // Should show Hang Up
      await expect(page.locator('button:has-text("Hang Up")')).toBeVisible();
    }

    // Verify WhatsApp follow-up box
    await expect(page.locator('text=WhatsApp Follow-Up (WAHA Engine)')).toBeVisible();

    // Send quick WhatsApp follow-up
    await page.click('button:has-text("Send WhatsApp")');
    await expect(page.locator('text=dispatched successfully via WAHA')).toBeVisible();
  });

  test('4. Courier Tracking & Logistics Hub', async ({ page }) => {
    await page.goto('/couriers');

    await expect(page.locator('h1')).toContainText('Courier & Logistics Hub');
    await expect(page.locator('text=Configured Courier Accounts')).toBeVisible();
    await expect(page.locator('text=J&T Express')).toBeVisible();
    await expect(page.locator('text=Dispatched Shipments')).toBeVisible();
  });

  test('5. Financial Remittance Reconciliation Portal', async ({ page }) => {
    await page.goto('/finance');

    await expect(page.locator('h1')).toContainText('Financial Reconciliation Portal');
    await expect(page.locator('text=Courier Payout Discrepancies')).toBeVisible();
    await expect(page.locator('text=Processed Remittance Files History')).toBeVisible();
  });

  test('6. WAHA WhatsApp Session & Broadcast Hub', async ({ page }) => {
    await page.goto('/whatsapp');

    await expect(page.locator('h1')).toContainText('WhatsApp Engine');
    await expect(page.locator('text=WAHA Companion Engine')).toBeVisible();
    await expect(page.locator('text=WORKING')).toBeVisible();
    await expect(page.locator('text=Launch WhatsApp Broadcast Campaign')).toBeVisible();
  });
});
