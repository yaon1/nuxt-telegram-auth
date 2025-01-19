# nuxt-telegram-auth

Telegram Login for **Nuxt 4** (and 3.16+). Drop in a button, get a verified user in a sealed cookie session.

- `<TelegramLoginButton>`: the official Login Widget as a component
- Server-side signature and freshness check on **Web Crypto**, so it works on Node, Bun, Deno, Cloudflare and Vercel Edge
- Encrypted, `httpOnly` cookie session, no database required
- `useTelegramAuth()` on the client, `requireTelegramUser(event)` on the server (both auto-imported)

## Setup

```bash
npm i nuxt-telegram-auth
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-telegram-auth'],
  telegramAuth: { botUsername: 'my_bot' },
})
```

```bash
# .env
NUXT_TELEGRAM_AUTH_BOT_TOKEN=123456:ABC...
NUXT_TELEGRAM_AUTH_SESSION_PASSWORD=a-random-string-of-at-least-32-chars
```

In @BotFather run `/setdomain` and set your site's domain, otherwise the widget won't render.

## Usage

```vue
<script setup lang="ts">
const { user, loggedIn, fetchSession, logout } = useTelegramAuth()
await fetchSession() // SSR-safe: forwards the cookie on the server
</script>

<template>
  <p v-if="loggedIn">Hi, {{ user.first_name }} <button @click="logout">Log out</button></p>
  <TelegramLoginButton v-else :corner-radius="8" request-access @login="(u) => console.log(u)" />
</template>
```

```ts
// server/api/orders.get.ts
export default defineEventHandler(async (event) => {
  const user = await requireTelegramUser(event) // 401 if not logged in
  return getOrdersFor(user.id)
})
```

## Options

| Option | Default | |
|---|---|---|
| `botUsername` | — | Bot username without `@` |
| `botToken` | — | Better set via `NUXT_TELEGRAM_AUTH_BOT_TOKEN` |
| `sessionPassword` | — | ≥ 32 chars, via `NUXT_TELEGRAM_AUTH_SESSION_PASSWORD` |
| `authMaxAge` | `86400` | Reject widget payloads older than this (seconds) |
| `sessionMaxAge` | `2592000` | Cookie lifetime (seconds) |
| `apiBase` | `/api/_auth/telegram` | Prefix for `login`, `session`, `logout` routes |

## Development

```bash
npm i
cp playground/.env.example playground/.env
npm run dev:prepare
npm run dev
npm test
```

## License

MIT
