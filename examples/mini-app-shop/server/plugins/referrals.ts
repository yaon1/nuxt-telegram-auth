// t.me/acme_shop_bot/app?startapp=ref_42 → credit user 42 for the new customer.
export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('telegram-auth:login', ({ user, startParam }) => {
    if (startParam?.startsWith('ref_')) console.info(`user ${user.id} referred by ${startParam.slice(4)}`)
  })
})
