<script setup lang="ts">
definePageMeta({ middleware: 'telegram-auth' })
const { user } = useTelegramAuth()
</script>

<template>
  <p>private {{ user?.first_name }}</p>
</template>
