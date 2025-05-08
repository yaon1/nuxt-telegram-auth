import { defineEventHandler } from 'h3'
import { useNitroApp } from '#imports'
import { useTelegramSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  const session = await useTelegramSession(event)
  if (session.data.user) await useNitroApp().hooks.callHook('telegram-auth:logout', { user: session.data.user, event })
  await session.clear()
  return { ok: true }
})
