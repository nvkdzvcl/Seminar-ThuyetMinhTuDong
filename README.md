
# Seminar Thuyet Minh Tu Dong

Repo nay da duoc sap xep lai theo huong monorepo de tach ro 3 portal chinh va backend dung chung.

## Cau truc chinh

```txt
apps/
  admin-web/        Trang quan tri
  customer-web/     Trang nguoi dung
  shopowner-web/    Trang chu quan
  api-server/       Spring Boot backend

packages/
  api-sdk/
  auth-core/
  shared-types/
  shared-ui/
  utils/
  config/

database/
  schema/
  migrations/
  seeds/
  docs/

docs/
  architecture/
  requirements/
```

## Chay tung phan

```bash
npm run dev:admin
npm run dev:customer
npm run dev:shopowner
npm run dev:api
```

Backend co the chay truc tiep bang Maven:

```bash
# Tu repo root
mvn -f apps/api-server/pom.xml -DskipTests spring-boot:run

# Hoac neu dang o apps/api-server
mvn -DskipTests spring-boot:run
```

## Cau hinh backend

File chinh la `apps/api-server/src/main/resources/application.yaml`.
Backend mac dinh:

- port: `8080`
- context path: `/vinhkhanhfoodtour/api`

## Azure narration (shop audio TTS)

Backend narration endpoint (`/shop/{id}/narration`) can cau hinh Azure Translator + Speech.
Khong nen hard-code key vao `application.yaml`.

1. Tao file local env:

```bash
cp apps/api-server/.env.example apps/api-server/.env
```

2. Dien du cac bien trong `apps/api-server/.env`:

- `AZURE_TRANSLATOR_KEY`
- `AZURE_TRANSLATOR_REGION`
- `AZURE_TRANSLATOR_ENDPOINT`
- `AZURE_SPEECH_KEY`
- `AZURE_SPEECH_REGION`
- `AZURE_SPEECH_TTS_ENDPOINT`

## POI moderation by AI (Content Safety + Qwen/Ollama)

Backend POI flow (`create`, `update`, `submit`) can tu dong moderation:

- Layer 1: Azure AI Content Safety (text safety score)
- Layer 2: local LLM qua Ollama (Qwen semantic check)

Them cac bien sau vao `apps/api-server/.env`:

- `AZURE_CONTENT_SAFETY_KEY`
- `AZURE_CONTENT_SAFETY_ENDPOINT`
- `AZURE_CONTENT_SAFETY_API_VERSION` (default `2024-09-01`)
- `POI_MODERATION_ENABLED` (`true/false`)
- `LLM_PROVIDER` (default `ollama`)
- `OLLAMA_BASE_URL` (default `http://localhost:11434`)
- `OLLAMA_MODEL` (vi du `qwen3:4b`)
- `OLLAMA_TIMEOUT_MS`
- `OLLAMA_THINK`

Neu chua cau hinh du, backend van chay theo fallback heuristic va khong crash luong tao POI.

### Khong co Ollama/Qwen van chay duoc khong?

Co. Tren may khong cai Ollama/Qwen, du an van chay binh thuong.

- Khuyen nghi set:
  - `LLM_PROVIDER=disabled`
- Khi do moderation van hoat dong theo:
  - Heuristic (bat buoc)
  - Azure Content Safety (neu da cau hinh key)
- Nghia la tinh nang duyet noi dung mo ta POI van dung duoc, chi giam do "hieu ngu canh" so voi khi co LLM local.

### Customer map POI visibility

- Customer web chi hien thi POI da duoc duyet (`PUBLISHED`).
- Cac POI `DRAFT`, `FLAGGED`, `HIDDEN` khong duoc len ban do customer.

`application.yaml` da duoc cau hinh de tu dong nap `.env` tu:

- `./.env`
- `./apps/api-server/.env`

## Troubleshooting nhanh

- `Port 8080 is already in use`:

```bash
# CMD
for /f "tokens=5" %p in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /F /PID %p
```

- `GET /shop/{id}/narration` tra `500` voi code `AZURE_CONFIG_MISSING`:
  - Kiem tra `apps/api-server/.env` da co du 6 bien
  - Restart backend sau khi cap nhat env

Tai lieu yeu cau hien duoc dat trong `docs/requirements`.
