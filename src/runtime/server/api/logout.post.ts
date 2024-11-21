import { defineEventHandler } from 'h3'
import { useTelegramSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  await (await useTelegramSession(event)).clear()
  return { ok: true }
})
