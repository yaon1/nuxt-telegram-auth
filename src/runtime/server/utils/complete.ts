import type { H3Event } from 'h3'
import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'
import { isAllowed } from './allow'
import { useTelegramSession } from './session'
import type { TelegramUser } from './verify'

/** Single place where a verified user becomes a session, whichever way they signed in. */
export async function completeLogin(event: H3Event, user: TelegramUser): Promise<TelegramUser> {
  if (!isAllowed(user, useRuntimeConfig(event).telegramAuth.allowedUsers)) {
    throw createError({ statusCode: 403, statusMessage: 'This Telegram account is not allowed to sign in' })
  }
  await (await useTelegramSession(event)).update({ user })
  return user
}
