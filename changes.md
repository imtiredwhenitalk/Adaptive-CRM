# Adaptive CRM — журнал роботи

## 2026-10-08

- Проаналізовано структуру репозиторію та наявний Vite/React starter.
- Замінено демонстраційний Vite-екран на повноцінний Adaptive CRM продукт:
  - маркетинговий головний сайт українською мовою;
  - hero-блок з унікальною концепцією Adaptive Signals;
  - секції переваг, workflow, безпеки та CTA;
  - адаптивна верстка для мобільних пристроїв;
  - dashboard web-app з оглядом доходу, угод, сигналів AI та фокусом дня;
  - мобільна навігація sidebar;
  - модальні екрани реєстрації та входу з валідацією полів;
  - demo-перехід з landing page до dashboard.
- Додано production Docker-оточення:
  - `Dockerfile` з multi-stage build;
  - `frontend-app/nginx.conf` для SPA fallback та health endpoint;
  - `docker-compose.yml` з портом `8080`, restart policy та healthcheck.
- Візуальний напрям: теплий off-white фон, індиго-акцент, Manrope/DM Sans, editorial SaaS aesthetic.

## Нотатка про поточний стан

Реєстрація та вхід наразі є UX-flow на фронтенді, який після submit відкриває demo dashboard. Для production-персистентності наступним кроком потрібно під'єднати API backend до існуючих backend-модулів, додати базу даних, сесії та email verification.

## 2026-10-08 — інтерактивний workspace

- Перетворено dashboard з презентаційного екрану на робочий локальний workspace:
  - навігація між оглядом, контактами, угодами, задачами, аналітикою та налаштуваннями;
  - пошук по контактах через верхню панель;
  - створення і видалення контактів;
  - локальне збереження контактів і задач у `localStorage`;
  - перемикання статусу задач з оновленням прогресу;
  - kanban-подання угод за етапами;
  - аналітичні KPI та Adaptive insight;
  - профільні налаштування і стани безпеки;
  - client-side валідація реєстрації та входу;
  - session persistence після перезавантаження.
- Перевірено браузером:
  - реєстрація відкриває dashboard;
  - навігація «Контакти» працює;
  - створення контакту відображає його у списку;
  - локальні дані зберігаються між рендерами.
- `npm run build` проходить успішно.
- `npx eslint src/App.tsx` проходить успішно.

## Важливе обмеження

`backend-app` наразі не має runnable server, package manifest або persistence layer: наявні файли є заготовками. Frontend готовий до підключення API, але production auth, multi-user isolation, серверна валідація та реальна база даних потребують окремого backend-рішення. Рекомендований напрям: Node.js API + PostgreSQL + httpOnly sessions.

## 2026-10-08 — production API

- Зафіксовано вибір: PostgreSQL + Node.js API + httpOnly sessions.
- Додано [backend-app/package.json](./backend-app/package.json), TypeScript-конфігурацію та production Dockerfile.
- Реалізовано API:
  - `POST /api/auth/register`;
  - `POST /api/auth/login`;
  - `POST /api/auth/logout`;
  - `GET /api/auth/me`;
  - `GET/POST/DELETE /api/contacts`.
- Додано:
  - bcrypt-хешування паролів;
  - випадкові 256-бітні session tokens;
  - httpOnly/sameSite cookies;
  - серверну Zod-валідацію;
  - user-scoped запити для ізоляції даних;
  - PostgreSQL schema bootstrap та `pgcrypto`;
  - health endpoint.
- Docker Compose тепер містить три сервіси:
  - frontend/nginx;
  - API;
  - PostgreSQL з persistent volume.
- Nginx проксить `/api/*` до API-сервісу.
- Auth modal підключений до `/api/auth/register` та `/api/auth/login`.
- Валідація:
  - frontend production build — успішно;
  - backend TypeScript build — успішно;
  - `npx eslint src/App.tsx` — успішно.
- Docker CLI в поточному середовищі недоступний, тому фактичний `docker compose up` локально не запускався.

## 2026-10-08 — заповнення модульної структури та ботів

- Перевірено всі вихідні `.ts`/`.tsx` файли в `backend-app` і `frontend-app`.
- Прибрано порожні модулі та старий синтаксично некоректний `components/main.tsx`.
- Backend-модулі тепер містять окрему відповідальність:
  - domain types і score calculation;
  - automation engine;
  - bot logger;
  - work-time bot і checker;
  - work-time aggregation;
  - request logger, audit middleware, JSON checker;
  - auth helpers;
  - user helpers;
  - admin roles, invitations та role changes.
- Додано frontend-модулі:
  - API v1/v2 clients;
  - workspace context;
  - contact form parser;
  - sales calculations;
  - settings model;
  - profile/social-link helpers;
  - change tracking hook;
  - auth validation;
  - customer/deal/task/worktime/admin/analytics/stats helpers.
- Backend API доповнено:
  - `/api/deals`;
  - `/api/tasks`;
  - `/api/signals`;
  - PostgreSQL tables for deals and tasks;
  - automatic bot evaluation every five minutes;
  - stale deal and overdue task signals.
- Додано шість backend unit tests.
- Перевірено:
  - frontend build — успішно;
  - frontend full lint — успішно;
  - backend build including all modules/tests — успішно;
  - backend tests: 6/6 passed;
  - empty source-file scan — порожніх source-файлів не залишилось.

  ## 2026-10-08 — повна синхронізація API

  - Frontend API client розширено методами `GET`, `POST`, `DELETE`.
  - Dashboard тепер при відкритті синхронізує:
    - contacts;
    - deals;
    - tasks.
  - Додано offline fallback, якщо API недоступне.
  - Створення і видалення контактів тепер спочатку працює через API, а потім оновлює UI.
  - Додані backend endpoints:
    - `POST/PATCH/DELETE /api/deals`;
    - `POST/PATCH/DELETE /api/tasks`.
  - Додана server-side Zod validation для deal/task payloads.
  - Автоматизації залишаються активними для stale deals і overdue tasks.
  - Повторна перевірка:
    - frontend build — успішно;
    - frontend lint — успішно;
    - backend build — успішно;
    - backend tests — 6/6;
    - empty source scan — порожніх `.ts`/`.tsx` не знайдено.

  ## 2026-10-08 — повний UI-flow

  - Додано `apiPatch` для оновлення ресурсів.
  - Вихід із workspace тепер викликає `POST /api/auth/logout`, а не лише очищує локальний прапорець.
  - Завершення/відновлення задачі синхронізується з `PATCH /api/tasks/:id`.
  - Додано повний розділ «Сигнали» у navigation:
    - завантаження `/api/signals`;
    - badge з кількістю сигналів;
    - пріоритетне відображення ризиків;
    - fallback із порожнім станом.
  - Кнопка «Нова угода» більше не є заглушкою:
    - відкриває форму;
    - створює угоду через `POST /api/deals`;
    - додає її у pipeline.
  - Кнопка «Нова задача» більше не є заглушкою:
    - відкриває форму;
    - відправляє deadline через `POST /api/tasks`;
    - одразу показує задачу у фокусі.
  - Smoke-test у браузері підтвердив:
    - dashboard відкривається;
    - offline fallback показує статус;
    - navigation «Угоди» і «Сигнали» працює.
  - Фінальна перевірка:
    - frontend build — успішно;
    - frontend lint — успішно;
    - backend build — успішно;
    - backend tests — 6/6 успішно;
    - у source-папках немає порожніх `.ts`/`.tsx` файлів.

## 2026-10-08 — нова ера landing та boundary-модулі

- Landing page отримав окрему “era” секцію з орбітальним ядром Adaptive, метриками та сильнішим продуктовым повідомленням.
- Додано анімовану атмосферу hero: орбіти, частинки, світіння, signal-марquee, shine-ефект кнопок і плавні entrance-анімації.
- Додано `prefers-reduced-motion`, щоб анімації коректно вимикались для користувачів із відповідною системною настройкою.
- Заповнено всі раніше порожні source-директорії boundary-модулями:
  - backend infrastructure, database, middleware API v1/v2;
  - analytics, automation, customers, deals, organizations, tasks, worktime;
  - logs;
  - frontend contexts і lib.
- Boundary-модулі містять типи, форматери, аналітичні розрахунки, константи маршрутів, оцінку здоров’я клієнта, робочого часу та пріоритетів.
- Перевірено:
  - frontend production build — успішно;
  - frontend full lint — успішно;
  - backend TypeScript build — успішно;
  - backend tests — 6/6 passed;
  - порожніх `.ts`/`.tsx` файлів не знайдено.
- Docker Compose не запускався локально, оскільки Docker CLI недоступний у поточному середовищі.

## 2026-10-08 — операційний центр замовлень та Adaptive Agents

- Додано вкладку «Замовлення» з демонстраційними замовленнями, сумою обороту, статусами та зміною статусу без перезавантаження.
- Дані замовлень зберігаються в `localStorage`, тому demo-flow працює навіть без API/PostgreSQL.
- Додано вкладку «Боти» з трьома агентами:
  - Pulse — радар клієнтів;
  - Flow — оператор замовлень;
  - Atlas — стратег продажів.
- Для кожного бота доступні:
  - окрема роль і опис;
  - online-статус;
  - стартове повідомлення;
  - чат із відповідями на повідомлення;
  - швидкі підказки;
  - кнопка запуску дії;
  - збереження історії чату в `localStorage`.
- Перевірено в браузері:
  - dashboard відкривається;
  - вкладка «Замовлення» показує 4 demo-замовлення;
  - статус замовлення можна змінити;
  - вкладка «Боти» показує агентів;
  - Pulse відповідає на швидку команду.
- Frontend build і lint успішні після змін.
