<script setup lang="ts">
definePageMeta({ middleware: 'telegram-auth' })
const { user, logout } = useTelegramAuth()

async function signOut() {
  await logout()
  await navigateTo('/')
}
</script>

<template>
  <main class="page">
    <h1>Кабинет</h1>
    <p>Страница защищена middleware <code>telegram-auth</code>.</p>
    <img v-if="user?.photo_url" :src="user.photo_url" alt="" width="64" height="64" />
    <p>{{ user?.first_name }} {{ user?.last_name }} · id {{ user?.id }}</p>
    <button @click="signOut">Выйти</button>
  </main>
</template>
