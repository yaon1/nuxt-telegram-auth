# Changelog

## [0.2.0] — 2026-10-19

### Добавлено
- Telegram Mini Apps: вход по `initData`, `useTelegramWebApp`, `useWebAppTheme`, `useMainButton`, `useBackButton`, вибрация.
- Проверка Mini App без токена бота (Ed25519, `verifyWebAppSignature`).
- Вход через редирект (`mode="redirect"`, маршрут `callback`).
- Middleware `telegram-auth` и `telegram-guest`.
- `allowedUsers`, хуки `telegram-auth:login` / `telegram-auth:logout` с `startParam`.
- `defineTelegramAuthHandler`, `devLogin()` в dev-режиме.
- Скользящее продление сессии, настройки cookie, `webAppMaxAge`.
- `pending`/`error` в `useTelegramAuth`, синхронизация выхода между вкладками.
- e2e-тесты на `@nuxt/test-utils`.

### Безопасность
- Отклонение кросс-доменных POST (login CSRF).
- Защита параметра `redirect` от open redirect.

### Исправлено
- Импорт `useNitroApp` и типы настроек cookie на сервере.

## [0.1.0]

- Login Widget, проверка подписи, cookie-сессия, `useTelegramAuth`, `requireTelegramUser`.
