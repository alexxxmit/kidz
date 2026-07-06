# Модель данных и API

## 1. Принципы

- PostgreSQL — source of truth.
- Все изменяемые бизнес-состояния имеют history/event trail.
- Tenant boundary — household_id.
- Child profile отделён от adult identity.
- Photos находятся в object storage; база хранит только metadata и opaque object key.
- AI-поле всегда имеет source, confidence и confirmed_at.
- Денежные значения хранятся integer minor units + ISO currency.
- Время хранится UTC; локальный timezone — IANA identifier.
- Публичные идентификаторы — UUIDv7; последовательные integer IDs наружу не выдаются.
- Soft delete не заменяет privacy deletion: после recovery window данные удаляются физически.

## 2. Связи

~~~mermaid
erDiagram
    ADULT_USER ||--o{ HOUSEHOLD_MEMBER : joins
    HOUSEHOLD ||--o{ HOUSEHOLD_MEMBER : has
    HOUSEHOLD ||--o{ CHILD_PROFILE : contains
    CHILD_PROFILE ||--o{ CHILD_MEASUREMENT : has
    CHILD_PROFILE ||--o{ WARDROBE_ITEM : owns
    WARDROBE_ITEM ||--o{ ITEM_MEDIA : has
    WARDROBE_ITEM ||--o{ ITEM_STATE_EVENT : changes
    CHILD_PROFILE ||--o{ ACTIVITY : schedules
    CHILD_PROFILE ||--o{ OUTFIT_RECOMMENDATION : receives
    OUTFIT_RECOMMENDATION ||--o{ OUTFIT_OPTION : contains
    OUTFIT_OPTION ||--o{ OUTFIT_OPTION_ITEM : contains
    WARDROBE_ITEM ||--o{ OUTFIT_OPTION_ITEM : appears
    OUTFIT_OPTION ||--o| OUTFIT_DECISION : selected
    OUTFIT_DECISION ||--o{ WEAR_EVENT : creates
    WARDROBE_ITEM ||--o{ WEAR_EVENT : worn
    WARDROBE_ITEM ||--o{ CARE_EVENT : cared
    CHILD_PROFILE ||--o{ FIT_ESTIMATE : has
    HOUSEHOLD ||--o{ CONSENT_RECORD : records
~~~

## 3. Основные таблицы

### Identity/household

adult_users

- id, auth_subject, email_normalized, locale, timezone, status;
- email хранится отдельно от продуктовой аналитики;
- provider profile photo не импортируется автоматически.

households

- id, country_code, default_locale, timezone, subscription_tier;
- launch_region фиксируется и не меняется обычным запросом.

household_members

- household_id, adult_user_id, role, status, invited_by, joined_at;
- unique household/user;
- Owner нельзя удалить, пока не передана ownership.

household_invites

- token_hash, role, email_hint, expires_at, consumed_at, revoked_at;
- raw token не хранится.

child_profiles

- id, household_id, nickname, birth_month, birth_year;
- comfort_offset, current_clothing_size, current_shoe_size;
- нет full date of birth, school, address, face photo;
- optional sex/growth reference появляется только после отдельной legal/product оценки.

consent_records

- subject_type/id, actor_adult_id, purpose, legal_basis;
- policy_version, granted_at, withdrawn_at, evidence_json;
- append-only.

### Wardrobe

wardrobe_items

- id, household_id, child_id, display_name;
- category, subcategory, body_slot;
- warmth, breathability, rain_protection, wind_protection;
- formality, mobility, easy_on, care_burden;
- colors_json, pattern, material_family, activity_tags;
- size_system, size_value, brand_id nullable;
- lifecycle_state, care_state, fit_state;
- purchase_price_minor/currency/date optional;
- storage_location_id nullable;
- row_version for optimistic concurrency.

item_attribute_evidence

- item_id, attribute_key, value_json, source, confidence;
- model_version, inferred_at, confirmed_by, confirmed_at;
- позволяет улучшать модель без потери пользовательской правки.

item_media

- item_id, purpose, object_key, content_hash, mime, width, height;
- privacy_state: QUARANTINED, SANITIZED, DELETE_PENDING;
- raw_expires_at, deleted_at.

item_state_events

- item_id, axis, from_state, to_state, reason, actor_type/id, created_at;
- append-only, используется для аудита и восстановления причин.

item_pair_preferences

- item_a, item_b, relation: LIKE, DISLIKE, NEVER_PAIR;
- source: USER, LEARNED; learned relation не может стать NEVER_PAIR автоматически.

### Context/recommendations

activities

- child_id, type, start_at, end_at, recurrence_rule;
- indoor_ratio, intensity, dress_code, requirements_json;
- title optional and encrypted if free text is enabled later.

weather_locations

- household_id, label, rounded_lat, rounded_lon, grid_key;
- не хранит GPS history.

weather_snapshots

- provider, grid_key, valid_from/to, fetched_at, attribution;
- normalized hourly_json, raw object optional with short retention.

outfit_recommendations

- child_id, target_start/end, context_hash, weather_snapshot_id;
- engine_version, status, generated_at, expires_at;
- context snapshot позволяет воспроизвести решение.

outfit_options

- recommendation_id, rank, total_score;
- score_components_json, reason_codes, warnings;
- is_partial, missing_requirements_json.

outfit_option_items

- option_id, item_id, slot, contribution_scores_json;
- snapshot основных item attributes на момент генерации.

outfit_decisions

- option_id, actor_id, decision, decided_at;
- rejection_reason, thermal_feedback, final_option_revision;
- idempotency key защищает от двойного acceptance.

wear_events и care_events

- item_id, child_id, outfit_decision_id optional, occurred_at;
- source, intensity/condition optional;
- care event имеет from/to state и parent confirmation.

### Fit and insights

child_measurements

- child_id, measured_on, height_cm, foot_length_mm;
- source USER_ENTERED, confidence, notes optional;
- weight не нужен для wardrobe fit в MVP.

brand_size_charts и brand_size_ranges

- versioned source URL, market, category, size, min/max measurements;
- fetched/reviewed dates и license metadata;
- chart update не переписывает старые estimates.

fit_estimates

- item_id, model_version, window_start/end, confidence_band;
- evidence_json, generated_at, invalidated_at;
- не изменяет fit_state напрямую.

wardrobe_gaps

- child_id, category/capability, horizon_start/end;
- evidence_count, confidence, status;
- status OPEN, DISMISSED, RESOLVED, SNOOZED.

## 4. Индексы и ограничения

Критичные индексы:

- household_members(adult_user_id, status);
- wardrobe_items(child_id, lifecycle_state, care_state, fit_state);
- activities(child_id, start_at, end_at);
- outfit_recommendations(child_id, target_start, status);
- wear_events(item_id, occurred_at desc);
- weather_snapshots(grid_key, valid_from, valid_to);
- outbox_events(status, available_at).

DB constraints:

- score/attribute ranges;
- valid state enum values;
- end time after start time;
- no duplicate active membership;
- media object key unique;
- accepted decision unique per recommendation revision;
- wear/care request idempotency unique per household.

## 5. API style

REST JSON under /v1 with generated OpenAPI schema. Mobile SDK генерируется из spec; ручные divergent interfaces запрещены.

Общие правила:

- Authorization: Bearer token;
- X-Household-Id для выбранного контекста, но membership всегда проверяет сервер;
- Idempotency-Key для create/transition commands;
- If-Match с row_version для конфликтующих edits;
- cursor pagination;
- ISO 8601 timestamps;
- structured errors с code, message, field_errors, request_id;
- никакой PII в URL/query, если можно использовать body;
- signed upload URLs живут несколько минут и ограничены content-type/size/object key.

## 6. Основные endpoints MVP

### Session/household

- GET /v1/me
- POST /v1/households
- GET /v1/households/:id
- POST /v1/households/:id/invites
- POST /v1/invites/:token/accept
- PATCH /v1/households/:id/members/:memberId

### Children

- POST /v1/children
- GET /v1/children/:id
- PATCH /v1/children/:id
- POST /v1/children/:id/measurements
- GET /v1/children/:id/measurements

### Wardrobe/media

- POST /v1/uploads/presign
- POST /v1/wardrobe/analyses
- GET /v1/wardrobe/analyses/:id
- POST /v1/wardrobe/analyses/:id/confirm
- POST /v1/wardrobe/items
- GET /v1/wardrobe/items?child_id=&cursor=&states=
- GET /v1/wardrobe/items/:id
- PATCH /v1/wardrobe/items/:id
- POST /v1/wardrobe/items/:id/transitions
- DELETE /v1/wardrobe/items/:id

### Schedule/weather

- POST /v1/activities
- GET /v1/activities?child_id=&from=&to=
- PATCH /v1/activities/:id
- DELETE /v1/activities/:id
- PUT /v1/households/:id/weather-location
- GET /v1/weather/summary?child_id=&from=&to=

### Outfits/wear/care

- POST /v1/outfit-recommendations
- GET /v1/outfit-recommendations/:id
- POST /v1/outfit-options/:id/swap
- POST /v1/outfit-options/:id/accept
- POST /v1/outfit-options/:id/reject
- POST /v1/outfit-decisions/:id/wear
- POST /v1/wardrobe/items/:id/care-transitions
- POST /v1/outfit-decisions/:id/feedback

### Privacy

- GET /v1/privacy/consents
- POST /v1/privacy/consents
- DELETE /v1/privacy/consents/:purpose
- POST /v1/privacy/export
- POST /v1/privacy/delete-account
- GET /v1/privacy/jobs/:id

## 7. Пример recommendation response

Response логически содержит:

- recommendation id, child id и target window;
- weather summary + fetched_at + stale flag;
- context activities;
- options с item IDs и signed thumbnail URLs;
- score components только для debug/admin, не обязательно UI;
- reason codes с локализованным текстом;
- warnings и missing requirements;
- engine/taxonomy version;
- expires_at.

Клиент не получает внутренний prompt, raw provider response, hidden model reasoning и чужие household identifiers.

## 8. Domain events

Минимальный event catalog:

- HouseholdMemberInvited/Joined/Removed;
- ChildProfileCreated/Updated;
- GarmentAnalysisRequested/Completed/Failed;
- WardrobeItemActivated/StateChanged/Deleted;
- ActivityScheduled/Changed;
- OutfitRecommendationGenerated/Failed;
- OutfitAccepted/Rejected/ItemSwapped;
- OutfitWorn;
- CareStateChanged;
- FitCheckDue/FitConfirmed;
- WardrobeGapDetected/Resolved;
- ConsentGranted/Withdrawn;
- PrivacyDeletionRequested/Completed.

Event envelope содержит event_id, aggregate_id/type, household_id, schema_version, occurred_at, correlation_id и payload без email/photo URL. Consumers обязаны быть idempotent.
