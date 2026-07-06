# AI-система, рекомендации и качество

## 1. Где действительно нужен AI

### Нужен в MVP

- обнаружение и сегментация одной/нескольких вещей на фото;
- OCR ярлыка и нормализация бренда/размера;
- извлечение структурированных garment attributes;
- визуальная совместимость как один из score signals;
- background cleanup для карточки;
- короткая локализация/перефразировка уже вычисленных reason codes.

### Не отдаётся генеративной модели

- проверка доступности, чистоты и размера;
- weather safety gates;
- required items для активности;
- расчёт прав доступа;
- списание звёзд/деньги;
- финальное определение «вещь стала мала»;
- решение показать sponsored offer.

## 2. Vision pipeline

1. На устройстве: resize, orientation normalization, EXIF strip, user crop.
2. Quarantine upload в private object storage.
3. Проверка mime/magic bytes, размера, malware/polyglot и декодирование в безопасный bitmap.
4. Person/face detector. При наличии человека — автоматический garment crop только при высокой уверенности; иначе запрос нового кадра.
5. Object detection/segmentation. Несколько вещей становятся отдельными draft items после подтверждения.
6. OCR label photo, если пользователь добавил отдельный ярлык.
7. Multimodal structured extraction по versioned taxonomy.
8. Schema/range validation и consistency rules.
9. Background-removed derivative без EXIF.
10. Per-field confidence routing.
11. User confirmation/correction.
12. Raw image deletion по короткой retention policy.

## 3. Structured extraction

Модель возвращает только JSON, соответствующий schema version:

- detected objects и bounding masks;
- category/subcategory/body slot;
- color palette;
- pattern/material hypotheses;
- warmth/breathability/weather capability bands;
- activity/formality/mobility tags;
- brand/size label OCR candidates;
- confidence по каждому полю;
- evidence type: visual, OCR, catalog;
- abstain reason.

Любое неизвестное поле имеет null/UNKNOWN. Модель обязана abstain вместо угадывания.

Consistency validator ловит примеры:

- sandals с высокой wind protection;
- short-sleeve tee как outerwear;
- OCR size, отсутствующий в chart выбранного бренда;
- два mutually exclusive body slots;
- high confidence material без визуальных/OCR evidence.

## 4. Provider strategy

Архитектура содержит VisionProvider interface и хранит provider/model/prompt/taxonomy version для каждого inference. Конкретная мультимодальная модель выбирается benchmark, а не фиксируется в архитектуре: рынок моделей меняется быстрее продукта.

Критерии bake-off:

- качество на детской одежде, ярлыках и нескольких предметах;
- structured output reliability;
- latency/cost;
- zero-retention или договорный запрет обучения на данных;
- регион обработки и subprocessor list;
- DPA/SCC и deletion guarantees;
- fallback/availability;
- возможность миграции на self-hosted model.

Для pilot допустим внешний API только после privacy review. Санитизированное garment-only изображение отправляется без user/child identifiers. Сырая фотография ребёнка не должна попадать к provider.

## 5. Recommendation engine

### MVP

- deterministic constraints;
- configured layer templates;
- interpretable weighted ranker;
- pair compatibility rules + visual embedding similarity;
- bounded comfort offset;
- MMR diversity;
- reason codes generated from facts.

### После достаточного feedback

Learning-to-rank может предсказывать вероятность accept/swap для кандидата, но работает после hard filters. Рекомендуемый путь:

1. logistic/gradient boosted model на табличных features;
2. household/child personalization с global prior;
3. pair embeddings;
4. contextual bandit только после offline evaluation и safety guardrails.

Нельзя оптимизировать только clicks/engagement. Objective должен учитывать successful wear, отсутствие thermal complaints, низкое число swaps и rotation.

## 6. Cold start

При малом гардеробе используются:

- глобальные детские layer/compatibility rules;
- parent comfort choice;
- common category defaults;
- быстрый preference onboarding из 3–5 выборов;
- сильная неопределённость и просьба подтвердить.

Personal model не строится до минимального числа осмысленных decisions. Age/sex/внешность не используются как прокси вкуса.

## 7. Evaluation datasets

### Garment set

Минимум 1,500 consented garment-only изображений к beta, стратифицированных по:

- 40+ subcategories;
- toddler/child sizes;
- folded, hanger, flat lay;
- lighting/background;
- multiple items;
- patterns/materials;
- label countries/languages;
- second-hand wear and faded labels.

Нельзя собирать evaluation set из production photos без отдельного consent. По умолчанию production data не используется для обучения.

### Outfit scenario set

Не менее 500 synthetic + expert-reviewed scenarios:

- климатические диапазоны и резкие изменения;
- rain/wind/heat/UV;
- school, daycare, PE, outdoor sport, party;
- incomplete wardrobe;
- laundry/outgrown conflicts;
- accessibility/sensory preferences;
- conflicting requirements.

## 8. Метрики качества

### Vision launch gates

- category top-1 accuracy ≥ 95% на core categories;
- body slot accuracy ≥ 98%;
- primary color accuracy ≥ 95%;
- exact size OCR ≥ 90% на читаемых label images;
- person/face detection recall ≥ 99% на privacy test set;
- schema-valid response ≥ 99.9%;
- high-confidence error rate < 2%;
- P95 analysis ≤ 20 seconds.

### Recommendation launch gates

- unavailable/outgrown item violation = 0 in automated suite;
- required-slot violation = 0;
- weather hard-gate violation = 0 in reviewed scenario set;
- top-3 diversity pass ≥ 95%;
- explanation factual consistency ≥ 99%;
- no invented item = 100%.

Targets — hypotheses, not marketing claims. Если модель не проходит gate, поле переводится в user-confirmed/manual flow.

## 9. Online monitoring

- per-field correction rate;
- abstain rate;
- model/provider error and latency;
- cost per activated wardrobe item;
- outfit accept/swap/reject by context;
- too hot/too cold rate;
- false gap dismissals;
- model quality slices without exposing child identity;
- drift after taxonomy/provider version change.

Rollout новой модели: shadow → 5% canary → slice review → progressive rollout. Старую версию можно вернуть без mobile release.

## 10. Safety и prompt security

- OCR text считается недоверенным input, а не инструкцией модели;
- tool access у extraction model отсутствует;
- output только schema-constrained;
- prompts не содержат secrets, email или child nickname;
- free text проходит length/content controls;
- модель не генерирует body-shaming, gender stereotypes и оценки привлекательности;
- child-facing тексты в будущем имеют отдельный approved content layer;
- все safety-critical причины происходят из rule engine;
- human support не видит фото без отдельного time-limited audited access.

## 11. Fit model quality

Fit estimate оценивается как interval forecast:

- coverage: фактический outgrown/confirmed-small event попадает в обещанный интервал;
- interval width: не делать бесполезный диапазон на год;
- calibration: 70% confidence соответствует примерно 70% попаданий;
- reminder usefulness: parent confirms check was timely;
- brand/category slices.

До накопления longitudinal data fit prediction остаётся P1 experiment. В MVP продаётся своевременное напоминание, а не «AI знает, когда вырастет ребёнок».
