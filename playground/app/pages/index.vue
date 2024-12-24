<script setup lang="ts">
const { user, loggedIn, fetchSession, logout } = useTelegramAuth()
await fetchSession()
</script>

<template>
  <main style="font-family: system-ui; max-width: 480px; margin: 48px auto">
    <h1>nuxt-telegram-auth</h1>
    <template v-if="loggedIn">
      <p>Hello, {{ user?.first_name }} <span v-if="user?.username">(@{{ user.username }})</span></p>
      <button @click="logout">Log out</button>
      <p><a href="/api/me">GET /api/me</a> (protected)</p>
    </template>
    <TelegramLoginButton v-else size="large" :corner-radius="8" @error="console.error" />
  </main>
</template>
