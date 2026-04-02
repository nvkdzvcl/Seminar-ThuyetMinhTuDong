# AGENTS.md

Purpose: this file is the "cold-start handbook" for any AI model (Gemini, Opus, GPT, etc.) that joins this repo without chat history.
Goal: make safe, context-aware changes without breaking architecture, UI, or API contracts.

## 1) Repo Snapshot (Read First)

Monorepo:

```txt
apps/
  admin-web/
  customer-web/
  shopowner-web/
  api-server/
packages/
  api-sdk/
  auth-core/
  shared-types/
  shared-ui/
  utils/
  config/
```

Current active workstream (high priority): `apps/shopowner-web` + `apps/api-server`.

## 2) Mandatory First-Read Files

Before coding, read these files first:

1. `README.md` (root run commands and architecture)
2. `apps/shopowner-web/src/App.tsx` (auth/session bootstrap)
3. `apps/shopowner-web/src/components/app-shell.tsx` (screen orchestration)
4. `apps/shopowner-web/src/lib/api.ts` (base URL + response envelope)
5. `apps/shopowner-web/src/services/*.ts` (frontend API contracts)
6. `apps/shopowner-web/src/components/screens/shop-profile-screen.tsx` (critical responsive + coordinate UI)
7. `apps/shopowner-web/src/lib/coordinates.ts` (flexible coordinate parser on FE)
8. `apps/api-server/src/main/resources/application.yaml` (port + context-path)
9. `apps/api-server/src/main/java/com/audioguide/configuration/security/SecurityConfig.java` (CORS + auth)
10. `apps/api-server/src/main/java/com/audioguide/service/ShopService.java` + DTOs in `dto/shopDTO` (shop create/update contract)
11. `apps/api-server/src/main/java/com/audioguide/utils/CoordinateParserUtil.java` (flexible coordinate parser on BE)
12. `apps/api-server/src/main/java/com/audioguide/service/ShopNarrationService.java` (Azure translate + TTS flow)
13. `apps/api-server/.env.example` (required Azure env keys for narration)
14. `apps/api-server/src/main/java/com/audioguide/service/PoiModerationService.java` (heuristic + Content Safety + optional Ollama moderation)
15. `apps/customer-web/src/hooks/usePoiMapData.ts` (customer map POI data source and status filter)

## 3) Runtime Contracts (Do Not Break)

### 3.1 API Base URL and Context Path

- Backend runs on `http://localhost:8080`.
- Context path is `/vinhkhanhfoodtour/api`.
- Backend cloud config can override these via env:
  - `PORT`
  - `SERVER_SERVLET_CONTEXT_PATH`
- Shopowner FE default API base (`apps/shopowner-web/src/lib/api.ts`):
  - `VITE_API_BASE_URL` env var OR
  - fallback: `http://localhost:8080/vinhkhanhfoodtour/api`

If you change context path, you must update FE base URL and verify all endpoints.

### 3.2 Response Envelope

Frontend `apiFetch` expects:

```ts
type ApiResponse<T> = {
  code: string
  message?: string
  result: T
}
```

Do not return raw payload from backend endpoints consumed by this FE unless FE adapter is updated.

### 3.3 Auth Session Keys

Do not rename these localStorage keys without migration:

- `owner_access_token`
- `owner_refresh_token`

Defined in `apps/shopowner-web/src/lib/auth.ts`.

### 3.4 CORS Rules

`SecurityConfig` currently reads allowed origins from:

- `app.cors.allowed-origin-patterns`
- env override: `APP_CORS_ALLOWED_ORIGIN_PATTERNS`

Default patterns include:

- `http://localhost:5173`
- `http://localhost:5174`
- `http://localhost:5175`
- `http://localhost:3000`
- `https://*.devtunnels.ms`
- `https://*.vercel.app`

Allowed methods must include:

- `GET, POST, PUT, PATCH, DELETE, OPTIONS`

If FE uses `PATCH` and CORS omits `PATCH`, preflight fails.

### 3.5 Azure Narration Config (Customer QR Audio)

- Narration endpoint: `GET /shop/{shopId}/narration?lang=<locale>`.
- Backend reads Azure secrets from env vars (via `application.yaml` placeholders).
- `application.yaml` also imports optional local env files:
  - `./.env`
  - `./apps/api-server/.env`
- Required env keys:
  - `AZURE_TRANSLATOR_KEY`
  - `AZURE_TRANSLATOR_REGION`
  - `AZURE_TRANSLATOR_ENDPOINT`
  - `AZURE_SPEECH_KEY`
  - `AZURE_SPEECH_REGION`
  - `AZURE_SPEECH_TTS_ENDPOINT`
- If missing, API returns `AZURE_CONFIG_MISSING` (HTTP 500).

### 3.6 POI Moderation Config (LLM Optional)

- POI moderation pipeline supports 3 layers:
  - Heuristic (always available)
  - Azure Content Safety (optional via env keys)
  - Ollama/Qwen LLM (optional)
- Project must still run on machines without Ollama/Qwen.
- If local machine does not have Ollama, set:
  - `LLM_PROVIDER=disabled`
- With `LLM_PROVIDER=disabled`, moderation still works via heuristic (+ Content Safety if configured), and backend must not fail startup.
- If `LLM_PROVIDER=ollama` but Ollama is unreachable, moderation may be slower due to timeout but flow should not crash.

### 3.7 Customer POI Visibility Contract

- Customer map screens must show only approved POIs (`status = PUBLISHED`).
- Draft/flagged/hidden POIs must not appear on customer map.

### 3.8 Cloud Deployment Contract

- Backend is expected to run on Railway.
- Frontends are expected to run on Vercel.
- `apps/api-server/src/main/resources/application.yaml` is intentionally tracked now and must stay deployable via env placeholders.
- Do not move secrets back into committed YAML.

Railway backend minimum env:

- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_JPA_HIBERNATE_DDL_AUTO`
- `JWT_SIGNERKEY`
- `FILE_UPLOAD_DIR`
- `LLM_PROVIDER`

Frontend env contracts:

- `admin-web`
  - `VITE_API_BASE_URL`
  - `VITE_CUSTOMER_WEB_URL`
- `shopowner-web`
  - `VITE_API_BASE_URL`
  - `VITE_CUSTOMER_WEB_URL`
- `customer-web`
  - `VITE_BACKEND_API`
  - `VITE_DISH_IMAGE_API`
  - `VITE_SHOP_IMAGE_API`
  - `VITE_WS_API`
  - `VITE_LS_ACCESS`

## 4) Product Behavior Baseline (Shopowner)

### 4.1 Screen System

`AppShell` drives app navigation by internal screen state (not route-per-page). Respect existing `Screen` and `Tab` types before refactor.

### 4.2 Login/Register Expectations

- Login is real (`/auth/login`).
- Register tab in `login-screen.tsx` is mostly placeholder UX text now.
- Seed owner account exists in backend init:
  - email: `owner@gmail.com`
  - password: `owner`

### 4.3 Shop Profile + Responsive

Shop profile has dual layout:

- mobile section: `md:hidden`
- desktop section: `hidden md:block`

Do not force desktop content into narrow mobile container.
Known issue fixed: desktop header breaks if parent wrapper is hard-limited with `max-w-md`.

### 4.4 Coordinates (Critical)

System must accept both input styles:

- DMS: `10°46'42.0"N 106°39'47.8"E`
- Decimal: `10.761486715909173, 106.68095304761832`

Rules:

- Store/use decimal `lat` and `lng`.
- Validate ranges:
  - lat: `[-90, 90]`
  - lng: `[-180, 180]`
- FE parser: `apps/shopowner-web/src/lib/coordinates.ts`
- BE parser: `apps/api-server/src/main/java/com/audioguide/utils/CoordinateParserUtil.java`
- In BE shop service, `coordinateRaw` takes precedence when provided.

## 5) Non-Negotiable Guardrails

1. Do not use destructive git commands (`reset --hard`, `checkout --`) unless explicitly requested.
2. Do not modify unrelated apps (`admin-web`, `customer-web`) for a `shopowner` task.
3. Do not silently swallow backend validation errors; return clear messages.
4. Do not create invalid DOM nesting (example: `button` inside `button`).
5. Do not break mobile-first behavior when adding desktop features.
6. Do not rename request/response fields without syncing FE + BE in same change.
7. Do not commit real secrets (JWT signer keys, DB passwords, Azure keys) in new files.
8. Never commit `apps/api-server/.env`; keep it local-only.
9. Do not re-ignore `apps/api-server/src/main/resources/application.yaml`; cloud deploy depends on it.

## 6) Safe Change Workflow For Any Agent

1. Reproduce issue first (or identify target behavior if feature work).
2. Find root cause in code, not only symptom logs.
3. Make minimal scoped edits.
4. Run relevant builds/checks.
5. Report exact files changed + verification evidence.

## 7) Required Verification Commands

From repo root:

```bash
npm run build:shopowner
mvn -f apps/api-server/pom.xml -DskipTests compile
```

When touching narration/Azure flow, verify endpoint behavior:

```bash
curl -i "http://localhost:8080/vinhkhanhfoodtour/api/shop/8/narration?lang=vi-VN"
```

Expected:
- `200` with `result.audioUrl`, or
- explicit app error code (for example `AZURE_CONFIG_MISSING`) instead of generic uncategorized error.

When touching CORS/security, verify preflight manually:

```bash
curl -i -X OPTIONS "http://localhost:8080/vinhkhanhfoodtour/api/shop/me" \
  -H "Origin: http://localhost:5175" \
  -H "Access-Control-Request-Method: PATCH" \
  -H "Access-Control-Request-Headers: authorization,content-type"
```

Expected: `200` and `Access-Control-Allow-Origin` + `Access-Control-Allow-Methods` containing `PATCH`.

## 8) UI/Design System Notes

- FE stack: React + TypeScript + Vite + Tailwind v4 + custom UI components in `components/ui`.
- Typography tokens and theme live in `apps/shopowner-web/src/index.css` (`Be Vietnam Pro` is configured).
- Keep visual style consistent with existing cards/buttons/badges.
- Any new desktop layout must still be tested at:
  - mobile (<768)
  - tablet (~768-1024)
  - desktop (>1024)

## 9) Backend Notes

- Java target in Maven is 17. Running with newer JDK is possible, but compilation target remains 17.
- Security uses JWT resource server (`SecurityConfig` + `CustomJwtDecoder`).
- Shop endpoints of interest:
  - `POST /shop/create`
  - `GET /shop/me`
  - `PATCH /shop/me`
  - `GET /shop/types`

## 10) Definition of Done

A task is done only when:

1. Behavior works locally.
2. Relevant builds pass.
3. No new console/runtime errors (CORS, hydration, DOM nesting, API mismatch).
4. Responsive behavior checked.
5. Change summary includes:
   - what changed
   - why
   - how to verify

## 11) Commit Message Convention

```txt
<type>(<scope>): <summary>
```

Examples:

- `fix(shopowner): prevent desktop header collapse in shop profile`
- `fix(api): include PATCH in CORS allowed methods`
- `feat(shop): support DMS and decimal coordinate parsing`

Allowed types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`.

## 12) Agent Prompt Template (Recommended)

Use this when asking any external model:

```txt
You are working in a monorepo. Read AGENTS.md first and follow it strictly.
Task: <your task>
Constraints:
- Keep changes minimal and scoped.
- Do not break API contracts or responsive layouts.
- Run build checks for touched modules.
Output format:
1) Root cause
2) Files changed
3) Verification commands and results
4) Risks/next steps
```
