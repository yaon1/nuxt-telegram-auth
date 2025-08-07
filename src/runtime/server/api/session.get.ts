import { defineEventHandler } from 'h3'
import { getTelegramUser, refreshTelegramSession } from '../utils/session'

export default defineEventHandler(async (event) => {
  await refreshTelegramSession(event)
  return { user: await getTelegramUser(event) }
})
