import { createConfigForNuxt } from '@nuxt/eslint-config/flat'
import prettier from 'eslint-config-prettier'

export default createConfigForNuxt({
  features: { tooling: true },
  dirs: { src: ['./playground', './test/fixtures/basic'] },
})
  .append({ ignores: ['dist', '**/.nuxt', '**/.output'] })
  .append({ rules: { 'vue/multi-word-component-names': 'off' } })
  .append(prettier)
