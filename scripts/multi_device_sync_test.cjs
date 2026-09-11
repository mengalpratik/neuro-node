const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', 'audit_screenshots', 'phase2_sync');
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runMultiDeviceSyncTest() {
  console.log('====================================================');
  console.log('  NEURO//NODE // MULTI-DEVICE E2E REAL BROWSER QA');
  console.log('====================================================\n');

  const browser = await chromium.launch({
    headless: true,
  });

  // Context A: Laptop Desktop (1280x800)
  const contextA = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) ThinkPad NeuroNode-Host',
  });

  // Context B: Mobile Device (390x844, Android Pixel 8 simulation)
  const contextB = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) NeuroNode-Mobile',
  });

  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    console.log('[Step 1] Loading dashboards on Device A (Laptop) and Device B (Mobile)...');
    await pageA.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    await pageB.goto('http://localhost:5173', { waitUntil: 'networkidle' });

    console.log('[Step 2] Opening Settings -> Devices & Sync on Device A (Host)...');
    await pageA.click('button[aria-label="Open main system settings menu"]');
    await pageA.waitForSelector('text=SYSTEM CONFIG // SETTINGS');
    await pageA.click('button:has-text("Devices & Sync")');
    await pageA.waitForSelector('text=THIS DEVICE IDENTITY');

    // Enable multi-device sync on Host
    const syncSwitchA = await pageA.locator('button[role="switch"]');
    const isCheckedA = (await syncSwitchA.getAttribute('aria-checked')) === 'true';
    if (!isCheckedA) {
      await syncSwitchA.click();
      console.log('  -> Enabled sync switch on Device A');
    }

    // Generate pairing code on Device A
    console.log('[Step 3] Device A generating secure single-use pairing code...');
    await pageA.click('button:has-text("Link Device")');
    await pageA.waitForSelector('text=LINK NEW DEVICE');
    await pageA.waitForSelector('text=EXPIRES IN:');

    // Extract generated code
    const codeElement = await pageA.locator('text=/^[2-9A-Z]{2}-[2-9A-Z]{2}-[2-9A-Z]{2}$/');
    const pairCode = (await codeElement.innerText()).trim();
    console.log(`  -> Generated Pairing Code: [ ${pairCode} ]`);

    await pageA.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_device_a_code_generated.png') });

    // Device B joins
    console.log('[Step 4] Opening Settings -> Devices & Sync on Device B (Mobile)...');
    await pageB.click('button[aria-label="Open main system settings menu"]');
    await pageB.waitForSelector('text=SYSTEM CONFIG // SETTINGS');
    await pageB.click('button:has-text("Devices & Sync")');
    await pageB.waitForSelector('text=THIS DEVICE IDENTITY');

    // Enable sync on Device B
    const syncSwitchB = await pageB.locator('button[role="switch"]');
    const isCheckedB = (await syncSwitchB.getAttribute('aria-checked')) === 'true';
    if (!isCheckedB) {
      await syncSwitchB.click();
      console.log('  -> Enabled sync switch on Device B');
    }

    // Device B enters pair code
    console.log(`[Step 5] Device B entering pair code [ ${pairCode} ]...`);
    await pageB.click('button:has-text("Link Device")');
    await pageB.waitForSelector('text=LINK NEW DEVICE');
    await pageB.click('button:has-text("ENTER CODE (JOIN)")');
    await pageB.fill('input[placeholder="XX-XX-XX"]', pairCode);
    await pageB.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_device_b_entering_code.png') });

    await pageB.click('button:has-text("REQUEST PAIRING")');
    console.log('  -> Pair request submitted by Device B.');

    // Context A receives interactive pairing request modal
    console.log('[Step 6] Device A verifying interactive human approval modal...');
    await pageA.waitForSelector('text=INCOMING PAIRING REQUEST', { timeout: 10000 });
    console.log('  -> Incoming pair request detected on Device A!');
    await pageA.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_device_a_incoming_pair_modal.png') });

    // Device A clicks Allow & Link
    console.log('[Step 7] Device A approving pairing request ([ Allow & Link ])...');
    await pageA.click('button:has-text("ALLOW & LINK")');
    await pageA.waitForSelector('text=INCOMING PAIRING REQUEST', { state: 'hidden' });

    // Wait for WebSocket pair resolution
    await pageA.waitForTimeout(1500);
    await pageB.waitForTimeout(1500);

    await pageA.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_device_a_paired_success.png') });
    await pageB.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_device_b_paired_success.png') });
    console.log('  -> Both devices successfully paired into sync group!');

    // Dismiss any open pair modal if visible
    const pairModalCloseA = pageA.locator('button[aria-label="Close pair modal"]');
    if (await pairModalCloseA.isVisible()) {
      await pairModalCloseA.click();
      await pageA.waitForTimeout(300);
    }
    const pairModalCloseB = pageB.locator('button[aria-label="Close pair modal"]');
    if (await pairModalCloseB.isVisible()) {
      await pairModalCloseB.click();
      await pageB.waitForTimeout(300);
    }

    // Close settings drawers
    await pageA.click('button[aria-label="Close settings drawer"]');
    await pageB.click('button[aria-label="Close settings drawer"]');

    // Test Real-Time Sync: Device A creates group and adds bookmark -> Device B receives in real-time
    console.log('\n[Step 8] Real-Time Sync Test: Device A creates group and adds bookmark...');
    // Create first group on Device A
    await pageA.click('button:has-text("New Group")');
    await pageA.waitForSelector('text=Create New Bookmark Group');
    await pageA.fill('input[placeholder*="Cloud Infrastructure"]', 'Sync Cluster');
    await pageA.click('button[type="submit"]:has-text("Create Group")');
    await pageA.waitForSelector('text=Sync Cluster');

    // Click add bookmark in the group on Device A
    const addBookmarkBtnA = await pageA.locator('button[aria-label="Add bookmark to this group"]').first();
    await addBookmarkBtnA.click();
    await pageA.waitForSelector('text=Add Bookmark to');
    await pageA.fill('input[placeholder*="https://github.com"]', 'https://news.ycombinator.com');
    await pageA.fill('input[placeholder*="GitHub Dashboard"]', 'Hacker News Sync');
    await pageA.click('button[type="submit"]:has-text("Add Bookmark")');

    console.log('  -> Bookmark created on Device A. Waiting for real-time propagation to Device B...');
    await pageB.waitForSelector('text=Hacker News Sync', { timeout: 10000 });
    console.log('  -> VERIFIED! Device B received "Hacker News Sync" without reloading page!');
    await pageB.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_device_b_realtime_synced.png') });

    // Test Offline Queue & Reconnect Convergence
    console.log('\n[Step 9] Offline Queue & Convergence Test: Disconnecting Device B...');
    await contextB.setOffline(true);
    console.log('  -> Device B is now OFFLINE.');
    await pageB.waitForTimeout(500);

    // Device B adds bookmark while offline
    console.log('  -> Device B adding "Ars Technica Offline" while completely disconnected...');
    const addBookmarkBtnB = await pageB.locator('button[aria-label="Add bookmark to this group"]').first();
    await addBookmarkBtnB.click();
    await pageB.waitForSelector('text=Add Bookmark to');
    await pageB.fill('input[placeholder*="https://github.com"]', 'https://arstechnica.com');
    await pageB.fill('input[placeholder*="GitHub Dashboard"]', 'Ars Technica Offline');
    await pageB.click('button[type="submit"]:has-text("Add Bookmark")');

    console.log('  -> Bookmark added to Device B local-first storage.');
    await pageB.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_device_b_offline_queued.png') });

    // Device B reconnects
    console.log('[Step 10] Reconnecting Device B to network...');
    await contextB.setOffline(false);
    await pageB.evaluate(() => window.dispatchEvent(new Event('online')));
    console.log('  -> Device B network restored. Waiting for convergence with Device A...');

    // Device A should now receive "Ars Technica Offline"
    await pageA.waitForSelector('text=Ars Technica Offline', { timeout: 20000 });
    console.log('  -> VERIFIED! Device A converged and received "Ars Technica Offline"!');

    await pageA.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_device_a_converged.png') });
    await pageB.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_device_b_converged.png') });

    console.log('\n====================================================');
    console.log('  ALL MULTI-DEVICE SYNC ACCEPTANCE CHECKS PASSED!');
    console.log('====================================================');
  } catch (err) {
    console.error('Test failed with error:', err);
    await pageA.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error_page_a.png') }).catch(() => {});
    await pageB.screenshot({ path: path.join(SCREENSHOTS_DIR, 'error_page_b.png') }).catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runMultiDeviceSyncTest();
