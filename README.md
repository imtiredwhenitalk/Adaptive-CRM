# Adaptive CRM

Adaptive CRM — адаптивна система для керування клієнтами, продажами, задачами та командами. Проєкт створений як інноваційна SaaS-платформа для демонстрації на презентаціях і подальшого розвитку до production-рішення.

## Можливості

- dashboard з доходом, pipeline, задачами та Adaptive Signals;
- контакти, угоди, замовлення, задачі, аналітика та автоматизації;
- тарифи:
  - **Старт** — `$50/міс.`;
  - **Команда** — `$100/міс.`;
  - **Про** — `$200/міс.`;
- onboarding нового CRM-простору;
- ієрархія команди: власник, керівник, менеджер, спеціаліст;
- розділ **Команда та права**:
  - додавання учасників;
  - призначення ролей;
  - підвищення прав;
  - окремі дозволи для контактів, угод, задач, замовлень, аналітики, ботів і сигналів;
- OAuth2-вхід через Google Workspace або Microsoft Entra ID;
- обмеження входу корпоративними доменами;
- PostgreSQL, httpOnly sessions та Docker Compose для серверного запуску.

## Структура

```text
Adaptive-CRM/
├── frontend-app/     React + TypeScript + Vite
├── backend-app/      Node.js + Express + TypeScript
├── database/         PostgreSQL initialization
├── Dockerfile         frontend production image
├── docker-compose.yml frontend, API та PostgreSQL
└── README.md
```

## Локальний frontend

```powershell
cd frontend-app
npm ci
npm run dev
```

Відкрити: <http://localhost:5173/>

Для перевірки frontend:

```powershell
npm run build
npm run lint
```

Якщо backend не запущений, frontend використовує локальний demo/offline режим. Дані демо-простору зберігаються у `localStorage`.

## Backend і тести

```powershell
cd backend-app
npm ci
npm run build
npm test
```

API за замовчуванням працює на порту `4000`.

## Запуск через Docker

Потрібен встановлений Docker Desktop:

```powershell
docker compose up --build
```

Адреси:

- frontend: <http://localhost:8080/>
- API health-check: <http://localhost:4000/health>

Зупинка:

```powershell
docker compose down
```

## OAuth2 і корпоративний вхід

Парольний вхід вимкнений. Дозволені лише адреси з корпоративних доменів, заданих у `ALLOWED_EMAIL_DOMAINS`.

Підтримуються:

- Google Workspace;
- Microsoft Entra ID / Microsoft 365.

Створіть OAuth applications у відповідних консолях і додайте callback URL:

```text
http://localhost:4000/api/auth/oauth/google/callback
http://localhost:4000/api/auth/oauth/microsoft/callback
```

Не зберігайте секрети в Git. Для локального запуску створіть `.env` або передайте змінні середовища:

```env
ALLOWED_EMAIL_DOMAINS=company.com
PASSWORD_LOGIN_ENABLED=false

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4000/api/auth/oauth/google/callback

MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:4000/api/auth/oauth/microsoft/callback
```

Кілька доменів можна вказати через кому:

```env
ALLOWED_EMAIL_DOMAINS=company.com,company.ua
```

`gmail.com`, `outlook.com`, `yahoo.com` та інші особисті поштові домени не проходять перевірку. Для Google Workspace рекомендується налаштувати корпоративний consent screen, а в Microsoft Entra — Web redirect URI.

## Demo-сценарій для презентації

1. Відкрити landing page.
2. Показати анімований hero-блок і тарифні плани.
3. Натиснути **Створити простір**.
4. Увійти через корпоративний Google Workspace або Microsoft 365.
5. Вибрати тариф та ієрархію.
6. У dashboard відкрити **Команда**.
7. Додати учасника.
8. Змінити його роль.
9. Увімкнути або вимкнути окремі права.
10. Показати контакти, pipeline, сигнали та аналітику.

## Якість

Перед демонстрацією рекомендується виконати:

```powershell
cd frontend-app
npm run build
npm run lint

cd ..\backend-app
npm test
```

Поточна перевірка включає frontend build/lint і backend unit tests. Реальні OAuth-провайдери потребують власних client ID, client secret та налаштованих redirect URI.

## Подальший production-план

- перенести команду, ролі та permissions із demo `localStorage` у PostgreSQL;
- додати серверну перевірку permissions для кожного CRM API endpoint;
- додати email-запрошення учасників;
- підключити платіжну систему для тарифів;
- додати audit log для зміни ролей і прав;
- налаштувати CI/CD та production HTTPS.
