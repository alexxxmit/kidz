# Roadmap, метрики и бизнес-модель

## 1. North Star

Successful Dressing Days per Weekly Active Household.

День считается успешным, если взрослый:

1. увидел рекомендацию;
2. принял вариант напрямую или после не более одного swap;
3. подтвердил, что ребёнок надел комплект;
4. не отправил thermal/safety complaint.

Почему не screen time: хороший продукт экономит родителю время. Почему не количество оцифрованных вещей: inventory — средство, а не ценность.

## 2. Funnel

- Acquisition: landing/store → install;
- Activation: профиль + 8 вещей + первый образ;
- Habit: минимум 3 recommendation views в неделю;
- Value: successful dressing day;
- Retention: active at week 4/week 8;
- Expansion: второй взрослый/ребёнок, growth и seasonal insights;
- Revenue: trial → paid household.

## 3. Pilot targets

Это go/no-go гипотезы для 30–50 семей, а не обещанные KPI:

| Метрика | Цель пилота |
| --- | ---: |
| Создали первый образ в день регистрации | ≥ 60% started onboarding |
| Медиана времени до первого образа | ≤ 5 минут |
| Добавили ≥ 10 вещей | ≥ 50% activated households |
| Week-4 retained | ≥ 40% activated households |
| Утренние открытия | ≥ 3 в неделю у retained |
| Direct accept | ≥ 35% viewed recommendations |
| Accept after ≤ 1 swap | ≥ 60% viewed recommendations |
| Too hot/too cold feedback | < 5% worn outfits после калибровки |
| Ошибка unavailable/outgrown item | < 1% options online и 0 в test suite |
| AI item confirmation без правок core fields | ≥ 80% |
| Второй взрослый приглашён | ≥ 20% multi-caregiver households |

Если retention низкий при высокой точности — проблема в частоте/ценности. Если usage высокий, но много swaps — проблема в рекомендации. Если не доходим до первого образа — проблема onboarding, и дальнейший AI не спасёт продукт.

## 4. Roadmap

### Phase 0 — Discovery, 2–3 недели

- 20–25 problem interviews;
- competitor mystery shopping;
- clickable prototype утреннего сценария;
- concierge test с 5 семьями;
- выбор первой страны и юридический scoping;
- garment taxonomy v0;
- success/failure thresholds.

Exit: минимум 10 семей демонстрируют повторяющуюся проблему и готовы предоставить 8–12 garment photos для пилота.

### Phase 1 — Technical vertical slice, 3 недели

- monorepo, CI, environments;
- adult auth + household/child;
- secure image upload и manual garment;
- one vision provider behind interface;
- weather adapter;
- deterministic outfit from seeded wardrobe;
- audit/observability baseline.

Exit: один реальный пользователь проходит capture → recommendation → accept → wear в staging.

### Phase 2 — Closed alpha MVP, 5–7 недель

- progressive onboarding/batch capture;
- wardrobe states;
- three recommendations + swap + feedback;
- manual activities;
- wear/laundry loop;
- push notifications;
- family invites;
- export/delete;
- first-party analytics;
- scenario/evaluation suites.

Exit: 10 internal/alpha families use product 14 days; no critical privacy/safety defect.

### Phase 3 — 4-week pilot

- 30–50 families;
- weekly qualitative interviews;
- manual review of anonymized failures with explicit participant consent;
- ranking/comfort calibration;
- willingness-to-pay experiment;
- onboarding and notification A/B tests without dark patterns.

Exit: pilot reaches agreed retention/value gates или команда принимает explicit pivot/stop decision.

### Phase 4 — Beta, 6–8 недель

- seasonal gaps;
- fit-check reminders и low-confidence window experiment;
- storage/hand-me-downs;
- subscription;
- multi-region/legal hardening;
- accessibility/localization;
- penetration test;
- app store launch.

### Phase 5 — Family ecosystem

Последовательность зависит от данных, но предпочтительный порядок:

1. private wishlist/gift links;
2. evidence-based shopping gaps;
3. brand size intelligence;
4. child mode после compliance gate;
5. tasks/stars/goals после wellbeing testing;
6. commerce partnerships;
7. Adult surface только при отдельном positioning test.

## 5. Команда MVP

Минимально реалистично:

- product founder/PM — discovery, priorities, partners;
- product designer 0.5–1 FTE — mobile flows, research, accessibility;
- senior mobile/full-stack engineer — Expo и client architecture;
- senior backend/full-stack engineer — API/data/infra;
- ML/vision engineer 0.5 FTE — benchmark, evaluation, pipeline;
- QA automation 0.5 FTE с Phase 2;
- privacy/security/legal consultants на gates.

Один сильный full-stack founder может собрать concierge/vertical slice, но production child-data product в одиночку несёт слишком большой security и QA risk.

## 6. Pricing hypothesis

Публичные конкуренты показывают нижний ценовой якорь примерно от $4.99 one-time у Little Nook до $19.99–29.99 в год у Outgrow/Tonee-подобных wardrobe apps на момент исследования. Kidz должен брать деньги за повторяющуюся экономию времени, а не за количество AI-вызовов.

Стартовая гипотеза для теста:

### Free

- 1 ребёнок;
- до 25–30 активных вещей;
- ограниченное число AI scans;
- daily outfit и базовая погода;
- ручные состояния.

### Family Plus — тест $3.99/месяц или $29.99/год

- несколько детей и взрослых;
- unlimited wardrobe/scans в fair-use;
- schedule, laundry automation, seasonal gaps;
- fit reminders, hand-me-downs, analytics;
- private wishlist/gift links.

Цену проверять paid smoke test/offer, а не вопросом «сколько бы вы заплатили». Региональные цены и store fees считаются отдельно.

## 7. Commerce model

Порядок монетизации:

1. подписка семьи — основной и самый чистый сигнал ценности;
2. affiliate revenue только на adult shopping surface;
3. retailer integrations/lead fee;
4. B2B fit/wardrobe intelligence — отдельная гипотеза.

Правила доверия:

- рекомендации из собственного гардероба никогда не требуют покупки;
- gap существует до обращения к каталогу;
- sponsored offer не меняет факт/приоритет gap;
- цена не показывается в future child surface;
- offer виден только взрослому и явно маркирован;
- можно использовать приложение без commerce consent;
- никакой продажи child profile/behavior data магазинам.

## 8. Unit economics model

До pilot считаем на одну активную семью в месяц:

Revenue:

- net subscription revenue после store fee/tax;
- affiliate contribution margin отдельно.

Variable cost:

- vision analysis × new items;
- background removal/OCR;
- weather calls после shared caching;
- image storage/CDN;
- push/email;
- support minutes;
- payment/store fees.

Целевые инженерные ограничения:

- recommendation не вызывает LLM каждый раз;
- one garment image анализируется один раз и переиспользуется;
- weather cache shared by grid/time;
- explanation templates покрывают normal path;
- freemium scan limit защищает cost;
- gross margin subscription target ≥ 75% после beta.

## 9. Основные риски и ответы

| Риск | Ранний индикатор | Ответ |
| --- | --- | --- |
| Слишком тяжёлый onboarding | <50% доходят до 8 вещей | Progressive capture, batch scan, concierge import |
| Рекомендации не лучше шкафа | Низкий accept, много swaps | Hard scenarios, preference feedback, narrower promise |
| Статусы быстро устаревают | Частые unavailable reports | One-tap corrections, household sync, optional reminders |
| Погода подрывает доверие | Thermal complaints | Time-window forecast, conservative gates, stale warning |
| Fit prediction переобещает | Ранние false alerts | Только interval/confidence и fit-check reminder |
| AI cost съедает ARPU | Высокая cost/item | Smaller models, batching, caching, manual fallback |
| Детский режим блокирует stores/legal | Review issues | Parent-only MVP, separate compliance gate |
| Commerce разрушает доверие | Dismissals/churn after offers | Separate organic score, labelled adult-only surface |
| Конкурент копирует features | Feature parity | Daily data loop, fit graph, trust and distribution |
| Рынок слишком узок | Low acquisition/WTP | B2B fit or adult surface only after evidence |

## 10. Решения, которые нужно принять до кода production MVP

1. Первая страна/регион и язык.
2. App Store category и заявленный target audience.
3. Название/домен/trademark.
4. Политика хранения sanitized garment images.
5. Vision provider и contractual data terms.
6. Weather provider/attribution.
7. Fit reminder scope в MVP или P1.
8. Subscription entitlement/free limit.
9. Consent model и юридический owner child data.
10. Pilot recruitment channel.

## 11. Следующий практический deliverable

После foundation-пакета не следует сразу строить все девять модулей. Следующий инкремент:

- 5 ключевых мобильных flows в Figma;
- garment/activity taxonomy v0 в versioned JSON;
- 100 scenario tests для outfit engine;
- monorepo skeleton;
- one vertical slice: добавить футболку → получить weather-aware outfit → подтвердить носку.

Этот slice проверяет самые рискованные границы системы и создаёт основу для concierge pilot без преждевременного marketplace, rewards и virtual try-on.
