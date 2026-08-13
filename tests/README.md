# Тесты бота

Проверяют корзину и оформление заказа на живых `data.js` и `app.js`.

```bash
cd ~/Desktop/SAM_TEA_bot/tests
npm install jsdom
node test_cart.js && node test_checkout.js
```

Запускать после любых правок в `app.js`, особенно в корзине, фасовках и расчёте доставки.
