# Техническая архитектура и стек

## 1. Архитектурное решение

MVP строится как mobile-first modular monolith с отдельными асинхронными workers для vision/OCR, уведомлений и периодических расчётов.

Почему не микросервисы:

- доменные границы ещё будут меняться после пилота;
- транзакции гардероб → образ → носка проще и надёжнее внутри одной базы;
- маленькая команда быстрее отлаживает единый deployable;
- изоляция модулей и outbox оставляют путь к выделению сервисов позже.

Микросервис выделяется только при одном из условий: независимое масштабирование, отдельный security boundary, другой runtime или команда-владелец.

## 2. Рекомендуемый стек

| Слой | Выбор | Обоснование |
| --- | --- | --- |
| Mobile | React Native + Expo + TypeScript + Expo Router | Одна codebase для iOS/Android, хороший camera/push/build workflow, быстрый pilot |
| Data fetching | TanStack Query | Cache, retries, offline reads, predictable server state |
| Forms/contracts | React Hook Form + Zod | Общие схемы валидации и типы API |
| Local state | Zustand только для UI state | Не дублировать server state в глобальном store |
| API | Node.js + TypeScript + NestJS с Fastify adapter | Модульность, OpenAPI, DI, быстрый HTTP runtime |
| Domain engine | Pure TypeScript package | Детерминированные правила, property tests, общий код без framework dependency |
| Database | PostgreSQL | Транзакции, JSONB, полнотекстовый поиск, mature ecosystem |
| SQL layer | Drizzle ORM + SQL migrations | Type safety и прозрачный SQL/RLS без тяжёлой runtime-магии |
| Object storage | S3-compatible private buckets | Signed upload/download, lifecycle policies, региональная переносимость |
| Async | Transactional outbox + SQS-compatible queue | Надёжная доставка без dual-write между DB и queue |
| AI worker | Python + FastAPI worker process | Экосистема vision/OCR и независимое масштабирование |
| Recommendation | TypeScript rule/constraint engine; ML reranker позже | Объяснимость и безопасность с первого дня |
| Back office | Next.js + TypeScript | Support, taxonomy, feature/config management; только для сотрудников |
| Observability | OpenTelemetry + provider logs/metrics/traces | Vendor-neutral instrumentation с PII scrubbing |
| Infrastructure | Docker + Terraform + GitHub Actions | Повторяемые окружения и переносимость региона |
| Mobile delivery | EAS Build/Submit + native store pipelines | Управляемые подписи и cross-platform release workflow |

Expo официально поддерживает camera/image picker и push-механизмы: [ImagePicker](https://docs.expo.dev/versions/latest/sdk/imagepicker/), [Camera](https://docs.expo.dev/versions/latest/sdk/camera/), [Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/).

## 3. Monorepo

Рекомендуемая структура:

    apps/
      mobile/          React Native / Expo
      api/             NestJS modular monolith
      admin/           internal Next.js
    services/
      vision-worker/   Python image/OCR pipeline
    packages/
      contracts/       OpenAPI-derived types + Zod schemas
      domain/          entities, policies, recommendation engine
      taxonomy/        versioned garment/activity taxonomy
      ui/              shared design tokens/components
      config/          lint, tsconfig, test presets
    infra/
      terraform/
      docker/
    docs/

Package manager: pnpm workspaces. Build orchestration: Turborepo. Versioning приложений и API независимое, но contracts проходят compatibility check в CI.

## 4. Логическая схема

~~~mermaid
flowchart LR
    M["Mobile app\nParent-facing"] -->|HTTPS + access token| G["API gateway / load balancer"]
    A["Internal admin"] -->|SSO + VPN / allowlist| G
    G --> API["Modular API\nNestJS"]
    API --> DB[("PostgreSQL")]
    API --> OBJ[("Private object storage")]
    API --> OUT["Transactional outbox"]
    OUT --> Q["Job queue"]
    Q --> V["Vision/OCR worker"]
    Q --> N["Notification worker"]
    Q --> R["Scheduled insight worker"]
    V --> OBJ
    V --> AI["Vision provider / self-hosted models"]
    V --> API
    API --> W["WeatherProvider"]
    N --> PUSH["APNs / FCM"]
    API --> OBS["Logs, metrics, traces"]
~~~

## 5. Backend-модули

Каждый модуль имеет application, domain и infrastructure слои и не читает чужие таблицы напрямую.

- identity: взрослые accounts, sessions, consent;
- household: families, roles, invites, child profiles;
- wardrobe: items, attributes, media, state transitions;
- schedule: activities, recurring rules, requirements;
- weather: provider adapter, normalized snapshots, caching;
- outfit: templates, candidates, scoring, feedback;
- wear-care: wear and laundry events;
- fit-growth: measurements, size charts, fit estimates;
- insights: gaps, rotation, seasonal readiness;
- notification: preferences, quiet hours, delivery;
- billing: subscription entitlements;
- audit-privacy: access log, export, deletion jobs.

Связь между модулями — application commands/queries и domain events. Общие таблицы и circular imports запрещены архитектурными тестами.

## 6. Ключевые последовательности

### Добавление вещи

~~~mermaid
sequenceDiagram
    participant App as Mobile
    participant API
    participant S3 as Object storage
    participant Q as Queue
    participant Vision as Vision worker

    App->>App: Strip EXIF, resize, crop
    App->>API: POST /uploads/presign
    API-->>App: One-time signed URL
    App->>S3: Upload quarantined image
    App->>API: POST /wardrobe/analyses
    API->>Q: Outbox event
    Vision->>S3: Read quarantined image
    Vision->>Vision: Person check, segment, OCR, classify
    Vision->>S3: Store sanitized derivative
    Vision->>API: Save structured draft + confidences
    API-->>App: Push/poll analysis ready
    App->>API: Confirm/correct item
    API->>API: Activate item, schedule raw deletion
~~~

### Утренний образ

~~~mermaid
sequenceDiagram
    participant Scheduler
    participant API
    participant Weather
    participant Engine
    participant DB
    participant Push

    Scheduler->>API: Generate daily candidates
    API->>Weather: Forecast for coarse location/time windows
    Weather-->>API: Normalized snapshot
    API->>DB: Load available items + activities + preferences
    API->>Engine: Context + candidates
    Engine-->>API: Ranked outfits + reason codes
    API->>DB: Persist recommendation snapshot
    API->>Push: Generic notification without child data
~~~

### AI-примерка на фотографии

~~~mermaid
sequenceDiagram
    participant App as Expo iOS
    participant API as NestJS API
    participant DB as PostgreSQL
    participant Fal as fal.ai queue

    App->>App: Сжать full-body фото и cutout выбранных вещей
    App->>API: POST /v1/ai/try-on + consent
    API->>API: Проверить возраст, сессию и месячный лимит
    API->>Fal: Person + garment refs + hair/makeup prompt
    Note over API,Fal: FAL_KEY только на сервере<br/>X-Fal-Store-IO: 0<br/>media lifecycle ≈ 1 час
    Fal-->>API: request_id
    API->>DB: Сохранить только job metadata
    App->>API: GET /v1/ai/try-on/:id
    API->>Fal: Queue status/result
    Fal-->>API: Временный result URL
    API-->>App: COMPLETED + resultImageUrl
~~~

Подбор вещей остаётся детерминированным domain engine: он ранжирует реальные доступные вещи по стилю, подаче, дресс-коду, погоде и ротации. fal.ai не решает, что надеть, а визуализирует уже выбранный образ. Распознавание фото вещи может использовать vision-модель, а вырезание фона выполняет `rembg/u2netp` без LLM.

## 7. Weather architecture

WeatherProvider возвращает единый формат и скрывает поставщика. Для пилота первый кандидат — WeatherKit REST: Apple разрешает REST для других платформ и включает до 500,000 запросов в месяц в Apple Developer membership. Источник: [WeatherKit](https://developer.apple.com/weatherkit/).

Альтернатива — коммерческий Open-Meteo endpoint; бесплатный open endpoint не следует молча использовать в коммерческом продукте. Источник: [Open-Meteo pricing](https://open-meteo.com/en/pricing).

Правила:

- сервер запрашивает прогноз, мобильный клиент не обращается к provider напрямую;
- location округляется до района/города и хранится отдельно от ребёнка;
- forecast cache делится между семьями в одной grid cell;
- каждый outfit хранит weather snapshot, чтобы решение можно было воспроизвести;
- при недоступности provider используется последний свежий snapshot с явной отметкой stale;
- weather attribution выполняется по terms выбранного provider.

## 8. Аутентификация и авторизация

Учетная запись принадлежит взрослому. Поддерживаются Apple, Google и email magic link. Auth provider скрыт за OIDC, рекомендуемый production-кандидат — региональный managed identity service внутри выбранного облака.

Authorization выполняется в API по household membership и role. Любой child/item/outfit resource несёт household_id; запрос без доказанного membership отклоняется. PostgreSQL RLS используется как дополнительная защита, а не замена application checks.

Access tokens короткоживущие; refresh token хранится в native secure storage. Семейное приглашение одноразовое, истекает и может быть отозвано.

## 9. Регион и облако

Архитектура контейнерная и region-aware, потому что выбор первого рынка меняет требования к данным.

### ЕС/UK или международный pilot

Рекомендуемый baseline: AWS в регионе ЕС — managed PostgreSQL, private object storage, queue, container runtime, KMS и secrets manager.

### Россия

Первичная база, object storage, backups и журналы с персональными данными граждан РФ должны размещаться в российском регионе после юридической проверки 152-ФЗ. Контейнеры и S3-compatible adapters позволяют развернуть тот же стек в локальном облаке. Нельзя сначала собирать данные в ЕС, а потом «докопировать» их в РФ.

### UAE/MENA

Выбирается ближневосточный регион с проверкой локальных правил, transfer agreements и фактической доступности managed services.

До выбора launch market нельзя окончательно утверждать cloud provider. Это не техническая неопределённость, а юридически значимое продуктовое решение.

## 10. Окружения и CI/CD

- local: Docker Compose, fake weather, fake vision, seeded wardrobe;
- preview: временное API/admin окружение без production data;
- staging: production-like, синтетические профили и images;
- production: отдельный cloud account/project и ключи;
- analytics: read-only доступ к обезличенным first-party events.

GitHub Actions выполняет lint, typecheck, unit, architecture, contract, migration dry-run, security scan и integration tests. Production deploy требует reviewed migration и manual approval. Mobile release использует staged rollout и remote config только для заранее встроенного поведения.

## 11. Надёжность

- multi-AZ database после beta;
- point-in-time recovery и ежедневная restore-проверка;
- object versioning для короткого окна recovery, затем hard delete по retention policy;
- idempotency key на критичных POST endpoints;
- outbox relay с retry и dead-letter queue;
- exponential backoff + jitter для внешних providers;
- circuit breaker для vision/weather;
- graceful degradation: ручное добавление без AI, cached outfit без сети, ручной weather override;
- runbooks для provider outage, data deletion, leaked invite и incorrect recommendation incident.

## 12. Когда выделять сервисы

Вероятный порядок после product-market signal:

1. vision pipeline — уже отдельный worker/runtime;
2. recommendation service — когда появится online learning и отдельный release cadence;
3. catalog/commerce — отдельный trust и data boundary;
4. notifications — при большом объёме и нескольких каналах;
5. fit intelligence — если таблицы брендов и модели станут отдельным B2B-продуктом.
