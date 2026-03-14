

# Các chạy Backend
  
    tạo file appplication.yml trong thư mục src/main/resources với nội dung sau:


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
    signerKey: <your-scret-key>




springdoc:
    swagger-ui:
        path: /swagger
    api-docs:
        path: /api-docs
