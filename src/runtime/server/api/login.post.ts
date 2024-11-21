import { createError, defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { useTelegramSession } from '../utils/session'
import { verifyTelegramLogin } from '../utils/verify'

export default defineEventHandler(async (event) => {
  const { telegramAuth } = useRuntimeConfig(event)
  const body = await readBody<Record<string, unknown>>(event)
  const result = await verifyTelegramLogin(body ?? {}, telegramAuth.botToken, telegramAuth.authMaxAge)

  if (!result.ok) {
    throw createError({ statusCode: result.reason === 'malformed' ? 400 : 401, statusMessage: `Telegram login ${result.reason}` })
  }

  const session = await useTelegramSession(event)
  await session.update({ user: result.user })
  return result.user
})
