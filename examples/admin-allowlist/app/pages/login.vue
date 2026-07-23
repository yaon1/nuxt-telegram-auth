<script setup lang="ts">
definePageMeta({ middleware: 'telegram-guest' })
const { error } = useTelegramAuth()
</script>

<template>
  <h1>Вход для администраторов</h1>
  <TelegramLoginButton mode="redirect" redirect-to="/" />
  <p v-if="error">{{ error }}</p>
</template>
