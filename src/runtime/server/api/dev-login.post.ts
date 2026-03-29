import { createError, defineEventHandler, readBody } from 'h3'
import { completeLogin } from '../utils/complete'

/**
 * Development only: sign in as any user without Telegram. The real widget refuses
 * to render on localhost, so this keeps local work unblocked. Never registered in production builds.
 */
export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404 })
  const body = await readBody<{ id?: number; first_name?: string; username?: string }>(event)
  return completeLogin(event, {
    id: body?.id ?? 1,
    first_name: body?.first_name ?? 'Dev',
    username: body?.username ?? 'dev_user',
    auth_date: Math.floor(Date.now() / 1000),
  })
})
