export const seen: { startParam?: string } = {}

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('telegram-auth:login', ({ startParam }) => {
    seen.startParam = startParam
  })
})
