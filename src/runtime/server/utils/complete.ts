import type { H3Event } from 'h3'
import { useTelegramSession } from './session'
import type { TelegramUser } from './verify'

/** Single place where a verified user becomes a session, whichever way they signed in. */
export async function completeLogin(event: H3Event, user: TelegramUser): Promise<TelegramUser> {
  await (await useTelegramSession(event)).update({ user })
  return user
}
