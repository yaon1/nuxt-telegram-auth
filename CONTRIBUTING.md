# Как внести вклад

```bash
npm i
npm run dev:prepare
npm run dev        # playground
npm test           # unit + e2e (собирает fixture-приложение)
npm run lint && npm run typecheck
```

- Новый серверный маршрут → `src/runtime/server/api`, регистрация в `src/module.ts`, e2e-тест в `test/e2e.test.ts`.
- Криптография — только Web Crypto (`crypto.subtle`), без `node:crypto`, чтобы модуль работал на edge.
- Тесты подписей сверяйте с независимой реализацией на `node:crypto` (см. `test/helpers.ts`).
- Коммиты в формате [Conventional Commits](https://www.conventionalcommits.org/ru/).
