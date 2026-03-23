# Admin POI Contract

## Muc tieu
- Quan ly POI (quan an) voi du lieu day du de sinh audio va kiem duyet AI.
- Ho tro mo rong QR unique cho moi POI.
- Ho tro kiem duyet theo field (quay, mon an, mo ta) de bat tu nhay cam.

## Database Schema (core)

### `poi`
- `id` (PK)
- `shop_id` (int, bat buoc)
- `name` (ten quan)
- `description` (text mo ta quan)
- `address`
- `lat`, `lng`
- `region`
- `category`
- `owner_id`
- `owner_name` (ho ten chu cua hang)
- `cover_image`
- `qr_code` (unique, nullable)
- `risk_flag`
- `risk_score`
- `rejection_reason`
- `status` (`DRAFT | PUBLISHED | FLAGGED | HIDDEN`)
- `created_at`, `updated_at`

### `poi_menu_item`
- `id` (PK)
- `poi_id` (FK -> poi.id)
- `name`
- `description_text`
- `price`
- `is_signature`
- `image_url`
- `audio_script_text` (text dau vao TTS)
- `risk_score`
- `risk_flags`
- `status`
- `created_at`, `updated_at`

### `poi_moderation_log`
- `id` (PK)
- `poi_id` (FK -> poi.id)
- `menu_item_id` (nullable)
- `field_name` (vd: `poi.description_text`, `menu_item.description_text`)
- `text_snapshot`
- `risk_score`
- `labels`
- `matched_terms`
- `suggested_rewrite`
- `model_version`
- `status` (`REVIEW_REQUIRED | APPROVED | REJECTED | FALSE_POSITIVE`)
- `reviewed_by`, `reviewed_at`
- `created_at`

## API Endpoints

### 1) Danh sach POI
`GET /admin/pois?page=1&size=10&search=&status=&region=&hasFlag=`

Response `result`:
- `PagingDto<PoiResponse>`

### 2) Chi tiet POI co day du thuoc tinh
`GET /admin/pois/{id}/detail`

Response `result`:
```json
{
  "poi": {
    "id": 1,
    "shopId": 1,
    "name": "Oc Dao Vinh Khanh",
    "description": "Quan oc noi tieng...",
    "address": "15 Vinh Khanh...",
    "lat": 10.7607194,
    "lng": 106.7007169,
    "region": "Q4",
    "category": "SEAFOOD",
    "ownerId": 2,
    "ownerName": "Nguyen Van An",
    "coverImage": "shop1.jpg",
    "qrCode": "QR-POI-0001",
    "riskFlag": false,
    "riskScore": 5,
    "rejectionReason": null,
    "status": "PUBLISHED",
    "createdAt": "2026-03-01T08:00:00",
    "updatedAt": "2026-03-20T10:00:00"
  },
  "menuItems": [
    {
      "id": 1,
      "name": "Oc huong rang muoi",
      "descriptionText": "Oc huong tuoi rang muoi ot",
      "price": 90000,
      "isSignature": true,
      "imageUrl": "dish1.jpg",
      "audioScriptText": "Mon dac san cua quan...",
      "riskScore": 5,
      "riskFlags": null,
      "status": "ACTIVE",
      "createdAt": "2026-03-01T08:00:00",
      "updatedAt": "2026-03-20T10:00:00"
    }
  ],
  "moderationLogs": [
    {
      "id": 2,
      "menuItemId": 3,
      "fieldName": "menu_item.description_text",
      "textSnapshot": "Noi dung mo ta mon co tu nhay cam",
      "riskScore": 62,
      "labels": "abusive",
      "matchedTerms": "tuc",
      "suggestedRewrite": "Viet lai mo ta trung tinh hon",
      "modelVersion": "moderation-v1",
      "status": "REVIEW_REQUIRED",
      "reviewedBy": null,
      "reviewedAt": null,
      "createdAt": "2026-03-20T09:05:00"
    }
  ],
  "approvalHistory": [
    {
      "id": 1,
      "shopId": 3,
      "poiId": 3,
      "status": "pending",
      "submittedAt": "2026-03-17T09:10:00",
      "reviewer": null,
      "reviewedAt": null,
      "reason": null
    }
  ]
}
```

### 3) CRUD menu item
- `GET /admin/pois/{id}/menu-items`
- `POST /admin/pois/{id}/menu-items`
- `PUT /admin/pois/{id}/menu-items/{itemId}`

Request body (create/update):
```json
{
  "name": "Bun cha dac biet",
  "descriptionText": "Bun cha than hoa an kem rau song",
  "price": 65000,
  "isSignature": true,
  "imageUrl": "bun-cha.jpg",
  "audioScriptText": "Mon bun cha dac biet cua quan..."
}
```

## Ghi chu mo rong
- QR code da co field unique `qr_code`, co the tao tu dong khi `PUBLISHED`.
- AI moderation co the chay theo batch theo tung field va luu vao `poi_moderation_log`.
- Admin co the duyet/override tung ket qua moderation ma khong mat lich su.
