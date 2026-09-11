const { chromium } = require('playwright');

async function testLargeData() {
  console.log('--- STARTING LARGE DATA STRESS TEST ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  const targetUrl = process.env.TEST_URL || 'http://localhost:4173/';
  await page.goto(targetUrl);
  await page.waitForTimeout(500);

  // Generate 16 groups, 8 bookmarks per group = 128 bookmarks total
  const largeState = {
    version: 1,
    app: 'PersonalDashboard',
    theme: {
      themePreset: 'matrix',
      accentColor: '#00ff66',
      accentRgb: '0, 255, 102',
      secondaryColor: '#7ba38e',
      backgroundType: 'gradient',
      backgroundValue: 'radial-gradient(ellipse at top, #0c2417 0%, #050f0a 45%, #010402 100%)',
      glassOpacity: 0.7,
      glassBlur: 16,
      borderIntensity: 0.35,
    },
    bookmarkGroups: Array.from({ length: 16 }, (_, gIdx) => ({
      id: `stress-group-${gIdx}`,
      title: `Cluster Segment ${gIdx + 1}`,
      order: gIdx,
      bookmarks: Array.from({ length: 8 }, (_, bIdx) => ({
        id: `stress-b-${gIdx}-${bIdx}`,
        title: `Resource ${gIdx + 1}.${bIdx + 1}`,
        url: `https://resource-${gIdx + 1}-${bIdx + 1}.internal`,
        order: bIdx,
      })),
    })),
    preferences: {
      timeFormat: '12h',
      weather: { city: 'Pune', lat: 18.52, lon: 73.85, units: 'metric', autoDetect: false },
      google: { enabled: false, clientId: '' },
      reminders: [],
    },
  };

  await page.evaluate(state => {
    localStorage.setItem('PERSONAL_DASHBOARD_V1', JSON.stringify(state));
  }, largeState);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(600);

  // Check group count
  const cardCount = await page.locator('text=/Cluster Segment/i').count();
  console.log('Rendered stress cards count:', cardCount);

  // Check horizontal overflow
  const isOverflowing = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  console.log('Horizontal overflow under stress:', isOverflowing ? 'FAIL' : 'PASS');

  // Check storage indicator in header
  const storageReadout = await page.locator('text=/LOCAL DATA:/i').innerText();
  console.log('Header storage readout under 128 bookmarks:', storageReadout);

  // Verify smooth scroll down
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(300);
  const scrollY = await page.evaluate(() => window.scrollY);
  console.log('Scroll down position:', scrollY);

  await browser.close();
  console.log('Large Data Stress Test completed successfully!');
}

testLargeData();
