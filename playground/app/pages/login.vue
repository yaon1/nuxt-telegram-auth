<script setup lang="ts">
const route = useRoute()
const redirect = computed(() => (typeof route.query.redirect === 'string' ? route.query.redirect : '/'))
const { error, devLogin } = useTelegramAuth()
const isDev = import.meta.dev

async function signInAsDev() {
  await devLogin({ id: 42, first_name: 'Ada', username: 'ada' })
  await navigateTo(redirect.value)
}
</script>

<template>
  <main class="page">
    <h1>Вход</h1>
    <p>Через JS-callback (остаёмся на странице):</p>
    <TelegramLoginButton :corner-radius="8" @login="navigateTo(redirect)">
      <template #loading>Загружаем кнопку Telegram…</template>
    </TelegramLoginButton>
    <p>Через редирект (работает и в браузерах, блокирующих сторонние скрипты для callback):</p>
    <TelegramLoginButton mode="redirect" :redirect-to="redirect" size="medium" />
    <p v-if="isDev"><button @click="signInAsDev">Войти как Ada (только dev)</button></p>
    <p v-if="error" class="error">{{ error }}</p>
  </main>
</template>
