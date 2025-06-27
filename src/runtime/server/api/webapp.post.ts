import { createError, defineEventHandler, readBody } from 'h3'
import { useRuntimeConfig } from '#imports'
import { assertSameOrigin } from '../utils/origin'
import { completeLogin } from '../utils/complete'
import { verifyWebAppInitData } from '../utils/webapp'

/** Exchanges Mini App initData for the same cookie session the Login Widget creates. */
export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const { telegramAuth } = useRuntimeConfig(event)
  const body = await readBody<{ initData?: unknown }>(event)
  const initData = typeof body?.initData === 'string' ? body.initData : ''
  const result = await verifyWebAppInitData(initData, telegramAuth.botToken, telegramAuth.authMaxAge)

  if (!result.ok) {
    throw createError({ statusCode: result.reason === 'malformed' ? 400 : 401, statusMessage: `Mini App init data ${result.reason}` })
  }
  if (!result.data.user) {
    throw createError({ statusCode: 400, statusMessage: 'Mini App init data has no user' })
  }

  const { language_code: _lang, is_premium: _premium, allows_write_to_pm: _pm, ...user } = result.data.user
  const sessionUser = { ...user, auth_date: result.data.auth_date }
  return completeLogin(event, sessionUser)
})
