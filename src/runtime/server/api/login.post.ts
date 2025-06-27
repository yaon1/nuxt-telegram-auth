import { createError, defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { assertSameOrigin } from '../utils/origin'
import { completeLogin } from '../utils/complete'
import { verifyTelegramLogin } from '../utils/verify'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const { telegramAuth } = useRuntimeConfig(event)
  const body = await readBody<Record<string, unknown>>(event)
  const result = await verifyTelegramLogin(body ?? {}, telegramAuth.botToken, telegramAuth.authMaxAge)

  if (!result.ok) {
    throw createError({ statusCode: result.reason === 'malformed' ? 400 : 401, statusMessage: `Telegram login ${result.reason}` })
  }

  return completeLogin(event, result.user)
})
