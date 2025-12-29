# Coffee Analytics MVP (Beget-ready)

SaaS MVP для владельцев кофеен: учет финансов, себестоимости, P&L и управление доступом по разовой оплате.

## Возможности
- Многокофейный учет для одного пользователя
- Рецептуры и средневзвешенная себестоимость ингредиентов
- Продажи/расходы (ручной ввод и CSV импорт)
- Финансовая аналитика и P&L
- Платные тарифы без автопродления (Tinkoff СБП)
- Управление тарифами в админке

---

# Инструкция по установке на Beget

## 1️⃣ Подготовка хостинга
1. Создайте новый сайт в панели Beget.
2. Создайте базу данных MySQL (или PostgreSQL) и пользователя.
3. Сохраните доступы:
   - DB_HOST
   - DB_NAME
   - DB_USER
   - DB_PASSWORD
4. Подготовьте доступ по FTP/SSH.

## 2️⃣ Загрузка проекта
1. Загрузите весь проект в каталог сайта.
2. Рекомендуемая структура:
   - `public` — доступная из интернета директория (см. ниже)
   - `src`, `package.json`, `knexfile.js` — в корне проекта
3. Настройте корневую директорию сайта на `/public` (если Beget позволяет).
   - Если нет: перенесите `src/public` в корневой каталог сайта и скорректируйте путь статики.
4. Установите права доступа:
   - Каталоги: `755`
   - Файлы: `644`

## 3️⃣ Настройка окружения
1. Создайте файл `.env` в корне проекта.
2. Пример содержимого:
   ```
   APP_NAME=CoffeeAnalytics
   APP_URL=https://your-domain.ru
   PORT=3000
   SESSION_SECRET=your_random_secret

   DB_CLIENT=mysql2
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name

   TINKOFF_TERMINAL_KEY=your_terminal_key
   TINKOFF_PASSWORD=your_terminal_password
   TINKOFF_NOTIFICATION_URL=https://your-domain.ru/webhooks/tinkoff
   TINKOFF_SUCCESS_URL=https://your-domain.ru/subscription/success
   TINKOFF_FAIL_URL=https://your-domain.ru/subscription/fail
   ```
3. Обязательно задайте `SESSION_SECRET`.

## 4️⃣ Установка зависимостей
1. Через SSH:
   ```bash
   npm install
   ```
2. Если фронтенд собирается отдельно, запуск сборки не требуется (сервер рендерит EJS).

## 5️⃣ Инициализация БД
1. Запустите миграции:
   ```bash
   npm run migrate
   ```
2. Заполните таблицу тарифов:
   ```bash
   npm run seed
   ```

## 6️⃣ Настройка webhook Тинькофф
1. В личном кабинете Тинькофф укажите URL webhook:
   - `https://your-domain.ru/webhooks/tinkoff`
2. Убедитесь, что параметр `TINKOFF_PASSWORD` в `.env` совпадает с секретом Тинькофф.
3. Проверка подписи выполняется в `src/utils/tinkoff.js`.

## 7️⃣ Запуск приложения
1. В Beget Node Manager выберите `src/app.js` как точку входа.
2. Укажите порт (совпадает с `PORT` в `.env`).
3. Перезапустите приложение.

## 8️⃣ Проверка работы
1. Зарегистрируйтесь и войдите.
2. Создайте кофейню.
3. Заполните ингредиенты, рецепты, продажи и расходы.
4. Проверьте дашборд и P&L.
5. Проведите оплату тарифа через СБП.

---

## Команды
- `npm run migrate` — применить миграции
- `npm run seed` — заполнить тарифы
- `npm start` — запуск сервера

---

## Дополнительно
- CSV шаблоны доступны на страницах импорта.
- Все формулы аналитики реализованы в `src/utils/analytics.js`.
- Проверка подписи Tinkoff — `src/utils/tinkoff.js`.
