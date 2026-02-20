import type { EventHandler, EventHandlerRequest, H3Event } from 'h3'
import { defineEventHandler } from 'h3'
import { requireTelegramUser } from './session'
import type { TelegramUser } from './verify'

/**
 * Event handler that only runs for signed-in users and receives the user directly:
 *
 *   export default defineTelegramAuthHandler((event, user) => getOrders(user.id))
 */
export function defineTelegramAuthHandler<T>(handler: (event: H3Event, user: TelegramUser) => T | Promise<T>): EventHandler<EventHandlerRequest, Promise<T>> {
  return defineEventHandler(async (event) => handler(event, await requireTelegramUser(event)))
}
