# Люмен — VK Play

Отдельная сборка для VK Play (GMRID 52011). Исходная HTML-версия живёт в `lumen/` и сюда не входит.

Браузерная головоломка: совмещай одинаковые ростки в ночной оранжерее. Рекламы нет. Покупки через `paymentFrame`, начисление только после `paymentReceivedCallback`. Прогресс Windows/Android пишется в облако по uid.

## Ссылки

- Игра в iframe: https://makeev095.github.io/lumen-vk/
- Кабинет: https://developers.vkplay.ru/dev/games/52011/locales/ru_RU/
- Биллинг и сейв: https://lumen-vkplay-billing.makey-studio.workers.dev/

## Локально

```sh
python3 -m http.server 8091
# http://127.0.0.1:8091/?debug
```

На localhost нет iframeApi: магазин показывает цены, оплата работает только внутри VK Play.
