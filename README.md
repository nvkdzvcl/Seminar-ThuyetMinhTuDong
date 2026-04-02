
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

Ban cloud duoc override bang env:

- `PORT`
- `SERVER_SERVLET_CONTEXT_PATH`
- `SPRING_DATASOURCE_URL`
- `SPRING_DATASOURCE_USERNAME`
- `SPRING_DATASOURCE_PASSWORD`
- `SPRING_JPA_HIBERNATE_DDL_AUTO`
- `JWT_SIGNERKEY`
- `FILE_UPLOAD_DIR`

Luu y:

- `application.yaml` cua backend la file config duoc track trong repo.
- Khong dua secret that vao file nay; secret phai di qua env.

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

## Deploy backend len Railway

Khuyen nghi deploy `apps/api-server` len Railway.

Root Directory:

```txt
apps/api-server
```

Build Command:

```txt
mvn clean package -DskipTests
```

Start Command:

```txt
java -Dserver.port=$PORT -jar target/api-server-1.0.0.jar
```

Bien moi truong toi thieu:

```txt
SPRING_DATASOURCE_URL=jdbc:mysql://${{MySQL.MYSQLHOST}}:${{MySQL.MYSQLPORT}}/${{MySQL.MYSQLDATABASE}}?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC
SPRING_DATASOURCE_USERNAME=${{MySQL.MYSQLUSER}}
SPRING_DATASOURCE_PASSWORD=${{MySQL.MYSQLPASSWORD}}
SPRING_JPA_HIBERNATE_DDL_AUTO=update
JWT_SIGNERKEY=<your-jwt-signer-key>
FILE_UPLOAD_DIR=uploads
LLM_PROVIDER=disabled
```

Neu deploy frontend ra Internet, backend can CORS phu hop. Mac dinh backend da allow:

- localhost dev ports
- `https://*.devtunnels.ms`
- `https://*.vercel.app`

Neu dung custom domain frontend, them:

```txt
APP_CORS_ALLOWED_ORIGIN_PATTERNS=https://your-admin-domain,https://your-customer-domain,https://your-shopowner-domain
```

## Deploy frontend len Vercel

Ca 3 frontend deu la Vite app va da co `vercel.json` rewrite SPA san.

### customer-web

Root Directory:

```txt
apps/customer-web
```

Build settings:

```txt
Framework Preset: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

Environment Variables:

```txt
VITE_BACKEND_API=https://<backend-domain>/vinhkhanhfoodtour/api
VITE_DISH_IMAGE_API=https://<backend-domain>/vinhkhanhfoodtour/api/uploads/dish-images/
VITE_SHOP_IMAGE_API=https://<backend-domain>/vinhkhanhfoodtour/api/uploads/shop-images/
VITE_WS_API=wss://<backend-domain>/vinhkhanhfoodtour/api
VITE_LS_ACCESS=VINH_KHANH_FOOD_TOUR_ACCESS_TOKEN
```

### shopowner-web

Root Directory:

```txt
apps/shopowner-web
```

Environment Variables:

```txt
VITE_API_BASE_URL=https://<backend-domain>/vinhkhanhfoodtour/api
VITE_CUSTOMER_WEB_URL=https://<customer-domain>
```

### admin-web

Root Directory:

```txt
apps/admin-web
```

Environment Variables:

```txt
VITE_API_BASE_URL=https://<backend-domain>/vinhkhanhfoodtour/api
VITE_CUSTOMER_WEB_URL=https://<customer-domain>
```

## Troubleshooting nhanh

- `Port 8080 is already in use`:

```bash
# CMD
for /f "tokens=5" %p in ('netstat -aon ^| findstr :8080 ^| findstr LISTENING') do taskkill /F /PID %p
```

- `GET /shop/{id}/narration` tra `500` voi code `AZURE_CONFIG_MISSING`:
  - Kiem tra `apps/api-server/.env` da co du 6 bien
  - Restart backend sau khi cap nhat env
- Railway backend `502` khi vua deploy:
  - Kiem tra `SPRING_DATASOURCE_*`
  - Kiem tra `JWT_SIGNERKEY`
  - Kiem tra `SPRING_JPA_HIBERNATE_DDL_AUTO=update`
- Vercel frontend goi API bi CORS:
  - Kiem tra backend dang dung build moi co `https://*.vercel.app`
  - Neu dung custom domain, set `APP_CORS_ALLOWED_ORIGIN_PATTERNS`

Tai lieu yeu cau hien duoc dat trong `docs/requirements`.
