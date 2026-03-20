
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

## Cau hinh backend

Tao file `application.yml` trong `apps/api-server/src/main/resources` voi noi dung mau:

```yml
server:
  port: 8080
  servlet:
    context-path: /<your-database-name>/api

spring:
  datasource:
    url: "jdbc:mysql://localhost:3306/<your-database-name>"
    username: <your-username>
    password: <your-password>
  jpa:
    hibernate:
      ddl-auto: update
    show-sql: true
  servlet:
    multipart:
      max-file-size: 50MB
      max-request-size: 50MB

jwt:
  signerKey: <your-secret-key>

springdoc:
  swagger-ui:
    path: /swagger
  api-docs:
    path: /api-docs
```

Tai lieu yeu cau hien duoc dat trong `docs/requirements`.
