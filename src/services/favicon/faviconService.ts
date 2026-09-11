/**
 * Favicon Service
 * Isolates favicon retrieval as an optional enhancement.
 * Ensures bookmark rendering and dashboard reliability never depend on external favicon services.
 */

// In-memory set of failed hostnames to prevent repetitive failed network calls
const failedDomains = new Set<string>();

/**
 * Extracts a clean hostname from a given URL string.
 */
export function extractDomain(urlStr: string): string | null {
  if (!urlStr || typeof urlStr !== 'string') return null;
  try {
    const parsed = new URL(urlStr.trim());
    return parsed.hostname;
  } catch {
    return null;
  }
}

/**
 * Checks whether a given hostname is a local/internal network address
 * that should not trigger external favicon queries.
 */
export function isInternalOrLocalDomain(domain: string): boolean {
  if (!domain) return true;
  const lower = domain.toLowerCase();
  return (
    lower === 'localhost' ||
    lower === '127.0.0.1' ||
    lower === '::1' ||
    lower.endsWith('.local') ||
    lower.endsWith('.internal') ||
    lower.endsWith('.test') ||
    lower.endsWith('.example') ||
    lower.endsWith('.invalid') ||
    lower.startsWith('192.168.') ||
    lower.startsWith('10.') ||
    (lower.startsWith('172.') && /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(lower))
  );
}

/**
 * Returns a candidate favicon URL or null if offline, invalid, or internal.
 * Fails silently and treats favicons as strictly optional.
 */
export function getFaviconUrl(urlStr: string): string | null {
  // If browser is offline, don't attempt external network requests
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return null;
  }

  const domain = extractDomain(urlStr);
  if (!domain) return null;

  // Don't query external providers for local/internal IPs or domains
  if (isInternalOrLocalDomain(domain)) {
    return null;
  }

  // If this domain previously failed, don't repeat failed requests
  if (failedDomains.has(domain)) {
    return null;
  }

  // Use Google's public favicon service as an optional, isolated provider
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

/**
 * Records a domain load failure to avoid subsequent redundant requests.
 */
export function markFaviconFailed(urlStr: string): void {
  const domain = extractDomain(urlStr);
  if (domain) {
    failedDomains.add(domain);
  }
}

/**
 * Clears the failed domain cache (e.g. for testing).
 */
export function clearFaviconFailedCache(): void {
  failedDomains.clear();
}
