<script setup lang="ts">
import { navigateTo } from '#imports'
import { useTelegramAuth } from '../composables/useTelegramAuth'

const props = withDefaults(defineProps<{ to?: string }>(), { to: '/' })
const emit = defineEmits<{ logout: [] }>()
const { logout, pending } = useTelegramAuth()

async function onClick() {
  await logout()
  emit('logout')
  await navigateTo(props.to)
}
</script>

<template>
  <button type="button" :disabled="pending" @click="onClick"><slot>Выйти</slot></button>
</template>
