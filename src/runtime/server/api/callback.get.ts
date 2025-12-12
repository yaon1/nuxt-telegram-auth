import { createError, defineEventHandler, getQuery, sendRedirect } from 'h3'
import { useRuntimeConfig } from '#imports'
import { safeRedirect } from '../utils/redirect'
import { completeLogin } from '../utils/complete'
import { verifyTelegramLogin } from '../utils/verify'

/**
 * Target for the widget's redirect mode (`data-auth-url`): Telegram sends the user
 * here with the signed fields in the query string. Works without JavaScript callbacks.
 */
export default defineEventHandler(async (event) => {
  const { telegramAuth } = useRuntimeConfig(event)
  if (!telegramAuth.botToken)
    throw createError({ statusCode: 500, statusMessage: 'Set NUXT_TELEGRAM_AUTH_BOT_TOKEN to verify Telegram logins' })
  const { redirect, ...query } = getQuery(event)
  const fields = Object.fromEntries(Object.entries(query).map(([k, v]) => [k, k === 'id' || k === 'auth_date' ? Number(v) : v]))
  const result = await verifyTelegramLogin(fields, telegramAuth.botToken, telegramAuth.authMaxAge)

  if (!result.ok) {
    throw createError({ statusCode: result.reason === 'malformed' ? 400 : 401, statusMessage: `Telegram login ${result.reason}` })
  }

  await completeLogin(event, result.user)
  return sendRedirect(event, safeRedirect(redirect))
})
