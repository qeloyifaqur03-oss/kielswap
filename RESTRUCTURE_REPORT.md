# Отчёт о реструктуризации монорепозитория

## Выполненные изменения

### 1. Структура проектов

#### `/landing` - отдельный Next.js проект
- Страницы: `/(landing)/page.tsx`, `/request`, `/about`, `/contact`, `/faq`, `/roadmap`, `/security`
- API: `/api/early-access` (landing-only)
- Компоненты: `landing/components/` (landing-specific)
- Порт: 3000
- Package: `kielswap-landing`

#### `/app` - отдельный Next.js проект
- Страницы: `/(app)/access`, `/swap`, `/history`, `/feedback`, `/badges`, `/referral`, `/track/[id]`
- API: `/api/access/*`, `/api/feedback`, `/api/quote`, `/api/chains`, `/api/token-price`, `/api/execute`, `/api/status`, `/api/route-plan`, `/api/execution/status`
- Компоненты: `app/components/` (app-specific)
- Middleware: `app/middleware.ts` (access control)
- Порт: 3001
- Package: `kielswap-app`

#### `/docs` - Mintlify проект
- Порт: 3002
- Package: `kielswap-docs`

#### `/packages/lib` - общий код
- `lib/redis.ts` - Redis client
- `lib/access.ts` - access code hashing
- `lib/tokens.ts` - token registry
- `lib/chainRegistry.ts` - chain registry
- `lib/providers/` - swap providers
- `lib/telegram.ts`, `lib/telegramMessages.ts` - Telegram notifications
- `lib/rateLimit.ts` - rate limiting
- `lib/animations.ts` - animation configs
- `lib/utils.ts` - utilities (cn)
- `lib/wagmi/config.ts` - wagmi config
- И другие shared utilities

#### `/packages/ui` - общие UI компоненты
- `ui/button.tsx`, `ui/input.tsx`, `ui/textarea.tsx`
- `ui/popover.tsx`, `ui/command.tsx`, `ui/scroll-area.tsx`
- `ui/accordion.tsx`, `ui/tooltip.tsx`
- И другие общие UI компоненты

### 2. Перенесённые файлы

#### App страницы:
- `app/app/(app)/access/page.tsx` - страница ввода кода доступа
- `app/app/(app)/swap/page.tsx` - страница свопа
- `app/app/(app)/history/page.tsx` - история свопов
- `app/app/(app)/feedback/page.tsx` - обратная связь
- `app/app/(app)/badges/page.tsx` - значки
- `app/app/(app)/referral/page.tsx` - реферальная программа
- `app/app/(app)/track/[id]/page.tsx` - отслеживание свопа

#### App API routes:
- `app/app/api/access/verify/route.ts` - верификация кода доступа
- `app/app/api/access/check/route.ts` - проверка доступа
- `app/app/api/access/logout/route.ts` - выход
- `app/app/api/feedback/route.ts` - отправка обратной связи
- `app/app/api/quote/route.ts` - получение котировок
- `app/app/api/chains/route.ts` - список сетей
- `app/app/api/token-price/route.ts` - цены токенов
- `app/app/api/execute/route.ts` - выполнение свопа
- `app/app/api/status/route.ts` - статус транзакции
- `app/app/api/route-plan/route.ts` - планирование маршрута
- `app/app/api/execution/status/route.ts` - статус выполнения

#### Landing API routes:
- `landing/app/api/early-access/route.ts` - запрос раннего доступа

#### Компоненты:
- `app/components/Background.tsx`, `Providers.tsx`, `ErrorBoundary.tsx`
- `app/components/swap/TokenSelect.tsx`, `NetworkSelect.tsx`, `RouteDetails.tsx`, `WalletModal.tsx`
- `app/components/ui/*` - все UI компоненты
- `app/components/TokenIcon.tsx`, `NewYearAnimation.tsx`

### 3. Удалённые файлы и папки

- `app-separate/` - временная папка с конфигами (удалена)
- `app/(landing)/` - дубликат landing страниц из root (удалена)
- `app/access/` - дубликат access страницы (удалена)
- `app/swap/` - дубликат swap страницы (удалена)
- `app/api/early-access/` - перенесено в landing (удалена из app)
- `middleware.ts` (root) - удалён, middleware теперь в `/app/middleware.ts`
- `next.config.js` (root) - удалён, каждый проект имеет свой

### 4. Исправленные импорты

Все импорты обновлены:
- `@/lib/*` → `@/lib/lib/*` в app проекте
- `@/components/*` - остаётся как есть (проект-специфичные компоненты)
- `@/lib/*` в landing проекте использует wrappers в `landing/lib/` которые реэкспортируют из `packages/lib/lib/`

### 5. Настроенные алиасы (tsconfig)

#### `/app/tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["./*"],
    "@/components/*": ["./components/*"],
    "@/lib/*": ["../../packages/lib/lib/*"],
    "@/ui/*": ["../../packages/ui/ui/*"]
  },
  "baseUrl": "."
}
```

#### `/landing/tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["./*"],
    "@/lib/*": ["../../packages/lib/lib/*"]
  },
  "baseUrl": "."
}
```

### 6. Workspace настройки

#### Root `package.json`:
- Workspaces: `landing`, `app`, `docs`, `packages/*`
- Команды:
  - `pnpm dev` - запустить все проекты (concurrently)
  - `pnpm dev:landing` - только landing (порт 3000)
  - `pnpm dev:app` - только app (порт 3001)
  - `pnpm dev:docs` - только docs (порт 3002)

#### Ports:
- Landing: 3000
- App: 3001
- Docs: 3002

### 7. Middleware (app)

`app/middleware.ts`:
- Защищает маршруты: `/swap`, `/history`, `/feedback`, `/badges`, `/referral`, `/track`
- Публичные маршруты: `/access`
- Редирект с `/access` на `/swap` если есть доступ
- Редирект на `/access` если нет доступа для защищённых маршрутов

### 8. Ссылки между проектами

В `/app/app/(app)/access/page.tsx`:
- Ссылка "Request access" ведёт на `process.env.NEXT_PUBLIC_LANDING_URL || 'https://kielswap.xyz/request'`
- Открывается в новой вкладке (`target="_blank"`)

## Команды для запуска

### Из корня репозитория:

```bash
# Запустить все проекты одновременно
pnpm dev

# Запустить отдельно
pnpm dev:landing  # http://localhost:3000
pnpm dev:app      # http://localhost:3001
pnpm dev:docs     # http://localhost:3002

# Сборка
pnpm build:landing
pnpm build:app
pnpm build:docs

# Линтинг
pnpm lint
```

### Из папки проекта:

```bash
# Landing
cd landing
pnpm dev

# App
cd app
pnpm dev

# Docs
cd docs
pnpm dev
```

## Environment Variables

### `/app` проект (обязательные):
```env
# Redis (для access codes)
UPSTASH_REDIS_REST_URL=...
UPSTASH_REDIS_REST_TOKEN=...

# Access codes secret (для hashing)
ACCESS_SECRET=...

# Landing URL (для ссылки "Request access" на странице /access)
NEXT_PUBLIC_LANDING_URL=https://kielswap.xyz

# Telegram (опционально, для feedback/early-access)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### `/landing` проект:
```env
# Landing URL (опционально, если нужен для внутренних ссылок)
NEXT_PUBLIC_LANDING_URL=https://kielswap.xyz

# Telegram (для early-access)
TELEGRAM_BOT_TOKEN=...
TELEGRAM_CHAT_ID=...
```

### `/docs` проект:
```env
# Не требуются (Mintlify)
```

## Исправленные ошибки импортов

### App проект:
- Все импорты `@/lib/lib/*` → `@/lib/*` (исправлено)
- Все API routes используют правильные пути
- Все компоненты используют правильные пути
- tsconfig настроен: `@/lib/*` → `../../packages/lib/lib/*`

### Landing проект:
- Созданы wrappers в `landing/lib/` для всех shared модулей:
  - `lib/quoteFairness.ts` → реэкспорт из packages
  - `lib/utils.ts` → реэкспорт из packages
  - `lib/animations.ts` → реэкспорт из packages
  - `lib/tokens.ts` → реэкспорт из packages
  - `lib/telegram.ts` → реэкспорт из packages
  - `lib/telegramMessages.ts` → реэкспорт из packages
  - `lib/rateLimit.ts` → реэкспорт из packages
  - `lib/wagmi/config.ts` → реэкспорт из packages
- tsconfig настроен: `@/*` → `./*` (использует локальные wrappers)
- Добавлены зависимости: `wagmi`, `@tanstack/react-query`, `viem`, `@wagmi/core`

### Docs проект:
- Favicon скопирован из landing/public в docs/public

## Проверка работы

### Landing:
1. `http://localhost:3000` - главная страница
2. `http://localhost:3000/request` - запрос раннего доступа
3. `http://localhost:3000/about`, `/contact`, `/faq`, `/roadmap`, `/security` - работают

### App:
1. `http://localhost:3001/access` - страница ввода кода доступа (публичная)
2. `http://localhost:3001/swap` - редирект на `/access` если нет доступа
3. После ввода правильного кода - редирект на `/swap?mode=intent`
4. `/api/access/verify` - POST запрос с `{ code: "..." }` возвращает `{ ok: true }` и устанавливает cookie `ks_access=1`
5. `/api/access/check` - GET запрос проверяет наличие cookie, возвращает `{ hasAccess: true/false }`
6. `/api/chains` - GET запрос возвращает список сетей
7. `/api/token-price` - GET запрос с `?ids=eth,usdt` возвращает цены

## Важные замечания

1. **Root больше не содержит Next.js приложения** - все проекты независимы
2. **Shared код в `/packages`** - общие утилиты и UI компоненты
3. **Импорты через алиасы** - все проекты используют `@/lib/*`, `@/components/*`
4. **Middleware только в app** - landing не имеет middleware
5. **Access control только в app** - landing не защищён, app защищён через middleware
6. **API разделены** - landing API в `/landing/app/api`, app API в `/app/app/api`
7. **Ссылки между проектами** - через `NEXT_PUBLIC_LANDING_URL` или абсолютные URL

## Следующие шаги (опционально)

1. Настроить CI/CD для каждого проекта отдельно
2. Настроить деплой landing и app на разные домены
3. Добавить shared types в `/packages/types` если нужно
4. Настроить shared styles в `/packages/styles` если нужно
5. Добавить тесты для каждого проекта
