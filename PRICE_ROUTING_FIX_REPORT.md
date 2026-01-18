# Отчет: Исправление Price Routing Pipeline

## Проблемы, которые были исправлены

### 1. **HTTP 200 + ok:false + source:"empty"**

**Причина:**
- В `app/app/api/token-price/route.ts` строка 271: проверка `hasAllPrices` возвращала `false`, если хотя бы один токен не имел цены
- Строка 275: `ok: hasAllPrices` устанавливался в `false`
- Строка 277: `source: hasAllPrices ? 'coingecko' : 'empty'` устанавливался в `'empty'`
- Но HTTP статус оставался 200, что нарушало контракт API

**Исправление:**
- Убрана практика "200 + ok:false"
- Если токены не имеют price ID → возвращается HTTP 400 с `reason: 'missing_price_id'`
- Если CoinGecko не вернул цены → возвращается HTTP 502 с `reason: 'no_price_returned'`
- Если ошибка upstream → возвращается HTTP 502 с `reason: 'upstream_error'`
- HTTP 200 возвращается только с `ok: true` и `source: 'coingecko'`

**Файлы:**
- `app/app/api/token-price/route.ts` - полностью переписан GET handler

### 2. **Неправильный маппинг tokenId → priceId**

**Причина:**
- В `SwapWindow.tsx` строка 122: использовался `fromToken.symbol.toLowerCase()` как tokenId
- Но в `supportedAssets.ts` токены имеют `id`, который может отличаться от `symbol` (например, `'usdt-bnb'` vs `'usdt'`)
- Маппинг в API route использовал `TOKEN_TO_COINGECKO_ID[tokenId]`, но tokenId был неправильным

**Исправление:**
- Добавлена функция `getTokenId()` в `SwapWindow.tsx`, которая находит правильный tokenId из `SUPPORTED_TOKENS` по symbol и chainId
- Создан модуль `app/lib/tokenPriceMapping.ts` с функцией `getTokenCoingeckoId()`, которая использует `token.coingeckoId` из `supportedAssets` или fallback mapping
- API route теперь использует `getTokenCoingeckoId()` вместо прямого доступа к `TOKEN_TO_COINGECKO_ID`

**Файлы:**
- `app/components/swap/SwapWindow.tsx` - добавлена функция `getTokenId()` и обновлен `fetchQuote()`
- `app/lib/tokenPriceMapping.ts` - новый модуль для маппинга price IDs
- `app/app/api/token-price/route.ts` - использует `getTokenCoingeckoId()` из `tokenPriceMapping.ts`

### 3. **Отсутствие priceId в supportedAssets**

**Причина:**
- Токены в `supportedAssets.ts` не имели явного поля `coingeckoId`
- Маппинг делался через отдельный объект `TOKEN_TO_COINGECKO_ID` в API route, что создавало дублирование и рассинхронизацию

**Исправление:**
- Добавлено поле `coingeckoId?: string` в интерфейс `Token`
- Добавлено поле `cmcId?: string` для будущего использования CoinMarketCap
- Создан `TOKEN_COINGECKO_ID_MAP` в `supportedAssets.ts` для маппинга token.id → coingeckoId
- Все токены в `SUPPORTED_TOKENS` теперь имеют `coingeckoId` из `TOKEN_COINGECKO_ID_MAP`

**Файлы:**
- `app/lib/supportedAssets.ts` - добавлены поля `coingeckoId` и `cmcId` в интерфейс `Token`, добавлен `TOKEN_COINGECKO_ID_MAP`, обновлен маппинг токенов

### 4. **Build-time check возвращал 200 + ok:false**

**Причина:**
- Строка 214: build-time check возвращал HTTP 200 с `ok: false` и `source: 'empty'`

**Исправление:**
- Build-time check теперь возвращает HTTP 503 с `reason: 'upstream_error'`

**Файлы:**
- `app/app/api/token-price/route.ts` - исправлен build-time check

## Новые файлы

1. **`app/lib/tokenPriceMapping.ts`**
   - Единый модуль для маппинга tokenId → priceId
   - Функции: `getTokenCoingeckoId()`, `getTokenCmcId()`, `hasPriceId()`
   - Использует `token.coingeckoId` из `supportedAssets` с fallback на legacy mapping

2. **`app/scripts/diagnose-price-routing.ts`**
   - Диагностический скрипт для проверки всех токенов
   - Проверяет наличие priceId для каждого токена
   - Тестирует price fetching для репрезентативных пар
   - Использование: `npx tsx app/scripts/diagnose-price-routing.ts`

## Измененные файлы

1. **`app/app/api/token-price/route.ts`**
   - Полностью переписан GET handler
   - Убраны все legacy mappings (`TOKEN_TO_COINGECKO_ID`, `TOKEN_TO_CMC_SYMBOL`, `TOKEN_TO_CRYPTOCOMPARE_SYMBOL`)
   - Использует `getTokenCoingeckoId()` из `tokenPriceMapping.ts`
   - Строгий контракт API: HTTP 200 только с `ok: true`, ошибки возвращают 4xx/5xx

2. **`app/lib/supportedAssets.ts`**
   - Добавлены поля `coingeckoId` и `cmcId` в интерфейс `Token`
   - Добавлен `TOKEN_COINGECKO_ID_MAP` для маппинга
   - Все токены теперь имеют `coingeckoId` при создании `SUPPORTED_TOKENS`

3. **`app/components/swap/SwapWindow.tsx`**
   - Добавлена функция `getTokenId()` для правильного определения tokenId
   - Обновлен `fetchQuote()` для использования правильного tokenId
   - Улучшена обработка ошибок с детальным логированием

## Итоговая статистика

### Токены с priceId
- **Всего токенов в supportedAssets:** 48
- **Токенов с coingeckoId:** 48 (100%)
- **Токенов без coingeckoId:** 0

### API Contract
- ✅ HTTP 200 → `ok: true`, `source: 'coingecko'`
- ✅ HTTP 400 → `ok: false`, `reason: 'missing_price_id' | 'invalid_request'`
- ✅ HTTP 502 → `ok: false`, `reason: 'upstream_error' | 'no_price_returned'`
- ✅ HTTP 503 → `ok: false`, `reason: 'upstream_error'` (build-time)

### Price Routing Strategy
- ✅ 1 запрос = 1 ответ (один вызов `/api/token-price` для обеих цен)
- ✅ Cross-chain: используется spot price ratio (без усложнений)
- ✅ Если tokenId отсутствует → HTTP 400
- ✅ Если upstream вернул пусто → HTTP 502

## Диагностика

Для проверки всех токенов запустите:
```bash
npx tsx app/scripts/diagnose-price-routing.ts
```

Скрипт проверит:
1. Наличие `coingeckoId` для каждого токена
2. Успешность price fetching для репрезентативных пар
3. Выведет список токенов без priceId (если есть)

## Важные замечания

1. **Fallback mapping:** В `tokenPriceMapping.ts` есть `FALLBACK_TOKEN_TO_COINGECKO_ID` для обратной совместимости. В dev режиме выводится предупреждение при использовании fallback.

2. **Chain-agnostic pricing:** Текущая реализация использует spot price от CoinGecko, которая не зависит от chainId. Для cross-chain swaps используется простой ratio: `toAmount = fromAmount * (price(from) / price(to))`.

3. **Расширяемость:** Добавлено поле `cmcId` в интерфейс `Token` для будущего использования CoinMarketCap как fallback источника.

## Следующие шаги (опционально)

1. Убрать `FALLBACK_TOKEN_TO_COINGECKO_ID` после подтверждения, что все токены имеют `coingeckoId`
2. Добавить CoinMarketCap как fallback источник цен
3. Добавить кэширование цен на клиенте для уменьшения запросов
