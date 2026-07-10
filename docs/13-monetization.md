# Freemium и монетизация MIRA

## 1. Принцип

Бесплатная версия должна самостоятельно решать основную задачу. Пользователь платит за глубину, экономию и дорогие AI-операции, а не за безопасность, друзей или искусственно сломанный базовый опыт.

Не монетизируются:

- публикация и remix;
- базовый feed/circle;
- privacy, block, report, moderation;
- базовый шкаф и ручное создание образа;
- экспорт и удаление данных;
- родительские safety controls.

## 2. Тарифы для price test

Цены — гипотеза для App Store experiment, не утверждённый прайс.

### Free — $0

- 1 профиль;
- до 80 активных вещей;
- 3 AI look generations в день;
- 3 вопроса стилисту в неделю;
- автоматический cutout с fair-use limit 20 вещей в месяц;
- Circle, публикации, remixes, challenges;
- базовые погода, laundry и wear tracking;
- wishlist без shopping optimizer.

### MIRA Plus — $4.99/month или $29.99/year

- wardrobe без продуктового лимита;
- unlimited outfit generation в fair-use;
- 100 AI stylist turns/month;
- 20 photorealistic try-ons/month;
- advanced swap: “сделай теплее/смелее/школьнее”;
- purchase check: сколько новых looks создаст вещь и какие дублирует;
- closet analytics, capsules, cost per wear;
- сохранённые seasonal lookbooks;
- premium profile/editor tools без boosts и pay-to-win ranking.

### MIRA Family — $49.99/year

- до 5 профилей и 3 взрослых;
- Plus-функции для семьи;
- laundry/hand-me-down workflow;
- рост и fit-check reminders без ложной точности;
- seasonal gap plan;
- private gift/wishlist links;
- adult-only budget and affiliate surface.

## 3. Почему за это будут платить

Главный paid moment — не paywall после установки. Он появляется после доказанной ценности:

1. AI уже собрал 5–7 пригодных образов;
2. пользователь пытается сделать controllable remix или try-on;
3. purchase check предотвращает одну лишнюю покупку;
4. семья хочет второй профиль или сезонный план.

Сообщение paywall:

> Одна предотвращённая ненужная покупка окупает год MIRA.

## 4. Дополнительная выручка

### Affiliate commerce

- только после organic wardrobe gap;
- цены и purchase links — 16+ или adult surface;
- Sponsored всегда маркируется;
- бренд не может купить место в AI ranking;
- никакой передачи child profile/behavior data retailer;
- physical goods оплачиваются вне IAP, как разрешают правила Apple для goods/services outside the app: [App Review Guidelines 3.1.3(e)](https://developer.apple.com/app-store/review/guidelines/).

### Creator drops

Платные digital lookbooks, challenge packs и редакторские фильтры возможны позже и приобретаются через IAP. Доля creator — отдельная marketplace-модель после moderation/legal gate.

### B2B

- anonymized aggregate fit/gap intelligence только при достаточной выборке и без child profiling;
- white-label wardrobe SDK для retailers;
- school/uniform planning — отдельный enterprise продукт.

## 5. Чего не будет

- third-party behavioral ads для minors;
- продажи данных;
- paid boosts детских постов;
- loot boxes;
- “накопи stars, чтобы получить обещанный родителем подарок” как pressure loop;
- streak loss, искусственные таймеры и guilt copy;
- paywall для блокировки, жалобы или удаления аккаунта.

## 6. App Store billing

Цифровые функции и подписка разблокируются через In-App Purchase; Apple требует IAP для feature unlock и ongoing value для auto-renewable subscription: [App Review Guidelines 3.1](https://developer.apple.com/app-store/review/guidelines/). Нужны:

- StoreKit products `mira_plus_monthly`, `mira_plus_yearly`, `mira_family_yearly`;
- restore purchases;
- App Store Server Notifications;
- server entitlement table;
- grace period, billing retry, refund/revoke handling;
- Family Sharing decision;
- StoreKit local tests, sandbox и TestFlight validation: [Apple In-App Purchase](https://developer.apple.com/in-app-purchase/).

Текущий репозиторий содержит paywall и entitlement data model. Реальный checkout блокируется созданием Apple Developer/App Store Connect products и signing credentials.

## 7. Unit economics guardrails

- LLM не вызывается для combinatorial ranking;
- garment анализируется один раз;
- cutout кэшируется;
- style explanations используют шаблоны на normal path;
- generated try-on имеет отдельный quota;
- бесплатный moderation endpoint используется на всём UGC;
- target contribution margin Plus ≥75%;
- target annual plan mix ≥65% paid users;
- refund rate <5%, involuntary churn отслеживается отдельно.
