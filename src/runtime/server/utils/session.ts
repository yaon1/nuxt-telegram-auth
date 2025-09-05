import type { H3Event } from 'h3'
import { createError, useSession } from 'h3'
import { useRuntimeConfig } from '#imports'
import type { TelegramUser } from './verify'

interface SessionData {
  user?: TelegramUser
  /** Unix ms when the cookie was last re-issued; drives the rolling expiry. */
  refreshedAt?: number
}

export function useTelegramSession(event: H3Event) {
  const { telegramAuth } = useRuntimeConfig(event)
  if (!telegramAuth.sessionPassword || telegramAuth.sessionPassword.length < 32) {
    throw createError({ statusCode: 500, statusMessage: 'telegramAuth.sessionPassword must be at least 32 characters' })
  }
  const { name, domain, sameSite, secure } = telegramAuth.cookie
  return useSession<SessionData>(event, {
    name,
    password: telegramAuth.sessionPassword,
    maxAge: telegramAuth.sessionMaxAge,
    // Mini Apps open inside Telegram's webview on telegram.org frames; they need SameSite=None.
    cookie: { sameSite, domain, httpOnly: true, secure: secure ?? (sameSite === 'none' || !import.meta.dev) },
  })
}

export async function getTelegramUser(event: H3Event): Promise<TelegramUser | null> {
  // Unsealing the cookie costs a few crypto calls; reuse the result within one request.
  if (!('telegramUser' in event.context)) {
    event.context.telegramUser = (await useTelegramSession(event)).data.user ?? null
  }
  return event.context.telegramUser as TelegramUser | null
}

/**
 * Re-issues the cookie once half its lifetime has passed, so active users stay
 * signed in while idle sessions still expire after sessionMaxAge.
 */
export async function refreshTelegramSession(event: H3Event, now = Date.now()): Promise<void> {
  const session = await useTelegramSession(event)
  if (!session.data.user) return
  const maxAgeMs = useRuntimeConfig(event).telegramAuth.sessionMaxAge * 1000
  if (now - (session.data.refreshedAt ?? 0) > maxAgeMs / 2) {
    await session.update({ refreshedAt: now })
  }
}

/** Throws 401 when the request has no authenticated Telegram user. */
export async function requireTelegramUser(event: H3Event): Promise<TelegramUser> {
  const user = await getTelegramUser(event)
  if (!user) throw createError({ statusCode: 401, statusMessage: 'Telegram login required' })
  return user
}
