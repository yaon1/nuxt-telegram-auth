export default defineEventHandler(async (event) => {
  const user = await requireTelegramUser(event)
  return { id: user.id }
})
