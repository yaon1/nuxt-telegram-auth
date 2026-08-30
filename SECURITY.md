# Безопасность

Об уязвимостях сообщайте через [приватный advisory](https://github.com/yaon1/nuxt-telegram-auth/security/advisories/new).

Модель угроз описана в разделе «Безопасность» README. Обязательно:

- храните `botToken` и `sessionPassword` только в переменных окружения;
- при смене `sessionPassword` все сессии становятся недействительными — это способ разлогинить всех;
- не отключайте HTTPS в продакшене: без него cookie не получит флаг `Secure`.
