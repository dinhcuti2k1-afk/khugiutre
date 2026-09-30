# Moon House Server (Backend đồng bộ dữ liệu)

Backend nhỏ gọn (Express) dùng làm **nguồn dữ liệu trung tâm** để phụ huynh & admin thấy cùng một
dữ liệu, đồng bộ theo thời gian thực (polling) trên mọi thiết bị — thay vì mỗi máy lưu riêng trong
`localStorage` như bản demo cũ.

## Cài đặt

```bash
cd server
cp .env.example .env   # rồi chỉnh lại giá trị cho phù hợp
npm install
npm start               # chạy tại http://localhost:4000
```

Dữ liệu được lưu trong file `server/data/db.json` (tự tạo ở lần chạy đầu tiên với dữ liệu demo).

## Kết nối Mini App (frontend) vào server

Trong file `.env` ở thư mục gốc Mini App, thêm:

```
VITE_API_BASE_URL=https://domain-server-cua-ban/api
```

Khi phát triển local có thể dùng `http://localhost:4000/api`.

## Các nhóm API chính

- `POST /api/auth/login` — đăng nhập
- `GET /api/bootstrap` — lấy **toàn bộ** trạng thái ứng dụng (Mini App gọi định kỳ mỗi vài giây để đồng bộ)
- `GET/POST/PUT /api/users` — danh sách & thêm/sửa phụ huynh (Admin > Thêm phụ huynh: sđt, mật khẩu, tên, tên bé, lớp, **email**, **năm sinh của con**, **khối lớp** để xét quyền Chở xe cấp 2)
- `POST/PATCH /api/invoices/...` — hóa đơn học phí
- `POST/PATCH /api/schedules/...` — thời khóa biểu
- `POST/PATCH /api/notifications/...` — thông báo
- `POST /api/messages` — nhắn tin phụ huynh ⇄ admin
- `PUT /api/mealplan`, `POST /api/foodnotes` — thực đơn
- `POST/PATCH /api/carpool` — đăng ký **Chở xe cấp 2** (chỉ hiện với phụ huynh có `grade >= 6`)
- `PUT /api/settings/payment` — Admin cấu hình cổng thanh toán (SePay hoặc TheAPIBank)
- `POST /api/payments/sepay/webhook` — SePay gọi về khi có giao dịch, tự đối soát theo nội dung chuyển khoản
- `POST /api/payments/thueapibank/mark-paid` — endpoint nội bộ, cron job TheAPIBank gọi vào khi khớp được giao dịch

## Cấu hình cổng thanh toán (trang Admin > Cài đặt)

### SePay (khuyên dùng — có webhook, không cần cron)
1. Trong trang Admin > Cài đặt, chọn nhà cung cấp **SePay**, nhập số tài khoản/ngân hàng và
   **Webhook token** (đặt tuỳ ý, dùng để xác thực webhook).
2. Vào trang quản trị SePay > Cấu hình Webhook, trỏ về:
   `https://domain-server-cua-ban/api/payments/sepay/webhook`
   Header xác thực: `Authorization: Apikey <webhook-token-vừa-đặt>`
3. Mỗi hóa đơn được hệ thống tự sinh sẵn **nội dung chuyển khoản riêng** (`transferContent`,
   VD: `MH P1HP0926`) — phụ huynh chỉ cần chuyển đúng nội dung này (SePay gợi ý nội dung tự động),
   hệ thống sẽ tự đối soát số tiền + nội dung và đánh dấu **đã thanh toán** ngay khi có webhook.

### TheAPIBank (hoặc dịch vụ "thuê API ngân hàng" khác — không có webhook, cần cron job quét định kỳ)
1. Trong trang Admin > Cài đặt, chọn nhà cung cấp **TheAPIBank**, nhập `API Base URL`, `API Token`
   và số phút quét (`cronIntervalMinutes`, mặc định 5 phút).
2. Chạy cron job (chọn 1 trong 2 cách):
   - **Cách A (khuyên dùng)** — tiến trình nền tự lên lịch bằng `node-cron`:
     ```bash
     npm run cron:thueapibank
     # hoặc chạy nền lâu dài bằng pm2:
     pm2 start src/cron/thueapibank-sync.js --name moon-house-thueapibank-cron
     ```
   - **Cách B** — dùng crontab hệ thống, xem file mẫu `crontab.example`:
     ```bash
     npm run cron:thueapibank:once   # test thử 1 lần
     crontab -e                       # rồi dán dòng trong crontab.example
     ```
3. ⚠️ TheAPIBank không có một chuẩn API cố định — file `src/cron/thueapibank-client.js` viết sẵn
   khung sườn (GET danh sách giao dịch, Bearer token). Khi có tài liệu API thật từ nhà cung cấp bạn
   thuê, chỉ cần chỉnh lại phần gọi request/parse dữ liệu trong file đó.

Dù chọn nhà cung cấp nào, 2 file cron (`thueapibank-sync.js`, `poll-once.js`) vẫn luôn được đặt sẵn
trong dự án để dự phòng, không bắt buộc phải chạy nếu bạn đang dùng SePay.
