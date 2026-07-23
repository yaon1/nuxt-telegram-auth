<script setup lang="ts">
definePageMeta({ middleware: 'telegram-auth' })
const { user } = useTelegramAuth()
</script>

<template>
  <h1>Админка</h1>
  <p>Вы вошли как {{ user?.first_name }}.</p>
</template>
