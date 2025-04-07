import { createError, defineEventHandler, getQuery, sendRedirect } from 'h3'
import { useRuntimeConfig } from '#imports'
import { safeRedirect } from '../utils/redirect'
import { useTelegramSession } from '../utils/session'
import { verifyTelegramLogin } from '../utils/verify'

/**
 * Target for the widget's redirect mode (`data-auth-url`): Telegram sends the user
 * here with the signed fields in the query string. Works without JavaScript callbacks.
 */
export default defineEventHandler(async (event) => {
  const { telegramAuth } = useRuntimeConfig(event)
  const { redirect, ...query } = getQuery(event)
  const fields = Object.fromEntries(Object.entries(query).map(([k, v]) => [k, k === 'id' || k === 'auth_date' ? Number(v) : v]))
  const result = await verifyTelegramLogin(fields, telegramAuth.botToken, telegramAuth.authMaxAge)

  if (!result.ok) {
    throw createError({ statusCode: result.reason === 'malformed' ? 400 : 401, statusMessage: `Telegram login ${result.reason}` })
  }

  await (await useTelegramSession(event)).update({ user: result.user })
  return sendRedirect(event, safeRedirect(redirect))
})
