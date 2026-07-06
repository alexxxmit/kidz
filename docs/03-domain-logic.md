# Доменная и рекомендательная логика

## 1. Модули домена

| Модуль | Ответственность |
| --- | --- |
| Identity & Consent | Взрослые пользователи, consent, sessions, legal versions |
| Household | Семья, роли, приглашения, дети |
| Wardrobe | Вещи, атрибуты, фото, состояния, места хранения |
| Schedule | Структурированные активности и требования |
| Weather | Нормализованный прогноз для временного окна |
| Outfit | Генерация, ranking, explanation, acceptance и feedback |
| Wear & Care | Носка, стирка, починка и доступность |
| Fit & Growth | Измерения, посадка, size charts, reminder window |
| Insights | Ротация, пробелы, cost per wear, seasonal readiness |
| Wishlist & Rewards | P1/P2: желания, цели, задания, ledger звёзд |
| Commerce | P3: каталог, предложения, affiliate attribution |

## 2. Состояние вещи

У вещи три независимые оси. Их нельзя смешивать в один status.

### Lifecycle

DRAFT → ACTIVE → STORED → ACTIVE → ARCHIVED

ARCHIVED имеет reason: OUTGROWN, DONATED, SOLD, LOST, DISCARDED или HANDED_DOWN.

### Cleanliness/care

CLEAN → WORN_REUSABLE → LAUNDRY_DUE → IN_LAUNDRY → WASHING → DRYING → CLEAN

Из CLEAN/WORN_REUSABLE возможен переход в REPAIR; после ремонта — назад в предыдущее доступное состояние.

### Fit

UNKNOWN → TOO_BIG → FITS → GETTING_SMALL → OUTGROWN

Родитель может изменить любой fit state. Автоматика создаёт предложение проверки, но не переводит вещь в OUTGROWN без подтверждения.

### Доступность для образа

Вещь допустима, только если:

- lifecycle = ACTIVE;
- care ∈ {CLEAN, WORN_REUSABLE};
- fit ∈ {FITS, UNKNOWN} или TOO_BIG явно разрешён родителем;
- не занята в другом подтверждённом образе на пересекающийся период;
- соответствует child_id и не находится у другого ребёнка без shared ownership.

## 3. Таксономия вещи

Минимальные атрибуты для рекомендации:

- category и subcategory;
- body slot: base_top, top, bottom, one_piece, mid_layer, outerwear, footwear, headwear, hands, accessory;
- warmth 0–4;
- breathability 0–4;
- rain protection 0–4;
- wind protection 0–4;
- activity tags;
- formality 0–4;
- primary/secondary colors;
- pattern;
- material family;
- easy_on score и mobility score;
- care burden;
- size system/value и confirmed fit;
- user preference и do_not_pair links.

AI может предложить атрибуты, но source и confidence хранятся по каждому полю: USER_CONFIRMED, LABEL_OCR, MODEL_INFERRED или CATALOG_IMPORTED.

## 4. Контекст дня

Нормализованный context содержит:

- relevant time windows, а не только дневной min/max;
- air temperature и apparent temperature;
- probability/amount/type of precipitation;
- wind speed/gust;
- humidity и UV для объяснения, если релевантно;
- indoor/outdoor share;
- activity intensity;
- dress code;
- required/forbidden item tags;
- family comfort offset;
- parent overrides.

Weather provider обязан быть заменяемым. Ответ провайдера сохраняется как snapshot с временем получения и attribution.

## 5. Генерация образа

### Этап A — определить обязательные слоты

Rule engine строит template по возрастной группе, погоде и активности. Примеры:

- indoor warm: top + bottom/one_piece + footwear;
- cool outdoor: base + mid or warm top + bottom + outerwear + footwear;
- rain: предыдущий template + rain-capable outerwear/footwear;
- PE: sport top + sport bottom + sport footwear + carry reminder;
- high UV/outdoor: headwear и coverage recommendation.

Пороговые значения конфигурируются по климатической зоне и калибруются feedback, а не зашиваются навсегда в клиент.

### Этап B — отфильтровать кандидатов

Hard filters:

1. доступность, fit и care state;
2. обязательный slot;
3. weather capability;
4. activity/dress code;
5. parent restrictions;
6. конфликт бронирования;
7. критические pair restrictions.

### Этап C — собрать комбинации

Используется constraint-aware beam search, а не полный перебор. На каждом добавленном slot сохраняются только лучшие N частичных комбинаций, прошедшие hard constraints.

### Этап D — оценить

После hard gates итоговый score нормализуется от 0 до 1:

| Компонент | Вес MVP | Что измеряет |
| --- | ---: | --- |
| Weather/thermal match | 0.30 | Тепло, дождь, ветер, воздухопроницаемость |
| Activity suitability | 0.20 | Подвижность, dress code, обязательные предметы |
| Compatibility/style | 0.15 | Цвет, pattern, formality, silhouette |
| Preference | 0.12 | Принятия, отклонения, любимые/неприятные вещи |
| Rotation | 0.10 | Не забывать вещи и не повторять один комплект слишком часто |
| Fit confidence | 0.08 | Подтверждённая посадка лучше неизвестной |
| Care cost | 0.05 | Не создавать лишнюю стирку без причины |

Вес — конфигурация и стартовая гипотеза. Safety не может быть компенсирована высоким style score, потому что критичные погодные требования уже отсеяны hard gates.

### Этап E — разнообразить top 3

Используется maximal marginal relevance: второй и третий варианты должны менять хотя бы значимую верхнюю/нижнюю вещь, цветовую схему или слой, оставаясь валидными.

### Этап F — объяснить

Engine возвращает структурированные reason codes, например:

- RAIN_PROTECTED;
- EXTRA_LAYER_FOR_COOL_MORNING;
- PE_SHOES_REQUIRED;
- RECENTLY_UNDERUSED_ITEM;
- CHILD_PREFERS_BLUE;
- FIT_RECHECK_SOON.

Текст строится шаблонами и, опционально, перефразируется LLM. LLM не добавляет новых фактов.

## 6. Feedback loop

| Сигнал | Изменение модели |
| --- | --- |
| Accepted | Положительный pair/context signal |
| Swapped item | Слабый негатив заменённой вещи, положительный выбранной |
| Rejected whole outfit | Негатив комбинации; запрос одной причины без обязательного текста |
| Too cold / too hot | Обновляет child/family comfort offset с ограниченной скоростью |
| Item unavailable | Немедленно исправляет state; не считается style dislike |
| Did not wear | Не создаёт wear event и не наказывает предпочтение без причины |
| Wore despite no recommendation | Сильный implicit compatibility signal при ручной фиксации |

Comfort offset имеет ограниченный диапазон и требует нескольких согласованных сигналов. Один случай не должен резко менять будущие рекомендации.

## 7. Поведение при неполном гардеробе

Система не должна подменять отсутствующую вещь выдумкой.

Пример ответа:

> Для дождя найден комплект, но в гардеробе нет подтверждённой непромокаемой обуви. Выберите доступную обувь вручную или добавьте пару.

Gap создаётся только если:

- потребность повторяется в forecast/schedule horizon;
- эквивалента действительно нет среди ACTIVE вещей;
- вещь не находится в laundry/stored и не ожидает подтверждения;
- confidence выше порога.

## 8. Стирочная логика

Для category задаётся configurable wear threshold, но это только момент напоминания. Учитываются:

- тип вещи;
- интенсивность активности;
- дождь/грязь при ручном подтверждении;
- пользовательские правила;
- фактическое решение после предыдущего напоминания.

Нижнее бельё и носки могут по умолчанию запрашивать стирку после одной носки; outerwear — не по числу носок, а по ручному состоянию/инциденту. Эти значения должны проходить content/legal review и оставаться редактируемыми.

## 9. Fit prediction

### MVP

- текущий size и fit подтверждает родитель;
- приложение напоминает повторить примерку через configurable interval;
- brand size chart используется только как справка;
- нет точного прогноза даты.

### P1

Окно fit risk строится из:

1. подтверждённых измерений ребёнка;
2. личной скорости изменения при наличии минимум 3 точек;
3. диапазона размеров конкретного бренда;
4. типа посадки и garment allowance;
5. последних подтверждений FITS/GETTING_SMALL;
6. широкого population prior только при недостатке личных данных.

Результат — диапазон и confidence. Growth standards могут помочь построить prior, но не используются для диагностики. WHO публикует height-for-age standards: [WHO Child Growth Standards](https://www.who.int/tools/child-growth-standards/standards/p).

## 10. Wishlist и commerce

P1 wishlist item может происходить из gap, ручного желания или внешней ссылки. Ребёнку в будущем показывается только одобренная родителем карточка без цены; взрослый видит цену и предложения.

Показатель полезности товара:

- закрывает ли обязательный gap;
- сколько валидных комплектов добавляет;
- подходит ли к существующей палитре/активностям;
- прогноз посадки и размерная уверенность;
- дублирование существующих вещей;
- цена и стоимость потенциальной носки.

Органический utility score вычисляется до monetization. Спонсорский статус не меняет utility score и всегда виден взрослому.

## 11. Stars/tasks — будущий модуль

Звёзды реализуются как неизменяемый ledger, а не редактируемый balance:

- родитель создаёт задачу и награду;
- выполнение подтверждает взрослый;
- ledger содержит EARN, ADJUST и REDEEM;
- цель резервирует, но не списывает звёзды до подтверждения;
- покупка остаётся решением взрослого;
- нет случайных наград, loot boxes, публичных рейтингов и потери накопленного за пропуск дня.

Награда «за то, что надел предложенный образ» не должна учить слепо слушаться алгоритма. Лучше награждать самостоятельный выбор из безопасного набора и завершение утренней рутины.
