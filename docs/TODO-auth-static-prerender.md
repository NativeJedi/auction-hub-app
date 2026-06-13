# TODO: перевести `/crm/auth` на `[type]`-сегмент зі static prerender

**Статус:** заплановано (не критично — поточний варіант із `<Suspense>` робочий).
**Мета:** замінити query-параметр `?type` на route-сегмент, щоб Next статично пререндерив 3 варіанти форм (`login`, `register`, `confirm`) замість одного динамічного клієнтського рендеру.

## Контекст

Зараз `/crm/auth?type=login|register|confirm` — одна сторінка (`'use client'`), що читає `type` через `useSearchParams` і тому потребує `<Suspense>`. Параметр `type` має **скінченну відому множину** значень, тож його краще зробити сегментом маршруту й згенерувати кожен варіант статично (швидше, краще для SEO, без «спалаху» порожньої форми).

`pending` (email для екрана «check your inbox») — **справді динамічний** (будь-який email), тож **лишається query-параметром**, який читається в рантаймі на клієнті (під `<Suspense>`).

## План

1. **Новий маршрут** `app/crm/auth/[type]/page.tsx` (Server Component):
   - `generateStaticParams()` → `[{ type: 'login' }, { type: 'register' }, { type: 'confirm' }]`
   - `export const dynamicParams = false;` → невідомий тип віддає `notFound()` (404)
   - Рендерить `HeadedLayout` + `Card` + потрібну форму за `params.type`
   - `<view.Component />` обгорнути в `<Suspense>`, бо `CheckEmailForm` читає `?pending` (client, runtime)

2. **Зворотна сумісність** `app/crm/auth/page.tsx` → `redirect('/crm/auth/login')` (для bare `/crm/auth`, напр. редірект із middleware)

3. **Оновити внутрішні посилання/редіректи** (`?type=X` → `/crm/auth/X`; `pending` лишається query):

   | Файл | Рядок | Було | Стане |
   |---|---|---|---|
   | `LoginForm.tsx` | 28 | `/crm/auth?type=confirm&pending=` | `/crm/auth/confirm?pending=` |
   | `LoginForm.tsx` | 43 | `/crm/auth?type=register` | `/crm/auth/register` |
   | `RegisterForm.tsx` | 18 | `/crm/auth?type=confirm&pending=` | `/crm/auth/confirm?pending=` |
   | `RegisterForm.tsx` | 32 | `/crm/auth` | `/crm/auth/login` |
   | `LandingHeader.tsx` | 33 | `/crm/auth` | `/crm/auth/login` |
   | `LandingHeader.tsx` | 36 | `/crm/auth?type=register` | `/crm/auth/register` |
   | `Hero.tsx` | 34 | `/crm/auth?type=register` | `/crm/auth/register` |
   | `Hero.tsx` | 40 | `/crm/auth` | `/crm/auth/login` |
   | `ClosingCta.tsx` | 17 | `/crm/auth?type=register` | `/crm/auth/register` |
   | `ClosingCta.tsx` | 20 | `/crm/auth` | `/crm/auth/login` |
   | `LogoutButton.tsx` | 28 | `/crm/auth` | `/crm/auth/login` |
   | `confirm-email/page.tsx` | 26, 37 | `/crm/auth` | `/crm/auth/login` |
   | `error.tsx` | 18 | `redirect('/crm/auth')` | `/crm/auth/login` |
   | `error.tsx` | 37 | `<Link href="/crm/auth">` | `/crm/auth/login` |
   | `middleware.ts` | 25 | `new URL('/crm/auth', ...)` | `/crm/auth/login` |

   > `middleware.ts:18` використовує `path.includes('/crm/auth')` — `/crm/auth/*` залишиться публічним без змін.

4. **`CheckEmailForm`** лишається з `useQueryParam('pending')` під `<Suspense>`.

5. **Тест** `app/crm/auth/page.test.tsx` переписати під нову структуру:
   - рендерити конкретний `type`-варіант ([type]/page)
   - оновити очікувані redirect-URL на `/crm/auth/confirm?pending=...`

6. **Перевірка:**
   - `cd client && npx tsc --noEmit`
   - `npx vitest run` по зачеплених тестах
   - `npm run prod` — білд має пройти, 3 auth-сторінки стають **static** (без Suspense-обгортки на рівні сторінки)

## Зміни поведінки (звернути увагу)

- URL стають `/crm/auth/login | register | confirm` замість `?type=...`.
- **Невідомий тип тепер 404** (раніше невідомий `?type` падав у `login`). Якщо потрібно зберегти «невідоме → login» — замість `dynamicParams=false` зробити redirect невідомого типу на `/crm/auth/login`.
- Старий `/crm/auth` далі працює через redirect на `/crm/auth/login`.
