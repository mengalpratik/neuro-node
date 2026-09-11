import { DeviceIdentity } from '../../types/dashboard';

/**
 * Generates a permanent cryptographically secure random Device ID.
 * Format: dev_<16 hex chars>
 */
export function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return 'dev_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  return 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

/**
 * Generates a human-friendly short device identifier for display and pairing verification.
 * Format: ABC-1234
 */
export function generateShortId(deviceId: string): string {
  const clean = deviceId.replace(/^dev_/, '').toUpperCase();
  const prefix = clean.substring(0, 3) || 'DEV';
  const suffix = clean.substring(clean.length - 4) || '9999';
  return `${prefix}-${suffix}`;
}

/**
 * Generates an initial friendly device name based on platform detection.
 */
export function getDefaultDeviceName(): string {
  if (typeof navigator === 'undefined') return 'Primary Device';
  const ua = navigator.userAgent.toLowerCase();
  if (/android/.test(ua)) return 'Android Device';
  if (/iphone|ipad|ipod/.test(ua)) return 'Apple Device';
  if (/macintosh|mac os x/.test(ua)) return 'Mac Laptop';
  if (/windows/.test(ua)) return 'Windows PC';
  if (/linux/.test(ua)) return 'Linux Machine';
  return 'Personal Dashboard';
}

/**
 * Creates a brand new DeviceIdentity contract.
 */
export function createNewDeviceIdentity(nameOverride?: string): DeviceIdentity {
  const deviceId = generateDeviceId();
  const shortId = generateShortId(deviceId);
  const now = Date.now();
  return {
    deviceId,
    deviceName: nameOverride || getDefaultDeviceName(),
    shortId,
    createdAt: now,
    lastSeenAt: now,
  };
}
