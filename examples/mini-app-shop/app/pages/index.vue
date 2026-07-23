<script setup lang="ts">
const { isMiniApp, signIn, user, haptic } = useTelegramWebApp({ expand: true })
useWebAppTheme()

const cart = ref<string[]>([])
const products = ['Кофе', 'Круассан', 'Сок']
useMainButton(computed(() => `Оплатить (${cart.value.length})`), checkout, computed(() => cart.value.length > 0))

onMounted(() => isMiniApp.value && signIn())

function add(product: string) {
  cart.value.push(product)
  haptic.impact()
}

async function checkout() {
  await $fetch('/api/orders', { method: 'POST', body: { items: cart.value } })
  haptic.notify('success')
  cart.value = []
}
</script>

<template>
  <main :style="{ background: 'var(--tg-bg-color)', color: 'var(--tg-text-color)' }">
    <h1>Привет{{ user ? `, ${user.first_name}` : '' }}!</h1>
    <button v-for="p in products" :key="p" @click="add(p)">{{ p }}</button>
  </main>
</template>
