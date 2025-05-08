// Example: keep a registry of users who signed in. Swap the Map for your database.
const users = new Map<number, { name: string; lastLogin: number }>()

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('telegram-auth:login', ({ user }) => {
    users.set(user.id, { name: user.first_name, lastLogin: Date.now() })
  })
})

export { users }
