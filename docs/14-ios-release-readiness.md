# iOS release readiness

## 1. Что уже реализовано в репозитории

- Expo/React Native client с iOS configuration;
- возрастной onboarding 0–18;
- Today, Circle, Create, Closet, Me;
- style-aware outfits, hair, accessories и makeup references;
- локальный fallback outfit engine;
- реальное background removal через `rembg/u2netp` worker;
- guest device session и handle;
- social schema/API: feed, follow, reactions, comments, remix snapshot;
- chat 13+ approved contacts only;
- report/block и moderation boundary;
- OpenAI Responses API stylist с local under-13 fallback;
- freemium paywall и server entitlement model;
- RU/EN interface baseline;
- Railway staging/production service topology.

## 2. Внешние launch blockers

Эти пункты нельзя честно завершить только кодом без аккаунтов/решений владельца:

1. Apple Developer Team, signing certificate и App Store Connect app record.
2. Финальный bundle identifier после name/trademark check.
3. StoreKit products, agreements, banking/tax и server notification secret.
4. OpenAI organization/key; zero data retention approval до обработки персональных данных under-13.
5. Production object storage/CDN и retention policy.
6. Weather provider и privacy-safe location UX.
7. Human moderation queue, support contact и incident on-call.
8. Privacy policy, Terms, child notice, DPIA и legal review по launch regions.
9. App icon, screenshots, subtitle/keywords и localized store metadata.
10. Реальные pilot users, TestFlight и accessibility/device matrix QA.

## 3. App Store positioning

Primary category: Lifestyle. Secondary: Social Networking после включения 13+ social capabilities.

Не использовать в metadata “For Kids/Для детей”, если приложение не подаётся в Kids Category. Apple резервирует такую формулировку за Kids Category: [App Review Guidelines 1.3](https://developer.apple.com/app-store/review/guidelines/).

Social media capabilities disabled under 13; Declared Age Range API — launch requirement. У приложения с UGC должны быть filtering, report, block и contact info: [App Review Guidelines 1.2](https://developer.apple.com/app-store/review/guidelines/).

## 4. Definition of done для TestFlight

- onboarding → first look ≤4 minutes on clean install;
- session survives reinstall/recovery strategy is documented;
- camera/photo permissions only appear at point of use;
- cutout P95 ≤12s and failure offers manual crop;
- AI always has timeout, retry and local fallback;
- feed never leaks PRIVATE/CIRCLE post;
- age downgrade/upgrades recompute permissions;
- no under-13 public feed or DM;
- report/block verified end-to-end;
- account deletion removes user, sessions, social graph, posts and media;
- subscription purchase/restore/refund verified in sandbox;
- VoiceOver, Dynamic Type, contrast and Reduce Motion pass;
- iPhone SE through current Pro Max, poor network and offline tests;
- privacy nutrition labels match actual SDK/network behavior;
- App Review notes include demo account and moderation explanation.

## 5. Release stages

1. Internal simulator/device QA.
2. TestFlight internal: 10–20 testers.
3. Closed teen + parent pilot with consent and moderated content.
4. One-country soft launch.
5. English/Spanish expansion only after safety/retention gates.

## 6. Kill switches

Server flags must independently disable:

- public discovery;
- comments;
- DM;
- media publishing;
- OpenAI stylist;
- try-on;
- commerce;
- region/age cohort.

Если moderation SLA нарушен, public discovery/comments/DM выключаются без нового App Store build.
