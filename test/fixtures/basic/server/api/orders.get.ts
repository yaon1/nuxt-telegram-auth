export default defineTelegramAuthHandler((_event, user) => ({ owner: user.id, orders: [] }))
