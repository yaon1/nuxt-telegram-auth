<script setup lang="ts">
// Open this page as a Mini App: BotFather → /newapp → URL https://<tunnel>/mini-app
const { isMiniApp, signIn, user, haptic, pending, error } = useTelegramWebApp()
useWebAppTheme()
const count = ref(0)
useMainButton(computed(() => `Купить (${count.value})`), () => haptic.notify('success'), computed(() => count.value > 0))

onMounted(async () => {
  if (isMiniApp.value) await signIn()
})
</script>

<template>
  <main class="page mini">
    <h1>Mini App</h1>
    <p v-if="!isMiniApp">Откройте эту страницу из Telegram, чтобы увидеть Mini App.</p>
    <p v-else-if="pending">Входим…</p>
    <p v-else-if="user">Привет, {{ user.first_name }}!</p>
    <p v-if="error" class="error">{{ error }}</p>
    <button @click="count++; haptic.impact()">Добавить в корзину</button>
  </main>
</template>

<style scoped>
.mini { background: var(--tg-bg-color, transparent); color: var(--tg-text-color, inherit); }
</style>
