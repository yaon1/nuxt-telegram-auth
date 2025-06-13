export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('telegram-auth:login', ({ user }) => {
    if (user.username === 'banned') throw createError({ statusCode: 403, statusMessage: 'Banned' })
  })
})
