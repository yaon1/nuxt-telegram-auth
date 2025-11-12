import { users } from '../plugins/users'

// Shows what the login hook collected. Protected so it isn't public.
export default defineEventHandler(async (event) => {
  await requireTelegramUser(event)
  return [...users.entries()].map(([id, u]) => ({ id, ...u }))
})
