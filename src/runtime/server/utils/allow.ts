import type { TelegramUser } from './verify'

/**
 * Checks a user against an allow-list of numeric ids and/or usernames
 * (case-insensitive, with or without "@"). An empty list allows everyone.
 */
export function isAllowed(user: Pick<TelegramUser, 'id' | 'username'>, allowList: readonly (string | number)[]): boolean {
  if (allowList.length === 0) return true
  const username = user.username?.toLowerCase()
  return allowList.some((entry) =>
    typeof entry === 'number' || /^\d+$/.test(entry) ? Number(entry) === user.id : username !== undefined && entry.replace(/^@/, '').toLowerCase() === username,
  )
}
