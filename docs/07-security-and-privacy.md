# Безопасность, privacy и child safety

## 1. Базовая позиция

MVP — сервис для взрослых, которые управляют гардеробом ребёнка. Это уменьшает, но не отменяет обязанности по защите детских данных: child profile, размеры, расписание и фотографии вещей могут быть связаны с ребёнком.

До отдельного этапа запрещены:

- независимый детский аккаунт;
- постоянное хранение, публикация или использование фото лица/тела ребёнка для обучения моделей;
- точная геолокация и history;
- название/адрес школы;
- открытый social sharing;
- targeted/behavioral advertising;
- продажа данных;
- скрытая передача production data для обучения моделей.

## 2. Data inventory

| Класс | Примеры | Уровень | Retention по умолчанию |
| --- | --- | --- | --- |
| Adult identity | Email, auth subject | Confidential | До удаления аккаунта + минимальный legal period |
| Child profile | Nickname, birth month/year, sizes | Highly confidential | До удаления профиля/семьи |
| Measurements | Рост, длина стопы | Highly confidential | Пока нужна fit-функция; удалить по запросу |
| Garment raw media | Исходное фото | Restricted/quarantine | До 24 часов после успешного анализа |
| Sanitized garment media | Cutout без EXIF/людей | Confidential | Пока существует вещь |
| Virtual try-on input/output | Full-body фото + временный AI-рендер | Restricted/transient | Payload storage off; media lifecycle около 1 часа |
| Schedule | Тип, время, requirements | Highly confidential | Событие + 90 дней; агрегаты без текста дольше |
| Approximate location | Город/rounded coordinates | Confidential | Пока включена погода |
| Product events | Accept/swap/wear | Confidential | Raw 13 месяцев; затем агрегирование/удаление |
| Security audit | Auth/admin/data access | Restricted | 12–24 месяца по региональной политике |
| Support | Messages, attachments | Restricted | Ticket close + 90 дней, если нет dispute |

Сроки — стартовая политика; legal basis и регион могут потребовать изменения. Retention jobs проверяются автоматическими tests и audit report.

## 3. Минимизация данных

- nickname вместо полного имени;
- month/year вместо полной даты рождения;
- city/forecast grid вместо постоянного GPS;
- activity type вместо названия школы и текста календаря;
- height/foot length вместо фото тела;
- generic push payload «Готов образ на сегодня»;
- garment-only crop вместо семейной фотографии;
- pseudonymous IDs в AI/analytics;
- отдельная таблица adult identity;
- отсутствие advertising identifiers.
- full-body фото отправляется внешнему try-on provider только после явного действия; API не сохраняет само изображение;

Каждое новое поле требует ответа: зачем оно нужно, можно ли вычислить локально, как долго хранить, кто видит, как удалить и изменит ли оно privacy notice.

## 4. Consent и права

- adult owner подтверждает полномочия управлять данными ребёнка;
- consent разбит по purposes: core service, optional calendar, model improvement, marketing;
- core service не должен требовать согласия на marketing/model training;
- policy version и evidence сохраняются append-only;
- withdrawal выключает соответствующий pipeline и запускает deletion там, где применимо;
- экспорт содержит профили, вещи, состояния, расписание и историю решений в машиночитаемом формате;
- account deletion доступен in-app и показывает понятный срок;
- удаление household требует re-auth и уведомляет других взрослых;
- support имеет процедуру identity verification без запроса лишних документов.

## 5. Sharing model

Family invite:

- одноразовый random token с hash в БД;
- срок жизни не более 72 часов;
- email hint не является авторизацией;
- принимающий должен войти и увидеть scope;
- owner может мгновенно отозвать доступ;
- все изменения ролей и exports аудитируются.

Future gift link:

- отдельный snapshot только разрешённых wishlist fields;
- без child profile, wardrobe, размеров тела и schedule;
- opaque token, expiry, optional PIN;
- покупатели видят reserved status, но не личность друг друга;
- link revoke удаляет публичный snapshot;
- noindex, no analytics pixels, no third-party ad SDK.

## 6. Security controls

### Application

- OIDC/OAuth с PKCE для mobile;
- re-auth для export/delete/ownership transfer;
- RBAC + household ABAC;
- object-level authorization tests на каждый endpoint;
- rate limiting по account/device/IP с privacy-preserving retention;
- input schema, output encoding, file content validation;
- CSRF для admin web, secure cookies, strict CSP;
- SSRF blocklist/allowlist для future URL imports;
- no secrets or PII in client bundle/logs.

### Data

- TLS in transit;
- KMS encryption at rest;
- separate keys/buckets per environment;
- private buckets + short-lived signed URLs;
- field-level encryption для особенно чувствительного free text, если он появится;
- encrypted backups и tested restore;
- production DB недоступна напрямую из public internet;
- least-privilege service identities;
- no production data in staging/dev.

### Operations

- SSO + MFA для staff;
- just-in-time privileged access;
- audited support access с reason/ticket/expiry;
- dependency, container и IaC scans;
- secret rotation;
- incident response plan и breach notification matrix;
- annual penetration test после beta и перед commerce/child mode;
- vendor/subprocessor register и DPA review.

## 7. Media security

Image pipeline — отдельная trust boundary:

1. Upload идёт только в quarantine prefix.
2. Server проверяет magic bytes и полностью re-encodes bitmap.
3. EXIF/GPS удаляются даже если клиент уже сделал это.
4. Person/face detector блокирует несанитизированный кадр.
5. AI получает opaque job id, не child/user metadata.
6. Sanitized derivative записывается другим service identity.
7. Quarantine object удаляется автоматически максимум через 24 часа.
8. Support preview по умолчанию отсутствует.
9. Download URLs не попадают в logs/analytics.

Virtual try-on — отдельное исключение из garment-only pipeline: full-body фото требуется самой функции. `FAL_KEY` существует только в backend, запрос требует авторизованную сессию и отдельное `photoConsent: true`, fal payload history отключается через `X-Fal-Store-IO: 0`, а media получает lifecycle около часа. До внедрения подтверждённого adult parental-consent gate отправка фото пользователей младше 13 лет блокируется сервером по умолчанию.

## 8. Threat model

| Угроза | Контрмера |
| --- | --- |
| IDOR: взрослый читает чужой гардероб | Household authorization + RLS + negative integration tests |
| Украденная invite/gift link | Opaque tokens, short expiry, one-time use/PIN, revoke |
| Фото ребёнка вместо вещи | On-device warning, person detection, crop/reject, raw TTL |
| Provider сохраняет image | Contract/DPA/zero-retention, sanitized input, provider abstraction |
| Prompt injection на ярлыке | OCR treated as data, schema-only extraction, no tools |
| Support abuse | JIT access, ticket reason, audit, no media by default |
| Location inference | Rounded grid, no history, generic notifications |
| Stalker/coparent misuse | Owner controls, access notifications, session revoke, audit trail |
| Child spends money | No child account in MVP; future parental gate and no direct purchase |
| Sponsored item biases outfit | Organic score computed separately; labelled adult-only offers |
| Reward coercion | Parent-confirmed ledger, no loss/streak penalty, wellbeing review |
| Re-identification in analytics | No free text/media/precise location, aggregation thresholds |

## 9. Child mode gate

Детский интерфейс нельзя включить обычным feature flag без прохождения gate:

- documented child rights/best-interests assessment;
- DPIA and jurisdiction review;
- verified parental consent mechanism;
- age/development-specific UX;
- parental gate for links, purchases, sharing and settings;
- high privacy defaults;
- no third-party ads/analytics unless explicitly допустимы политиками и review;
- no open chat/social discovery;
- no dark patterns, public ranks, punitive streaks or body scoring;
- child-readable privacy explanation;
- parent dashboard и revoke/delete;
- Apple/Google policy checklist and store pre-review.

Apple отдельно указывает, что parental gate не равен юридически достаточному parental consent: [App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/). Это два независимых требования.

## 10. Безопасность рекомендаций

Продукт не является медицинским или emergency weather сервисом.

- forecast timestamp и source видны;
- при stale/missing data рекомендация снижает confidence;
- severe weather приводит к системному предупреждению обратиться к официальным источникам, а не к «смелому» outfit advice;
- parent override всегда доступен;
- правила проходят expert review;
- «один слой больше» для маленьких детей может быть справочной эвристикой, но не универсальным законом. Американская академия педиатрии приводит её как rule of thumb и рекомендует несколько тонких слоёв: [HealthyChildren.org](https://www.healthychildren.org/English/safety-prevention/at-play/Pages/Cold-Weather-Safety.aspx).

## 11. Pre-launch checklist

- data map и lawful basis review;
- DPIA/privacy impact assessment;
- privacy policy, terms, child data notice;
- subprocessor and cross-border transfer review;
- store data safety/privacy labels;
- deletion/export end-to-end test;
- object authorization test suite;
- raw photo TTL evidence;
- restore and incident tabletop exercise;
- security contact and vulnerability disclosure;
- local counsel sign-off for first launch geography.
