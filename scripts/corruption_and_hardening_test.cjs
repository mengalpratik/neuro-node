const { chromium } = require('playwright');

async function testCorruptionAndHardening() {
  console.log('==================================================');
  console.log('STARTING CORRUPTION & HARDENING VERIFICATION TEST');
  console.log('==================================================');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));

  // ----------------------------------------------------
  // 1. TEST STORAGE CORRUPTION RECOVERY
  // ----------------------------------------------------
  console.log('\n1. Testing LocalStorage Malformed JSON Handling...');
  const targetUrl = process.env.TEST_URL || 'http://localhost:4173/';
  await page.goto(targetUrl);
  
  // Inject malformed JSON into PERSONAL_DASHBOARD_V1
  const malformedData = '{"malformed": true, "corrupted_syntax: missing_brace';
  await page.evaluate(broken => {
    localStorage.setItem('PERSONAL_DASHBOARD_V1', broken);
  }, malformedData);

  // Reload page
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // Verify dashboard does not crash and brand is still rendered
  const brandVisible = await page.locator('text=NEURO//NODE').first().isVisible();
  console.log('Dashboard rendered without crash on corrupted state:', brandVisible);

  // Verify recovery alert banner is displayed
  const recoveryAlertVisible = await page.locator('[role="alert"]:has-text("STORAGE RECOVERY")').isVisible();
  console.log('Storage Recovery banner visible to user:', recoveryAlertVisible);

  // Verify corrupted raw state was safely preserved in backup key
  const preservedBackup = await page.evaluate(() => localStorage.getItem('PERSONAL_DASHBOARD_V1_CORRUPTED_BACKUP'));
  console.log('Preserved corrupted backup key matches original broken data:', preservedBackup === malformedData);

  // Test dismissing the corruption alert
  await page.click('button:has-text("Dismiss")');
  await page.waitForTimeout(200);
  const alertDismissed = !(await page.locator('[role="alert"]:has-text("STORAGE RECOVERY")').isVisible());
  console.log('Recovery banner dismissed cleanly:', alertDismissed);

  // ----------------------------------------------------
  // 2. TEST STORAGE TELEMETRY LABEL & CALCULATION
  // ----------------------------------------------------
  console.log('\n2. Testing Storage Telemetry Truthfulness...');
  const localDataLabel = await page.locator('text=/LOCAL DATA:/i').first().innerText();
  console.log('Header storage readout:', localDataLabel);
  const hasNoMisleadingCounts = !localDataLabel.includes('G •') && !localDataLabel.includes('B (');
  console.log('Storage label does NOT mix item counts and bytes:', hasNoMisleadingCounts);

  // ----------------------------------------------------
  // 3. TEST FAVICON FALLBACK & INTERNAL DOMAIN ISOLATION
  // ----------------------------------------------------
  console.log('\n3. Testing Favicon Fallback & Offline Independence...');
  // Add bookmark with an internal domain that skips external favicon
  await page.locator('button[aria-label="Add bookmark to this group"]').first().click();
  await page.waitForTimeout(300);
  await page.fill('input[placeholder*="https://github.com"]', 'https://internal-cluster.local/dashboard');
  await page.fill('input[placeholder*="GitHub Dashboard"]', 'Local Cluster Service');
  await page.click('button[type="submit"]:has-text("Add Bookmark")');
  await page.waitForTimeout(400);

  const internalBookmarkVisible = await page.locator('text=Local Cluster Service').isVisible();
  console.log('Internal bookmark rendered successfully:', internalBookmarkVisible);

  // Verify Globe fallback SVG is rendered
  const hasGlobeIcon = await page.locator('.group:has-text("Local Cluster Service") svg').count();
  console.log('Local fallback SVG rendered for internal domain:', hasGlobeIcon > 0);

  // ----------------------------------------------------
  // 4. MOBILE REGRESSION CHECK (320px to 430px)
  // ----------------------------------------------------
  console.log('\n4. Testing Mobile Viewports for Overflow Regressions...');
  const viewports = [320, 360, 375, 390, 430];
  let allMobilePass = true;
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 800 });
    await page.waitForTimeout(150);
    const isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`Mobile ${width}px horizontal overflow:`, isOverflowing ? 'FAIL' : 'PASS');
    if (isOverflowing) allMobilePass = false;
  }

  // ----------------------------------------------------
  // 5. UNHANDLED ERROR CHECK
  // ----------------------------------------------------
  console.log('\n5. Checking for Unhandled Exceptions during test...');
  console.log('Page errors count:', pageErrors.length);
  if (pageErrors.length > 0) {
    console.log('Page errors:', pageErrors);
  }

  await browser.close();

  const passed = brandVisible && recoveryAlertVisible && hasNoMisleadingCounts && allMobilePass && pageErrors.length === 0;
  console.log('\n==================================================');
  console.log('CORRUPTION & HARDENING TEST RESULT:', passed ? 'ALL PASS' : 'FAIL');
  console.log('==================================================');
}

testCorruptionAndHardening();
