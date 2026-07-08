# Аккаунты, социальный профиль, подписки и чат

Статус: продуктовая и техническая спецификация для social layer. Это отдельный модуль поверх wardrobe/outfit engine.

## 1. Цель

Пользователь должен иметь лёгкий аккаунт, страницу профиля, возможность выкладывать луки, находить друзей, подписываться на них и общаться в чате.

Социальная часть не должна ломать основной сценарий: сначала гардероб и подбор образов, потом публикация выбранного образа.

## 2. Лёгкий аккаунт

Минимальный onboarding:

1. nickname;
2. публичный handle/ID, например `@misha.fit`;
3. возрастная группа;
4. язык;
5. avatar optional;
6. privacy mode.

Для MVP можно использовать guest/local account, но для синхронизации, подписок и чатов нужен серверный user id. Жёсткую регистрацию с email/password можно не делать в первом релизе. Более подходящие варианты:

- magic link / passkey / device session для взрослых;
- child profile внутри семейного аккаунта;
- public handle для поиска друзей;
- recovery через взрослого/семейный аккаунт.

## 3. Возрастная privacy policy

| Возраст | Публичность | Поиск | Чат |
| --- | --- | --- | --- |
| 0–9 | Нет публичного профиля ребёнка | Только взрослый видит профиль | Нет |
| 10–12 | Только приватный профиль / друзья после одобрения | По invite code или exact handle | Только одобренные контакты, без фото в DM на MVP |
| 13–15 | Приватный по умолчанию | Exact handle + mutuals | Одобренные контакты, rate limits, жалобы |
| 16–18 | Можно публичный профиль | Handle search | Чат с safety-фильтрами и блокировками |

Это стартовая политика. Она должна пройти legal/content review перед production.

## 4. Социальный профиль

Public profile содержит:

- nickname;
- handle;
- avatar;
- selected style mix;
- опубликованные looks;
- followers/following counts;
- badges/achievements optional;
- privacy state: PRIVATE, FRIENDS_ONLY, PUBLIC.

Не показывать:

- точный возраст;
- школу;
- адрес/гео;
- расписание;
- исходные фото вещей, если пользователь публикует только итоговый look;
- цены wishlist для ребёнка и других пользователей.

## 5. Публикация лука

Flow:

1. Пользователь выбирает один из сгенерированных образов.
2. Нажимает «Опубликовать».
3. Приложение создаёт `look_post`:
   - outfit option snapshot;
   - список вещей без private metadata;
   - style tags;
   - caption optional;
   - visibility;
   - created_at.
4. Подписчики видят пост в feed.

Публикуется snapshot, а не live-ссылка на гардероб. Если вещь потом удалена/архивирована, старый пост не ломается.

## 6. Поиск друзей и подписки

Search MVP:

- exact handle search: `@misha.fit`;
- invite code / QR;
- contacts import не нужен в MVP;
- recommendation graph можно добавить позже.

Follow model:

- PUBLIC profile: follow сразу;
- PRIVATE profile: follow request;
- minors under policy threshold: parent approval или mutual code.

Состояния:

- NONE;
- REQUESTED;
- FOLLOWING;
- BLOCKED;
- MUTED.

## 7. Чат

Чат нужен, но это отдельный risk surface. MVP-чата:

- 1:1 только между одобренными контактами;
- без group chats на старте;
- text-only в MVP;
- ссылки и внешние контакты ограничены;
- block/report обязательны;
- message retention и moderation policy заранее определены;
- взрослый не должен получать скрытый доступ к личным подростковым сообщениям без понятной политики, но safety escalation должен существовать.

Для детей младше 13 лет чат либо выключен, либо работает только через approved friends/invite code и строгие ограничения.

## 8. Модель данных

Основные сущности:

### social_accounts

- id;
- user_id / child_profile_id;
- nickname;
- handle_normalized;
- avatar_object_key;
- locale;
- privacy_state;
- discoverability_state;
- created_at;
- updated_at.

### follows

- follower_account_id;
- target_account_id;
- status: REQUESTED, ACCEPTED, REJECTED, BLOCKED, MUTED;
- requested_at;
- accepted_at;
- created_by_actor;
- unique(follower, target).

### look_posts

- id;
- author_account_id;
- outfit_snapshot_json;
- style_tags_json;
- caption;
- visibility: PRIVATE, FRIENDS_ONLY, PUBLIC;
- moderation_state: CLEAN, PENDING_REVIEW, HIDDEN, REMOVED;
- like_count;
- comment_count;
- created_at.

### conversations

- id;
- type: DIRECT;
- created_at;
- last_message_at;
- safety_state.

### conversation_members

- conversation_id;
- account_id;
- role;
- joined_at;
- muted_until;
- last_read_at.

### messages

- id;
- conversation_id;
- sender_account_id;
- body;
- moderation_state;
- created_at;
- deleted_at.

## 9. API MVP

- POST `/v1/social/accounts`
- GET `/v1/social/accounts/:handle`
- PATCH `/v1/social/accounts/:id`
- GET `/v1/social/search?handle=`
- POST `/v1/social/follows`
- PATCH `/v1/social/follows/:id`
- POST `/v1/social/look-posts`
- GET `/v1/social/feed`
- GET `/v1/social/accounts/:id/look-posts`
- POST `/v1/social/conversations`
- GET `/v1/social/conversations`
- POST `/v1/social/conversations/:id/messages`
- GET `/v1/social/conversations/:id/messages`
- POST `/v1/social/reports`
- POST `/v1/social/blocks`

## 10. Что не входит в текущий vertical slice

Пока social layer не реализован в UI/API. В текущем slice есть только подготовка основного объекта — `OutfitOption`, который можно будет сохранять как `look_post`.

Реализацию social лучше делать после:

1. базовой авторизации/семейного аккаунта;
2. object storage для фото/cutout;
3. privacy settings;
4. moderation/report/block baseline.
