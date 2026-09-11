import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractDomain,
  isInternalOrLocalDomain,
  getFaviconUrl,
  markFaviconFailed,
  clearFaviconFailedCache,
} from '../services/favicon/faviconService';

describe('Favicon Service Architecture', () => {
  beforeEach(() => {
    clearFaviconFailedCache();
  });

  it('extracts hostnames safely from diverse URLs', () => {
    expect(extractDomain('https://github.com/trending')).toBe('github.com');
    expect(extractDomain('http://localhost:5173')).toBe('localhost');
    expect(extractDomain('not-a-valid-url')).toBeNull();
  });

  it('identifies internal, local, and private domains to prevent unwanted external requests', () => {
    expect(isInternalOrLocalDomain('localhost')).toBe(true);
    expect(isInternalOrLocalDomain('127.0.0.1')).toBe(true);
    expect(isInternalOrLocalDomain('internal.corp.local')).toBe(true);
    expect(isInternalOrLocalDomain('service.internal')).toBe(true);
    expect(isInternalOrLocalDomain('192.168.1.1')).toBe(true);
    expect(isInternalOrLocalDomain('github.com')).toBe(false);
    expect(isInternalOrLocalDomain('react.dev')).toBe(false);
  });

  it('generates optional favicon URLs for public web URLs', () => {
    const favicon = getFaviconUrl('https://github.com');
    expect(favicon).toContain('https://www.google.com/s2/favicons?domain=github.com');
  });

  it('suppresses requests for internal or invalid URLs', () => {
    expect(getFaviconUrl('http://localhost:3000')).toBeNull();
    expect(getFaviconUrl('https://my-router.local/admin')).toBeNull();
    expect(getFaviconUrl('invalid-url')).toBeNull();
  });

  it('remembers failed domains to avoid repeated network failures', () => {
    const testUrl = 'https://nonexistent-broken-domain.org';
    expect(getFaviconUrl(testUrl)).not.toBeNull();

    // Mark as failed
    markFaviconFailed(testUrl);

    // Subsequent lookups must immediately return null
    expect(getFaviconUrl(testUrl)).toBeNull();
  });
});
