# Google Maps Shop Collection

Script này dùng Google Places API để tổng hợp danh sách quán theo các nhóm:

- ốc
- hải sản
- thịt nướng
- phở (bún)
- cơm
- lẩu
- nước giải khát

## 1) Chuẩn bị API key

Tạo API key Google Maps/Places và set biến môi trường:

```powershell
$env:GOOGLE_MAPS_API_KEY="YOUR_KEY"
```

## 2) Chạy lệnh

Từ root repo:

```bash
npm run collect:shops:google
```

Ví dụ chỉ định khu vực + bán kính:

```bash
npm run collect:shops:google -- --area "Quận 4, TP.HCM" --lat 10.7612 --lng 106.7033 --radius 3000
```

## 3) Output

Mặc định script sẽ tạo:

- `database/seeds/generated/google-maps-shops.json`
- `database/seeds/generated/google-maps-shops.csv`

Mỗi quán có các trường:

- tên quán
- tọa độ (lat/lng)
- địa chỉ
- loại quán
- số điện thoại
- link Google Maps

## 4) Tùy chọn chính

- `--max-per-query <number>`: số kết quả tối đa mỗi truy vấn
- `--out-json <path>`: đổi đường dẫn JSON
- `--out-csv <path>`: đổi đường dẫn CSV
- `--skip-phone-enrich`: bỏ bước gọi place detail để lấy thêm số điện thoại
