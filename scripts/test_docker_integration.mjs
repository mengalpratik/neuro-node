import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const TEST_PORT = 8799;
const TEST_DATA_DIR = '/tmp/neuro_node_test_data';

if (fs.existsSync(TEST_DATA_DIR)) {
  fs.rmSync(TEST_DATA_DIR, { recursive: true, force: true });
}
fs.mkdirSync(TEST_DATA_DIR, { recursive: true });

console.log('--- Step 1: Starting unified production server on port ' + TEST_PORT + ' ---');
const serverProcess = spawn('node', ['server/index.mjs'], {
  env: {
    ...process.env,
    PORT: String(TEST_PORT),
    HOST: '127.0.0.1',
    DATA_DIR: TEST_DATA_DIR,
    STATIC_DIR: path.resolve('dist'),
    NODE_ENV: 'production',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
});

serverProcess.stdout.on('data', d => process.stdout.write(`[SERVER OUT] ${d}`));
serverProcess.stderr.on('data', d => process.stderr.write(`[SERVER ERR] ${d}`));

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

async function run() {
  await sleep(1500);

  console.log('\n--- Step 2: Testing HTTP endpoints ---');

  // Test /health
  const healthRes = await fetch(`http://127.0.0.1:${TEST_PORT}/health`);
  const healthJson = await healthRes.json();
  console.log('Healthcheck /health status:', healthRes.status, healthJson);
  if (healthRes.status !== 200 || healthJson.status !== 'ok') {
    throw new Error('/health failed');
  }

  // Test /api/health
  const apiHealthRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/health`);
  const apiHealthJson = await apiHealthRes.json();
  console.log('Healthcheck /api/health status:', apiHealthRes.status, apiHealthJson);
  if (apiHealthRes.status !== 200 || apiHealthJson.status !== 'ok') {
    throw new Error('/api/health failed');
  }

  // Test static index.html
  const rootRes = await fetch(`http://127.0.0.1:${TEST_PORT}/`);
  const rootText = await rootRes.text();
  console.log('Root / status:', rootRes.status, 'Content-Type:', rootRes.headers.get('content-type'));
  if (!rootText.includes('NEURO//NODE') && !rootText.includes('root')) {
    throw new Error('Static index.html did not contain expected content');
  }

  // Test SPA fallback for deep route
  const spaRes = await fetch(`http://127.0.0.1:${TEST_PORT}/some/random/client/route`);
  const spaText = await spaRes.text();
  console.log('SPA fallback status:', spaRes.status, 'Content-Type:', spaRes.headers.get('content-type'));
  if (spaRes.status !== 200 || !spaText.toLowerCase().includes('<!doctype html>')) {
    throw new Error('SPA fallback did not return HTML');
  }

  // Test 404 on nonexistent API route
  const badApiRes = await fetch(`http://127.0.0.1:${TEST_PORT}/api/nonexistent`);
  console.log('Unmatched API route status:', badApiRes.status);
  if (badApiRes.status !== 404) {
    throw new Error('Unmatched API did not return 404');
  }

  console.log('\n--- Step 3: Launching Playwright Dual-Browser (Desktop + Mobile) ---');
  const browser = await chromium.launch({ headless: true });

  // Context A: Desktop (1280x800)
  const contextA = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const pageA = await contextA.newPage();

  // Context B: Mobile (375x667)
  const contextB = await browser.newContext({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
  });
  const pageB = await contextB.newPage();

  pageA.on('console', msg => console.log(`[PAGE A] ${msg.text()}`));
  pageA.on('pageerror', err => console.log(`[PAGE A ERROR] ${err}`));
  pageB.on('console', msg => console.log(`[PAGE B] ${msg.text()}`));
  pageB.on('pageerror', err => console.log(`[PAGE B ERROR] ${err}`));

  console.log('Navigating Device A (Desktop)...');
  await pageA.goto(`http://127.0.0.1:${TEST_PORT}/`, { waitUntil: 'networkidle' });
  await pageA.waitForSelector('text=NEURO//NODE', { timeout: 10000 });

  console.log('Navigating Device B (Mobile)...');
  await pageB.goto(`http://127.0.0.1:${TEST_PORT}/`, { waitUntil: 'networkidle' });
  await pageB.waitForSelector('text=NEURO//NODE', { timeout: 10000 });

  await sleep(1000);

  console.log('\n--- Step 4: Device Pairing Workflow ---');
  // Device A opens settings drawer -> Devices & Sync
  console.log('Device A: Opening Settings drawer...');
  await pageA.click('button[aria-label="Open main system settings menu"]');
  await pageA.click('button:has-text("Devices & Sync")');

  // Device A clicks "Link Device"
  console.log('Device A: Generating Pair Code...');
  await pageA.click('button:has-text("Link Device")');
  await pageA.waitForSelector('text=EXPIRES IN', { timeout: 10000 });

  // Extract the generated code (pattern XX-XX-XX)
  const codeLocator = pageA.locator('text=EXPIRES IN').locator('..').locator('..').locator('div').first();
  const pairCodeRaw = await codeLocator.innerText();
  const match = pairCodeRaw.match(/[0-9A-Z]{2}-[0-9A-Z]{2}-[0-9A-Z]{2}/);
  if (!match) {
    throw new Error('Failed to match pair code from: ' + pairCodeRaw);
  }
  const pairCode = match[0];
  console.log('Device A generated pair code:', pairCode);

  // Device B opens settings -> Devices & Sync
  console.log('Device B: Opening Settings drawer...');
  await pageB.click('button[aria-label="Open main system settings menu"]');
  await pageB.click('button:has-text("Devices & Sync")');

  // Device B clicks "Link Device" -> "ENTER CODE (JOIN)"
  console.log('Device B: Entering Pair Code...');
  await pageB.click('button:has-text("Link Device")');
  await pageB.click('button:has-text("ENTER CODE (JOIN)")');
  await pageB.fill('input[placeholder="XX-XX-XX"]', pairCode);
  await sleep(500);
  await pageB.click('button:has-text("REQUEST PAIRING")');

  console.log('Device B submitted pair request.');

  // Device A should receive live pair request dialog
  console.log('Device A: Waiting for incoming pair request modal...');
  await pageA.waitForSelector('text=INCOMING PAIRING REQUEST', { timeout: 10000 });
  console.log('Device A received incoming pair request modal! Approving...');
  await pageA.click('button:has-text("ALLOW & LINK")');

  await sleep(2000);

  // Close modals and settings drawers on both
  const closePairA = await pageA.$('button[aria-label="Close pair modal"]');
  if (closePairA) await closePairA.click();
  const closeDrawerA = await pageA.$('button[aria-label="Close settings drawer"]');
  if (closeDrawerA) await closeDrawerA.click();

  const closePairB = await pageB.$('button[aria-label="Close pair modal"]');
  if (closePairB) await closePairB.click();
  const closeDrawerB = await pageB.$('button[aria-label="Close settings drawer"]');
  if (closeDrawerB) await closeDrawerB.click();

  await sleep(1000);

  console.log('\n--- Step 5: Real-time Data Synchronization ---');
  // Device A adds a new Bookmark Group "DOCKER_PROD_TEST"
  console.log('Device A: Adding new bookmark group "DOCKER_PROD_TEST"...');
  await pageA.click('div[aria-label="Add new bookmark group"]');
  await pageA.waitForSelector('text=Create New Bookmark Group');
  await pageA.fill('input[type="text"]', 'DOCKER_PROD_TEST');
  await pageA.click('button:has-text("Create Group")');

  // Verify group appears on Device A
  await pageA.waitForSelector('text=DOCKER_PROD_TEST', { timeout: 5000 });
  console.log('Device A has group "DOCKER_PROD_TEST".');

  // Verify group synchronizes real-time to Device B
  console.log('Device B: Checking for synced group "DOCKER_PROD_TEST"...');
  await pageB.waitForSelector('text=DOCKER_PROD_TEST', { timeout: 8000 });
  console.log('SUCCESS: Device B received "DOCKER_PROD_TEST" in real time via WebSocket!');

  console.log('\n--- Step 6: Offline-First Queue & Convergence Test ---');
  console.log('Device B: Simulating offline mode...');
  await contextB.setOffline(true);
  await sleep(1000);

  // Device B adds a bookmark while offline inside DOCKER_PROD_TEST
  console.log('Device B: Adding bookmark while offline...');
  await pageB.click('button[aria-label="Add bookmark to this group"]');
  await pageB.waitForSelector('text=Add Bookmark to DOCKER_PROD_TEST');
  await pageB.fill('input[placeholder*="github.com"]', 'https://example.com/docker');
  await pageB.fill('input[placeholder*="GitHub Dashboard"]', 'Offline Docker Bookmark');
  await pageB.locator('div[role="dialog"] button[type="submit"]').click();

  // Verify bookmark is visible locally on Device B
  await pageB.waitForSelector('text=Offline Docker Bookmark', { timeout: 5000 });
  console.log('Device B: "Offline Docker Bookmark" created locally while offline.');

  // Device A should NOT have it yet because B is offline
  const countOnA = await pageA.locator('text=Offline Docker Bookmark').count();
  console.log('Device A bookmark count before B reconnects (expected 0):', countOnA);
  if (countOnA !== 0) throw new Error('Device A saw bookmark while B was offline!');

  // Reconnect Device B
  console.log('Device B: Reconnecting to network...');
  await contextB.setOffline(false);
  await sleep(3000);

  // Device A should now converge and receive the queued bookmark
  console.log('Device A: Waiting for converged bookmark from Device B...');
  await pageA.waitForSelector('text=Offline Docker Bookmark', { timeout: 10000 });
  console.log('SUCCESS: Device A converged and received "Offline Docker Bookmark"!');

  // Take audit screenshots
  await pageA.screenshot({ path: 'audit_screenshots/docker_verification_desktop.png' });
  await pageB.screenshot({ path: 'audit_screenshots/docker_verification_mobile.png' });
  console.log('Audit screenshots saved to audit_screenshots/.');

  await browser.close();

  console.log('\n--- Step 7: Persistence Verification ---');
  // Check that sync_db.json exists on disk
  const dbFile = path.join(TEST_DATA_DIR, 'sync_db.json');
  if (!fs.existsSync(dbFile)) {
    throw new Error('sync_db.json does not exist in data dir!');
  }
  const dbRaw = fs.readFileSync(dbFile, 'utf-8');
  const dbData = JSON.parse(dbRaw);
  console.log('Database on disk contains:');
  console.log('- Devices registered:', Object.keys(dbData.devices || {}).length);
  console.log('- Sync Groups active:', Object.keys(dbData.syncGroups || {}).length);

  const groupKeys = Object.keys(dbData.syncGroups || {});
  if (groupKeys.length > 0) {
    const group = dbData.syncGroups[groupKeys[0]];
    console.log('- Total operations recorded in group:', (group.operations || []).length);
  }

  // Gracefully terminate server
  serverProcess.kill('SIGTERM');
  await sleep(1000);
  console.log('Server terminated cleanly.');
  console.log('\n=============================================');
  console.log('ALL DOCKER INTEGRATION SMOKE TESTS PASSED!');
  console.log('=============================================');
}

run().catch(err => {
  console.error('\nTEST FAILURE:', err);
  serverProcess.kill('SIGKILL');
  process.exit(1);
});
