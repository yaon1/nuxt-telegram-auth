/**
 * Only same-site relative paths are allowed as post-login targets, so the
 * `redirect` parameter can't be used to bounce users to another site.
 */
export function safeRedirect(target: unknown, fallback = '/'): string {
  if (typeof target !== 'string' || !target.startsWith('/') || target.startsWith('//') || target.includes('\\')) return fallback
  return target
}
