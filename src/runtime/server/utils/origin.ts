import type { H3Event } from 'h3'
import { createError, getHeader, getRequestURL } from 'h3'

/**
 * Rejects cross-site POSTs to the auth endpoints. SameSite=Lax already stops the
 * cookie from being sent, but this also blocks login CSRF (forcing a victim into
 * the attacker's account with a replayed widget payload).
 */
export function assertSameOrigin(event: H3Event): void {
  const origin = getHeader(event, 'origin')
  if (!origin) return // non-browser clients and same-origin navigations may omit it
  if (origin !== getRequestURL(event).origin) {
    throw createError({ statusCode: 403, statusMessage: 'Cross-origin request rejected' })
  }
}
