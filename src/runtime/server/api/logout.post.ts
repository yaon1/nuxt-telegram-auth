import { assertSameOrigin } from '../utils/origin'
import { defineEventHandler } from 'h3'
import { useNitroApp } from 'nitropack/runtime'
import { useTelegramSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  assertSameOrigin(event)
  const session = await useTelegramSession(event)
  if (session.data.user) await useNitroApp().hooks.callHook('telegram-auth:logout', { user: session.data.user, event })
  await session.clear()
  event.context.telegramUser = null
  return { ok: true }
})
