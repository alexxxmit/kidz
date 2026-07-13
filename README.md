# MIRA / Kidz

MIRA — рабочий consumer-бренд адаптивного AI-гардероба и безопасной style-сети для пользователей от 0 до 18 лет. `kidz` остаётся техническим именем репозитория до name/trademark check.

Текущий product slice включает age-adaptive onboarding, Today, Circle, Create, Closet и Me, реальные garment cutouts, style-aware outfit engine, AI-стилиста, приватную fal.ai-примерку на фото, social data model/API, закрытые чаты 13+, moderation boundary и freemium paywall.

## Документация

- [Видение и стратегия](docs/00-product-vision.md)
- [Исследование рынка](docs/01-research.md)
- [PRD и границы MVP](docs/02-prd.md)
- [Доменная и рекомендательная логика](docs/03-domain-logic.md)
- [Техническая архитектура и стек](docs/04-architecture.md)
- [Модель данных и API](docs/05-data-and-api.md)
- [AI-контур и качество](docs/06-ai-system.md)
- [Безопасность, privacy и child safety](docs/07-security-and-privacy.md)
- [Roadmap, метрики и бизнес-модель](docs/08-roadmap-and-business.md)
- [Возраст, самостоятельность, стили и локализация](docs/09-age-style-localization.md)
- [Total look: одежда, обувь, аксессуары и причёски](docs/10-total-look-mechanics.md)
- [Аккаунты, социальный профиль, подписки и чат](docs/11-social-accounts-chat.md)
- [MIRA: полная продуктовая система](docs/12-mira-product-system.md)
- [Freemium и монетизация](docs/13-monetization.md)
- [Готовность iOS-релиза](docs/14-ios-release-readiness.md)

Исследование актуализировано 10 июля 2026 года. Название MIRA, цены и география первого запуска являются рабочими гипотезами.

## Локальный запуск

Нужны Node.js 22+, pnpm 11, PostgreSQL и Redis.

```bash
pnpm install
cp .env.example .env
pnpm --filter @kidz/api db:migrate
pnpm dev
```

Основные приложения: Expo-клиент в `apps/mobile`, NestJS API в `apps/api`, внутренняя панель в `apps/admin`, очередь в `apps/jobs-worker` и Python vision-worker в `services/vision-worker`. Web-версия клиента собирается тем же Expo-кодом и раздаётся из nginx-контейнера.

## Первый рабочий сценарий

1. Пользователь выбирает русский или английский язык.
2. Указывает возраст и уровень самостоятельности.
3. Указывает пол/подачу стиля, длину и цвет волос для hair-рекомендаций.
4. Выбирает один или несколько стилей — от минимализма и преппи до эмо, панка и стокгольмского стиля.
5. Добавляет одежду, обувь, украшения, сумки и головные уборы из демо-набора или фотографирует реальные вещи.
6. Получает три полных образа с объяснением сочетания, погодной уместности, аксессуаров, направления причёски и makeup-референса.
7. Может сделать фото в полный рост и получить временный AI-рендер выбранного лука, укладки и возрастно-уместного макияжа на себе.

Cutout реальных вещей выполняет vision-worker через `rembg/u2netp`; результат возвращается как прозрачный PNG и сразу используется в коллаже. Для production остаётся перенести media из inline data URL в object storage/CDN.

AI-примерка вызывается только через серверный `POST /v1/ai/try-on`: `FAL_KEY` никогда не попадает в Expo-клиент. Входные JSON payloads не сохраняются у fal.ai, результат получает lifecycle около одного часа. Бесплатный план получает 3 рендера в месяц, PLUS — 40; лимиты настраиваются переменными окружения. Для пользователей младше 13 лет внешний рендер по умолчанию заблокирован до внедрения подтверждённого parental-consent gate.
