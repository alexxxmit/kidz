# MIRA — продуктовая система

Статус: product direction и спецификация iOS MVP, 10 июля 2026. `MIRA` — рабочий consumer-бренд; `kidz` остаётся техническим именем репозитория до trademark/domain check.

## 1. Что это за продукт

MIRA — личная style-сеть, которая превращает реальный гардероб в ежедневные образы, безопасное творчество и общение. Она не оценивает внешность и не заставляет покупать. Главный объект продукта — не фотография лица, а **образ из вещей, которые пользователь действительно имеет**.

Короткое обещание:

> Твои вещи. Твой mood. Твой круг.

Продукт должен отвечать на четыре вопроса:

1. Что надеть из моего шкафа прямо сейчас?
2. Как сделать это в выбранном стиле?
3. Как показать свою версию друзьям и получить идеи без рейтинга внешности?
4. Стоит ли покупать новую вещь или она ничего не добавит?

## 2. Для кого

Один аккаунт поддерживает возраст 0–18, но опыт меняется по развитию пользователя.

| Возраст | Кто управляет | Главная ценность | Social | AI-тон |
| --- | --- | --- | --- | --- |
| 0–5 | взрослый | быстро одеть, стирка, рост, сезон | только семья | практичные рекомендации взрослому |
| 6–9 | вместе | выбрать из 2–3 вариантов, освоить самостоятельность | семейная галерея и одобренные близкие | объясняет простыми вариантами |
| 10–12 | пользователь + privacy gate | собственный стиль и закрытый круг | invite/exact handle, без DM | предлагает, не командует |
| 13–15 | пользователь | style identity, remixes, челленджи | circle по умолчанию, DM только контакты | guarded teen stylist |
| 16–18 | пользователь | самовыражение, creator tools, покупки | публичность opt-in | полноценный fashion companion |

Apple с июля 2026 относит приложения с распространением/усилением UGC через feed к social media и задаёт минимум 13+, если social-функции не выключены для младших. Поэтому открытый feed отключён до 13 и возраст проверяется через Declared Age Range API перед публичной social-поверхностью: [Apple What's New](https://developer.apple.com/app-store/whats-new/).

## 3. Почему продукт может стать привычкой

### Ежедневный цикл

`план дня → три AI-образа → выбрать/swap → надеть → сохранить или поделиться`

### Social loop

`опубликовать look snapshot → друг нажимает Remix → меняет вещи на свои → автор получает уведомление → открывает новую версию`

Remix ценнее обычного like: он создаёт следующий контент и возвращает обоих пользователей.

### Недельный цикл

- “1 вещь — 3 настроения”;
- “неделя без новых покупок”;
- “цвет, который редко носишь”;
- private group challenge с друзьями;
- сезонный closet reset.

Награда — новые творческие инструменты, рамки профиля и progress, но не случайные loot boxes и не давление на streak.

### Покупательский цикл

`добавить вещь в wishlist → AI показывает совместимость → 0/7/24 новых образа → сравнить три бюджета → взрослый или пользователь 16+ принимает решение`

## 4. Пять основных экранов

### Today

- погода и событие как контекст;
- один hero-look из реальных вещей;
- swap/remix одной вещи;
- hair, styling и age-appropriate makeup reference;
- быстрый вопрос AI;
- один недельный challenge.

Для 10+ погода не формулируется как приказ. “На улице +8; в этом варианте есть тёплый слой” вместо “надень шапку”.

### Circle

- 0–9: семейная галерея;
- 10–12: только approved circle/invite;
- 13–15: private-by-default feed;
- 16–18: opt-in public discovery;
- реакции `Love`, `Inspired`, `Wow`;
- комментарии и remix;
- никаких “hot or not”, оценок тела и анонимного чата.

### Create

- контекст: школа, прогулка, событие, спорт;
- style mix;
- три объяснимых образа;
- замена одной вещи без разрушения общей идеи;
- публикация snapshot без приватных метаданных шкафа.

### Closet

- batch/photo capture;
- реальное удаление фона;
- AI-категория, цвет, сезон, теплота и style tags с подтверждением;
- clean/laundry/outgrown;
- wear rotation, cost per wear, missing gaps;
- сумки, обувь, украшения, ремни, головные и hair accessories наравне с одеждой.

### Me

- handle и avatar без точного возраста/школы/гео;
- Style DNA как изменяемая смесь;
- опубликованные looks;
- privacy center;
- wishlist;
- Plus/Family entitlement.

## 5. AI-система

LLM не является единственным рекомендателем.

1. **Vision**: cutout и извлечение атрибутов одной вещи.
2. **Wardrobe graph**: доступность, стирка, fit, цвета, слоты, стиль, wear history.
3. **Constraint engine**: исключает невозможные и небезопасные варианты.
4. **Ranker**: стиль, погода, occasion, разнообразие, личная обратная связь.
5. **LLM stylist**: объясняет, отвечает на вопросы и делает controllable remix.
6. **Moderation**: проверяет captions, comments, messages и публикуемые изображения.

OpenAI рекомендует Responses API для новых интеграций; он поддерживает vision и multimodal input: [Responses migration](https://developers.openai.com/api/docs/guides/migrate-to-responses). Для извлечения атрибутов используется Structured Outputs, чтобы ответ соответствовал JSON Schema: [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs). Для UGC — `omni-moderation-latest`, принимающий текст и изображения: [Moderation](https://developers.openai.com/api/docs/guides/moderation).

Для пользователей младше 13 лет персональные данные нельзя отправлять в OpenAI без zero data retention. До контрактного включения ZDR младший режим использует локальный deterministic engine и деперсонализированные garment crops: [OpenAI Under 18 API Guidance](https://developers.openai.com/api/docs/guides/safety-checks/under-18-api-guidance).

## 6. Правила рекомендаций внешности

- причёска зависит от длины, текстуры, выбранной подачи и стиля;
- hair color — только опциональный trend reference: “в Stockholm сейчас часто встречается тёмный блонд; чёрные волосы тоже работают”;
- макияж не предлагается как обязательный способ “стать красивее”;
- до 10 лет makeup отсутствует, 10–12 — creative/play reference только в семейном режиме, 13+ — age-appropriate optional styling;
- нет анализа привлекательности, веса, “идеальной фигуры”, расы или здоровья;
- AI не советует скрывать тело и не сравнивает пользователя с другими.

## 7. Safety by design

Apple требует фильтрацию objectionable UGC, report, block, быстрый response process и публичный контакт поддержки: [App Review Guidelines 1.2](https://developer.apple.com/app-store/review/guidelines/). Эти функции являются launch blockers, а не будущими улучшениями.

Privacy defaults следуют Children’s Code: высокая приватность по умолчанию, минимум данных, geolocation off, отсутствие nudges к ослаблению privacy: [ICO Age Appropriate Design](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/age-appropriate-design-a-code-of-practice-for-online-services/).

Обязательные ограничения:

- нет anonymous/random chat;
- DM только 13+ и только approved contacts;
- contact/link filtering до 16;
- image DM отсутствует в первой версии;
- public profile opt-in только 13+;
- точный возраст, школа, гео, расписание и исходный wardrobe inventory не публикуются;
- report/block доступны в два нажатия;
- high-risk signals идут в human escalation queue;
- safety никогда не находится за paywall.

## 8. North Star и метрики

North Star: **Weekly Successful Style Days** — дни, когда пользователь выбрал/изменил look, отметил носку или создал remix.

Guardrail metrics:

- median time to first useful look ≤ 4 минуты;
- ≥60% пользователей получают первый look в onboarding day;
- week-4 retention ≥30% для teen cohort и ≥40% для family cohort — pilot hypothesis;
- ≥20% опубликованных looks получают remix, а не только like;
- report response SLA: high risk <1 час, ordinary <24 часа;
- harmful content exposure и privacy incidents — launch-stopping metrics;
- `too hot/too cold` <5% после калибровки;
- AI hallucinated owned item = 0.

## 9. Что не обещаем

- “каждая девочка мира” — vision, не измеримая гарантия;
- точное определение размера/роста по одной фотографии;
- медицинские, body-image или дерматологические советы;
- полностью безопасную соцсеть без человеческой модерации;
- идеальную virtual try-on геометрию для всех тканей;
- полный каталог “всех стилей мира” как конечный список. Style ontology версионируется и принимает локальные тренды/aliases.

## 10. Launch wedge

Первый market wedge: 13–17, English-first + Russian pilot, девочки и femme-presenting teens, которым интересны outfit remix и собственные aesthetics. Семейный режим 0–12 остаётся в том же ядре, но не участвует в open social acquisition.

После подтверждения retention:

1. Spanish, Portuguese, French, German;
2. creator challenges;
3. family wardrobe/growth planning;
4. smart commerce;
5. adult mode на том же wardrobe engine.
