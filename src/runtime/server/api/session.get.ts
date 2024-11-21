import { defineEventHandler } from 'h3'
import { getTelegramUser } from '../utils/session'

export default defineEventHandler(async (event) => ({ user: await getTelegramUser(event) }))
