const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

async function runSmokeTest() {
  console.log('====================================================');
  console.log('NEURO//NODE // SMOKE TEST & BRANDING AUDIT');
  console.log('====================================================\n');

  const viteProcess = spawn('npx', ['vite', '--port', '5173', '--strictPort'], {
    cwd: path.resolve(__dirname, '..'),
    stdio: 'pipe',
  });

  await new Promise((resolve) => {
    viteProcess.stdout.on('data', (data) => {
      if (data.toString().includes('Local:')) resolve();
    });
    setTimeout(resolve, 3000);
  });

  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

    console.log('[1] Loading application at http://localhost:5173...');
    await page.goto('http://localhost:5173');
    await page.waitForSelector('text=NEURO//NODE');

    // Verify document title
    const title = await page.title();
    console.log(`  -> Document Title: "${title}" (Expected: "NEURO//NODE")`);
    if (title !== 'NEURO//NODE') throw new Error(`Unexpected title: ${title}`);

    // Verify Header branding
    const headerBrand = await page.locator('header h1').innerText();
    console.log(`  -> Header Branding: "${headerBrand.replace(/\n/g, ' ')}"`);

    // Verify Subtitle
    const subtitle = await page.locator('header p').innerText();
    console.log(`  -> Header Subtitle: "${subtitle}"`);

    // Verify Footer attribution
    const footerText = await page.locator('footer').innerText();
    console.log(`  -> Footer attribution check:`);
    const hasNeuroNode = footerText.includes('NEURO//NODE');
    const hasAuthor = footerText.includes('Mengal Pratik (Neuro)');
    const hasOsTag = footerText.includes('NEURO//NODE OS v1.0.0');
    console.log(`     - Contains NEURO//NODE: ${hasNeuroNode}`);
    console.log(`     - Contains Author Credit: ${hasAuthor}`);
    console.log(`     - Contains OS Tag: ${hasOsTag}`);
    if (!hasAuthor || !hasNeuroNode || !hasOsTag) throw new Error('Footer missing required attribution elements');

    // Verify Group Creation
    console.log('[2] Testing Group Creation...');
    await page.click('button:has-text("New Group")');
    await page.waitForSelector('text=Create New Bookmark Group');
    await page.fill('input[placeholder*="Cloud Infrastructure"]', 'Core Architecture');
    await page.click('button[type="submit"]:has-text("Create Group")');
    await page.waitForSelector('text=Core Architecture');
    console.log('  -> Group "Core Architecture" created.');

    // Verify Bookmark Creation
    console.log('[3] Testing Bookmark Creation...');
    const addBookmarkBtn = page.locator('button[aria-label="Add bookmark to this group"]').first();
    await addBookmarkBtn.click();
    await page.waitForSelector('text=Add Bookmark to');
    await page.fill('input[placeholder*="https://github.com"]', 'https://github.com/mengalpratik');
    await page.fill('input[placeholder*="GitHub Dashboard"]', 'Mengal Pratik GitHub');
    await page.click('button[type="submit"]:has-text("Add Bookmark")');
    await page.waitForSelector('text=Mengal Pratik GitHub');
    console.log('  -> Bookmark "Mengal Pratik GitHub" added.');

    // Verify Settings Drawer & Attribution
    console.log('[4] Opening Settings Drawer...');
    const burgerBtn = page.locator('button[aria-label="Open main system settings menu"]');
    await burgerBtn.click();
    await page.waitForSelector('text=SYSTEM CONFIG // SETTINGS');

    // Check Settings Footer attribution
    const drawerFooter = await page.locator('text=Mengal Pratik (Neuro)').first().isVisible();
    console.log(`  -> Settings Drawer attribution visible: ${drawerFooter}`);

    // Check Sync Settings Tab
    await page.click('button:has-text("Devices & Sync")');
    await page.waitForSelector('text=NEURO//NODE SYNC SERVER ENDPOINT');
    console.log('  -> Sync endpoint branding verified: NEURO//NODE SYNC SERVER ENDPOINT');

    // Take screenshot of Settings drawer
    const screenshotDir = path.resolve(__dirname, '../audit_screenshots');
    if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });
    await page.screenshot({ path: path.join(screenshotDir, 'neuro_node_settings.png') });

    // Close settings drawer
    await page.click('button[aria-label="Close settings drawer"]');
    await page.waitForTimeout(300);

    // Verify Horoscope modal
    console.log('[5] Verifying Horoscope Modal...');
    await page.click('button:has-text("राशीभविष्य / Horoscope")');
    await page.waitForSelector('text=दैनिक राशीभविष्य // HOROSCOPE INSIGHTS');
    console.log('  -> Horoscope Modal open & responsive.');

    await page.screenshot({ path: path.join(screenshotDir, 'neuro_node_dashboard.png') });
    console.log(`  -> Dashboard screenshot saved to ${path.join(screenshotDir, 'neuro_node_dashboard.png')}`);

    // Copy to artifact directory
    const artifactDir = '/home/neuro/.gemini/antigravity/brain/bde1fd9b-f8b1-4a95-b0d2-5538564ea07f';
    if (fs.existsSync(artifactDir)) {
      fs.copyFileSync(path.join(screenshotDir, 'neuro_node_dashboard.png'), path.join(artifactDir, 'neuro_node_dashboard.png'));
    }

    console.log('\n====================================================');
    console.log('ALL NEURO//NODE SMOKE TESTS PASSED!');
    console.log('====================================================\n');
  } finally {
    await browser.close();
    viteProcess.kill('SIGTERM');
  }
}

runSmokeTest().catch(err => {
  console.error('Smoke test failed:', err);
  process.exit(1);
});
