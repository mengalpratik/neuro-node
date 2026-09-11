code = r"""const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_URL || 'http://localhost:5173/';
const SCREENSHOTS_DIR = path.join(__dirname, '../audit_screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

async function runAudit() {
  console.log('==================================================');
  console.log('LAUNCHING REAL BROWSER QA AUDIT (NEXUS DASHBOARD)');
  console.log('Target URL:', BASE_URL);
  console.log('==================================================\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  const consoleMessages = [];
  const pageErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on('pageerror', err => {
    pageErrors.push(err.toString());
  });

  const results = {};

  try {
    // 1. INITIAL LOAD & DESKTOP 1440x900
    console.log('1. Testing Desktop 1440x900 Initial Load...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);

    const title = await page.title();
    console.log('Page title:', title);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, 'desktop-1440x900.png') });

    // Verify Brand
    const brandText = await page.locator('h1').innerText();
    const hasBrand = brandText.includes('NEXUS') && brandText.includes('COMMAND');
    console.log('Brand header detected:', hasBrand);

    // 2. DESKTOP VIEWPORT MATRIX (1280x720, 1366x768, 1440x900, 1920x1080)
    console.log('\n2. Testing Desktop Viewport Matrix for Overflow & Clipping...');
    const desktopViewports = [
      { width: 1280, height: 720 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1920, height: 1080 },
    ];

    let desktopOverflowPass = true;
    for (const vp of desktopViewports) {
      await page.setViewportSize(vp);
      await page.waitForTimeout(300);
      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`Viewport ${vp.width}x${vp.height} horizontal scroll overflow:`, isOverflowing ? 'FAIL' : 'PASS');
      if (isOverflowing) desktopOverflowPass = false;
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `desktop-${vp.width}x${vp.height}.png`) });
    }
    results['DESKTOP'] = desktopOverflowPass ? 'PASS' : 'FAIL';

    // 3. MOBILE VIEWPORT MATRIX (320px, 360px, 375px, 390px, 430px)
    console.log('\n3. Testing Mobile Viewport Matrix (320px to 430px)...');
    const mobileViewports = [320, 360, 375, 390, 430];
    let mobileOverflowPass = true;

    for (const width of mobileViewports) {
      await page.setViewportSize({ width, height: 800 });
      await page.waitForTimeout(300);

      const isOverflowing = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      console.log(`Mobile ${width}px horizontal scroll overflow:`, isOverflowing ? 'FAIL' : 'PASS');
      if (isOverflowing) mobileOverflowPass = false;
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `mobile-${width}px.png`) });
    }
    results['MOBILE'] = mobileOverflowPass ? 'PASS' : 'FAIL';

    // Reset to comfortable 1440x900 for functional tests
    await page.setViewportSize({ width: 1440, height: 900 });

    // 4. CLOCK REALITY CHECK
    console.log('\n4. Verifying Clock Reality & Precision...');
    const clockText1 = await page.locator('text=/\\d{1,2}:\\d{2}:\\d{2}\\s*(AM|PM)/i').innerText();
    console.log('Clock initial read:', clockText1);
    await page.waitForTimeout(1100);
    const clockText2 = await page.locator('text=/\\d{1,2}:\\d{2}:\\d{2}\\s*(AM|PM)/i').innerText();
    console.log('Clock tick read (+1.1s):', clockText2);

    const clockTicked = clockText1 !== clockText2;
    console.log('Clock ticking every second:', clockTicked ? 'PASS' : 'FAIL');
    results['CLOCK'] = clockTicked ? 'PASS' : 'FAIL';

    // 5. WEATHER TELEMETRY CHECK
    console.log('\n5. Verifying Weather Telemetry Card...');
    const weatherHeaderText = await page.locator('text=/METEOROLOGY/i').first().innerText();
    console.log('Weather Status Header:', weatherHeaderText);
    const hasLiveOrCached = weatherHeaderText.includes('LIVE') || weatherHeaderText.includes('CACHED') || weatherHeaderText.includes('OFFLINE');
    results['WEATHER'] = hasLiveOrCached ? 'PASS' : 'FAIL';

    // 6. INDIAN LUNISOLAR CALENDAR CHECK
    console.log('\n6. Verifying Indian Lunisolar Calendar...');
    const calendarHeader = await page.locator('text=/भारतीय पंचांग/i').innerText();
    console.log('Calendar Header:', calendarHeader);
    const hasShaka = await page.locator('text=/शके/i').isVisible();
    const hasPaksha = await page.locator('text=/पक्ष/i').isVisible();
    console.log('Shaka year visible:', hasShaka, '| Paksha visible:', hasPaksha);

    // 7. GOOGLE CALENDAR / LOCAL MODE BADGE CHECK
    console.log('\n7. Verifying Schedule & Google Integration Mode...');
    const localModeBadge = await page.locator('text=/LOCAL MODE/i').isVisible();
    console.log('Truthful LOCAL MODE badge visible when unconfigured:', localModeBadge);
    results['GOOGLE INTEGRATION'] = localModeBadge ? 'PASS (UNCONFIGURED TRUTHFUL)' : 'FAIL';

    // 8. HOROSCOPE MODAL INTERACTION & SCROLLING
    console.log('\n8. Testing Horoscope Modal QA...');
    const horoscopeBtn = page.locator('button:has-text("राशीभविष्य / Horoscope")');
    await horoscopeBtn.click();
    await page.waitForTimeout(300);

    const horoscopeTitle = await page.locator('text=/दैनिक राशीभविष्य/i').isVisible();
    console.log('Horoscope modal opened:', horoscopeTitle);

    // Test element filter
    await page.locator('button:text("Fire")').click();
    await page.waitForTimeout(200);
    const meshVisible = await page.locator('text=/Mesh/i').isVisible();
    console.log('Fire element filter active (Mesh visible):', meshVisible);

    // Test close via Escape key
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    const horoscopeClosed = !(await page.locator('text=/दैनिक राशीभविष्य/i').isVisible());
    console.log('Horoscope closed via Escape key:', horoscopeClosed);
    results['HOROSCOPE'] = (horoscopeTitle && meshVisible && horoscopeClosed) ? 'PASS' : 'FAIL';

    // 9. BOOKMARK CRUD & LOCALSTORAGE REALITY CHECK
    console.log('\n9. Testing Bookmark CRUD & LocalStorage Persistence...');

    // A. Create new group
    const addGroupBtn = page.locator('[aria-label="Add new bookmark group"]');
    await addGroupBtn.click();
    await page.waitForTimeout(300);

    await page.fill('input[placeholder*="Cloud Infrastructure"]', 'Cyber Test Cluster');
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForTimeout(400);

    const newGroupCard = page.locator('.glass-panel:has-text("Cyber Test Cluster")').first();
    const newGroupVisible = await newGroupCard.isVisible();
    console.log('Created new group "Cyber Test Cluster":', newGroupVisible);

    // B. Add bookmark into the new group
    const addBookmarkBtn = newGroupCard.locator('button[aria-label="Add bookmark to this group"]');
    await addBookmarkBtn.click();
    await page.waitForTimeout(300);

    await page.fill('input[placeholder*="github.com"]', 'https://github.com/nexus-core');
    await page.fill('input[placeholder*="GitHub Dashboard"]', 'Nexus Source');
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForTimeout(400);

    const bookmarkVisible = await newGroupCard.locator('text=Nexus Source').isVisible();
    console.log('Added bookmark "Nexus Source":', bookmarkVisible);

    // C. Edit bookmark
    const bookmarkItem = newGroupCard.locator('.group:has-text("Nexus Source")').first();
    const bookmarkEditBtn = bookmarkItem.locator('button[aria-label*="Edit"]');
    await bookmarkEditBtn.click();
    await page.waitForTimeout(300);

    await page.fill('input[placeholder*="GitHub Dashboard"]', 'Nexus Source Edited');
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForTimeout(400);

    const bookmarkEdited = await newGroupCard.locator('text=Nexus Source Edited').isVisible();
    console.log('Edited bookmark "Nexus Source Edited":', bookmarkEdited);

    // D. Rename group
    const groupMenuBtn = newGroupCard.locator('button[aria-label*="Menu for group"]');
    await groupMenuBtn.click();
    await page.waitForTimeout(200);
    await page.click('button:has-text("Rename Group")');
    await page.waitForTimeout(300);

    await page.fill('input[placeholder*="Cloud Infrastructure"]', 'Cyber Test Cluster Renamed');
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForTimeout(400);

    const targetGroupCard = page.locator('.glass-panel:has-text("Cyber Test Cluster Renamed")').first();
    const groupRenamed = await targetGroupCard.isVisible();
    console.log('Renamed group:', groupRenamed);

    results['BOOKMARK CRUD'] = (newGroupVisible && bookmarkVisible && bookmarkEdited && groupRenamed) ? 'PASS' : 'FAIL';

    // 10. LOCALSTORAGE PERSISTENCE ACROSS RELOAD
    console.log('\n10. Testing Persistence Across Page Reload...');
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    const persistedGroup = await page.locator('text=Cyber Test Cluster Renamed').isVisible();
    const persistedBookmark = await page.locator('text=Nexus Source Edited').isVisible();
    console.log('Persisted group after reload:', persistedGroup);
    console.log('Persisted bookmark after reload:', persistedBookmark);

    const storageKeys = await page.evaluate(() => Object.keys(localStorage));
    console.log('localStorage keys present:', storageKeys);
    const storageData = await page.evaluate(() => JSON.parse(localStorage.getItem('PERSONAL_DASHBOARD_V1')));
    console.log('Dashboard state schema version:', storageData?.version, '| Groups count:', storageData?.bookmarkGroups?.length);

    results['LOCALSTORAGE'] = (persistedGroup && persistedBookmark && storageData?.version === 1 && storageData?.bookmarkGroups?.length > 0) ? 'PASS' : 'FAIL';

    // 11. REORDERING
    console.log('\n11. Testing Group and Bookmark Reordering...');
    const reorderGroupCard = page.locator('.glass-panel:has-text("Cyber Test Cluster Renamed")').first();
    await reorderGroupCard.locator('button[aria-label="Add bookmark to this group"]').click();
    await page.waitForTimeout(300);
    await page.fill('input[placeholder*="github.com"]', 'https://alpha.example.com');
    await page.fill('input[placeholder*="GitHub Dashboard"]', 'Alpha Test');
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForTimeout(400);

    const itemNamesBefore = await reorderGroupCard.locator('a[target="_blank"]').allInnerTexts();
    console.log('Bookmark order before move:', itemNamesBefore);

    const secondItem = reorderGroupCard.locator('.group:has-text("Alpha Test")').first();
    await secondItem.locator('button[aria-label*="up"]').click();
    await page.waitForTimeout(400);

    const itemNamesAfter = await reorderGroupCard.locator('a[target="_blank"]').allInnerTexts();
    console.log('Bookmark order after Move Up:', itemNamesAfter);
    const reorderPass = itemNamesAfter[0].includes('Alpha Test');
    console.log('Reorder Move Up successful:', reorderPass);
    results['REORDER'] = reorderPass ? 'PASS' : 'FAIL';

    // 12. URL SECURITY
    console.log('\n12. Testing Bookmark URL Security (XSS / Unsafe Schemes)...');
    await reorderGroupCard.locator('button[aria-label="Add bookmark to this group"]').click();
    await page.waitForTimeout(300);
    await page.fill('input[placeholder*="github.com"]', 'javascript:alert("XSS")');
    await page.fill('input[placeholder*="GitHub Dashboard"]', 'XSS Attack');
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForTimeout(300);

    const errorMessage = await page.locator('text=/Invalid or unsafe URL scheme/i').isVisible();
    console.log('Rejected javascript: scheme with error message:', errorMessage);

    await page.fill('input[placeholder*="github.com"]', 'data:text/html,<script>alert(1)</script>');
    await page.locator('[role="dialog"] button[type="submit"]').click();
    await page.waitForTimeout(300);
    const dataErrorMessage = await page.locator('text=/Invalid or unsafe URL scheme/i').isVisible();
    console.log('Rejected data: scheme with error message:', dataErrorMessage);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    results['URL SECURITY'] = (errorMessage && dataErrorMessage) ? 'PASS' : 'FAIL';

    // 13. THEME CONTROLS
    console.log('\n13. Testing Theme Controls & Persistence...');
    await page.locator('button[aria-label="Open main system settings menu"]').click();
    await page.waitForTimeout(300);

    const cyanBtn = page.locator('button:has-text("Cyberpunk Cyan")');
    await cyanBtn.click();
    await page.waitForTimeout(300);

    const themeAccent = await page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-rgb'));
    console.log('Cyberpunk Cyan accent RGB:', themeAccent);
    const themeApplied = themeAccent.trim() === '0, 240, 255';
    console.log('Theme applied correctly:', themeApplied);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    await page.reload({ waitUntil: 'networkidle' });
    const persistedAccent = await page.evaluate(() => document.documentElement.style.getPropertyValue('--accent-rgb'));
    console.log('Persisted accent RGB after reload:', persistedAccent);
    results['THEME'] = (themeApplied && persistedAccent.trim() === '0, 240, 255') ? 'PASS' : 'FAIL';

    // 14. WALLPAPER CONTROLS
    console.log('\n14. Testing Wallpaper Controls...');
    await page.locator('button[aria-label="Open main system settings menu"]').click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Wallpaper', exact: true }).click();
    await page.waitForTimeout(300);

    await page.getByRole('button', { name: 'solid', exact: true }).click();
    await page.waitForTimeout(200);

    await page.getByRole('button', { name: 'gradient', exact: true }).click();
    await page.waitForTimeout(200);

    await page.getByRole('button', { name: 'wallpaper', exact: true }).click();
    await page.waitForTimeout(200);
    await page.fill('input[placeholder="https://example.com/wallpaper.jpg"]', 'ftp://invalid-url');
    await page.click('button:has-text("Apply URL")');
    await page.waitForTimeout(300);
    const urlErrorVisible = await page.locator('text=/Please enter a valid HTTP or HTTPS image URL/i').isVisible();
    console.log('Custom wallpaper URL validation rejected invalid scheme:', urlErrorVisible);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    results['WALLPAPER'] = urlErrorVisible ? 'PASS' : 'FAIL';

    // 15. IMPORT / EXPORT & CONFLICT RESOLUTION
    console.log('\n15. Testing Import/Export End-to-End Conflict Resolution...');

    const deviceABackup = {
      app: 'PersonalDashboard',
      version: 1,
      timestamp: new Date().toISOString(),
      theme: {
        preset: 'matrix',
        accentColor: '#00ff66',
        secondaryColor: '#7ba38e',
        backgroundType: 'gradient',
        backgroundValue: 'radial-gradient(ellipse at top, #0c2417 0%, #050f0a 45%, #010402 100%)',
        glassOpacity: 0.7,
        blurAmount: 16,
        borderIntensity: 0.35,
      },
      bookmarkGroups: [
        {
          id: 'group-dev',
          title: 'Development',
          order: 0,
          bookmarks: [
            { id: 'b-gh', title: 'GitHub', url: 'https://github.com', order: 0 },
            { id: 'b-node', title: 'Node.js', url: 'https://nodejs.org', order: 1 },
            { id: 'b-ts', title: 'TypeScript', url: 'https://www.typescriptlang.org', order: 2 },
          ],
        },
      ],
      preferences: {
        weather: { city: 'Mumbai', lat: 18.96, lon: 72.82, unit: 'celsius', autoDetect: false },
        google: { enabled: false, clientId: '' },
      },
    };

    // Set local state: Development with GitHub and React
    await page.evaluate(() => {
      const currentState = JSON.parse(localStorage.getItem('PERSONAL_DASHBOARD_V1'));
      currentState.bookmarkGroups = [
        {
          id: 'group-dev-local',
          title: 'Development',
          order: 0,
          bookmarks: [
            { id: 'b-gh-local', title: 'GitHub', url: 'https://github.com', order: 0 },
            { id: 'b-react-local', title: 'React', url: 'https://react.dev', order: 1 },
          ],
        },
      ];
      localStorage.setItem('PERSONAL_DASHBOARD_V1', JSON.stringify(currentState));
    });

    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    await page.locator('button[aria-label="Open main system settings menu"]').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Data & Backup")').click();
    await page.waitForTimeout(300);

    const tempBackupFile = path.join(__dirname, 'temp_backup_a.json');
    fs.writeFileSync(tempBackupFile, JSON.stringify(deviceABackup, null, 2));

    const fileInput = page.locator('input[type="file"][accept*="json"]');
    await fileInput.setInputFiles(tempBackupFile);
    await page.waitForTimeout(400);

    const conflictModalVisible = await page.locator('text=/Import Conflict Resolution/i').isVisible();
    console.log('Conflict Resolution Modal opened:', conflictModalVisible);

    // Merge Data + Keep Current Device Styling
    await page.locator('button:has-text("Merge Data")').click();
    await page.locator('button:has-text("Keep Current Device Styling")').click();
    await page.locator('button:has-text("Confirm & Import")').click();
    await page.waitForTimeout(500);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const devGroupCard = page.locator('.glass-panel:has-text("Development")').first();
    const mergedBookmarkTitles = await devGroupCard.locator('a[target="_blank"]').allInnerTexts();
    console.log('Merged Development bookmarks:', mergedBookmarkTitles);

    const hasGitHubOnce = mergedBookmarkTitles.filter(t => t.includes('GitHub')).length === 1;
    const hasReact = mergedBookmarkTitles.some(t => t.includes('React'));
    const hasNode = mergedBookmarkTitles.some(t => t.includes('Node.js'));
    const hasTS = mergedBookmarkTitles.some(t => t.includes('TypeScript'));

    const mergePassed = hasGitHubOnce && hasReact && hasNode && hasTS;
    console.log('Merge correctly preserved unique URLs without duplicates:', mergePassed);
    results['MERGE'] = mergePassed ? 'PASS' : 'FAIL';

    // 16. REPLACE TEST
    console.log('\n16. Testing Replace Mode...');
    await page.evaluate(() => {
      const currentState = JSON.parse(localStorage.getItem('PERSONAL_DASHBOARD_V1'));
      currentState.bookmarkGroups = [
        {
          id: 'group-railway',
          title: 'Railway & Transit',
          order: 0,
          bookmarks: [{ id: 'b-irctc', title: 'IRCTC', url: 'https://irctc.co.in', order: 0 }],
        },
      ];
      localStorage.setItem('PERSONAL_DASHBOARD_V1', JSON.stringify(currentState));
    });
    await page.reload({ waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    await page.locator('button[aria-label="Open main system settings menu"]').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Data & Backup")').click();
    await page.waitForTimeout(300);

    await page.locator('input[type="file"][accept*="json"]').setInputFiles(tempBackupFile);
    await page.waitForTimeout(400);

    await page.locator('button:has-text("Replace Data")').click();
    await page.locator('button:has-text("Apply Imported Styling")').click();
    await page.locator('button:has-text("Confirm & Import")').click();
    await page.waitForTimeout(500);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const railwayGone = !(await page.locator('text=Railway & Transit').isVisible());
    const devPresent = await page.locator('text=Development').isVisible();
    const replacePassed = railwayGone && devPresent;
    console.log('Replace mode successfully replaced local state:', replacePassed);
    results['REPLACE'] = replacePassed ? 'PASS' : 'FAIL';

    // 17. INVALID IMPORT SAFETY
    console.log('\n17. Testing Invalid Import Safety (Corrupt & Malformed JSON)...');
    const invalidFile = path.join(__dirname, 'temp_invalid.json');
    fs.writeFileSync(invalidFile, '{"broken": json');

    await page.locator('button[aria-label="Open main system settings menu"]').click();
    await page.waitForTimeout(300);
    await page.locator('button:has-text("Data & Backup")').click();
    await page.waitForTimeout(300);

    await page.locator('input[type="file"][accept*="json"]').setInputFiles(invalidFile);
    await page.waitForTimeout(400);

    const importError = await page.locator('text=/Invalid JSON format/i').isVisible();
    console.log('Malformed JSON correctly caught and displayed error:', importError);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);

    const stateStillSafe = await page.locator('text=Development').isVisible();
    console.log('Existing state remained intact during failed import:', stateStillSafe);
    results['IMPORT SAFETY'] = (importError && stateStillSafe) ? 'PASS' : 'FAIL';

    if (fs.existsSync(tempBackupFile)) fs.unlinkSync(tempBackupFile);
    if (fs.existsSync(invalidFile)) fs.unlinkSync(invalidFile);

    // 18. ACCESSIBILITY QA
    console.log('\n18. Testing Keyboard Navigation & Focus Accessibility...');
    await page.keyboard.press('Tab');
    const activeTagName = await page.evaluate(() => document.activeElement?.tagName);
    console.log('Keyboard Tab focused element:', activeTagName);

    await page.locator('button[aria-label="Open main system settings menu"]').click();
    await page.waitForTimeout(200);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const settingsClosed = !(await page.locator('text=/SYSTEM CONFIG \\/\\/ SETTINGS/i').isVisible());
    console.log('Settings drawer accessible via Escape key:', settingsClosed);
    results['ACCESSIBILITY'] = settingsClosed ? 'PASS' : 'FAIL';

    // 19. CONSOLE ERRORS
    console.log('\n19. Checking Console Errors...');
    console.log('Logged Page Errors:', pageErrors);
    console.log('Logged Console Messages:', consoleMessages);
    results['CONSOLE'] = pageErrors.length === 0 ? 'PASS' : 'FAIL';

  } catch (err) {
    console.error('Audit encountered error:', err);
  } finally {
    await browser.close();
    console.log('\n==================================================');
    console.log('AUDIT EXECUTION COMPLETED');
    console.log('SUMMARY RESULTS:');
    console.log(JSON.stringify(results, null, 2));
    console.log('==================================================');
  }
}

runAudit();
"""

with open('scripts/qa_audit.cjs', 'w') as f:
    f.write(code)

print("scripts/qa_audit.cjs updated successfully!")
