export default defineTelegramAuthHandler(async (event, user) => {
  const { items } = await readBody<{ items: string[] }>(event)
  return { orderId: crypto.randomUUID(), userId: user.id, items }
})
