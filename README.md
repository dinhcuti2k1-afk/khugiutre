# Zalo Mini App — Khu giữ trẻ Moon House

## Đồng bộ dữ liệu & các tính năng mới

Dự án này đi kèm một backend nhỏ ở thư mục [`server/`](./server) đóng vai trò nguồn dữ liệu trung
tâm, giúp phụ huynh & admin luôn thấy cùng một dữ liệu trên mọi thiết bị (thay vì mỗi máy tự lưu
riêng như bản demo cũ). Xem hướng dẫn cài đặt chi tiết trong `server/README.md`.

Các tính năng mới cho Admin:

- **Quản lý phụ huynh** (`/admin/parents`) — thêm phụ huynh mới với SĐT, mật khẩu, tên, **email**,
  **năm sinh của con**, khối lớp.
- **Nhắn tin với phụ huynh** (`/admin/chat`) — tin nhắn thật, đồng bộ qua backend (không còn giả lập).
- **Chở xe cấp 2** (`/admin/carpool`) — duyệt đăng ký chở xe; tính năng này ở phía phụ huynh
  (`/carpool`) **chỉ hiển thị với phụ huynh có con từ lớp 6 trở lên**.
- **Cài đặt thanh toán** (`/admin/settings`) — cấu hình cổng chuyển khoản ngân hàng **SePay** (có
  webhook, tự tạo nội dung chuyển khoản riêng cho từng hóa đơn) hoặc **TheAPIBank** (cần chạy cron
  job quét giao dịch định kỳ — xem `server/src/cron/`). File cron được đặt sẵn để dự phòng dù bạn
  chọn nhà cung cấp nào.

Nhớ cấu hình `VITE_API_BASE_URL` trong file `.env` ở thư mục gốc để trỏ tới backend (mặc định
`http://localhost:4000/api` khi chạy local).

## Development

### Using Zalo Mini App Extension

1. Install [Visual Studio Code](https://code.visualstudio.com/download) and [Zalo Mini App Extension](https://mini.zalo.me/docs/dev-tools).
1. In the **Home** tab, process **Config App ID** and **Install Dependencies**.
1. Navigate to the **Run** tab, select the suitable launcher, and click **Start**.

### Using Zalo Mini App CLI

1. [Install Node JS](https://nodejs.org/en/download/).
1. [Install Zalo Mini App CLI](https://mini.zalo.me/docs/dev-tools/cli/intro/).
1. **Install dependencies**:
   ```bash
   npm install
   ```
1. **Start** the dev server:
   ```bash
   zmp start
   ```
1. **Open** `localhost:3000` in your browser.

## Deployment

1. **Create** a mini program. For instructions on how to create a mini program, please refer to the [Coffee Shop Tutorial](https://mini.zalo.me/tutorial/coffee-shop/step-1/)

1. **Deploy** your mini program to Zalo using the mini app ID created.

   - **Using Zalo Mini App Extension**: navigate to the **Deploy** panel > **Login** > **Deploy**.
   - **Using Zalo Mini App CLI**:
     ```bash
     zmp login
     zmp deploy
     ```

1. Open the mini app in Zalo by scanning the QR code.

## Resources

- [Zalo Mini App Official Website](https://mini.zalo.me/)
- [ZaUI Documentation](https://mini.zalo.me/documents/zaui/)
- [ZMP SDK Documentation](https://mini.zalo.me/documents/api/)
- [DevTools Documentation](https://mini.zalo.me/docs/dev-tools/)
- [Ready-made Mini App Templates](https://mini.zalo.me/zaui-templates)
- [Community Support](https://mini.zalo.me/community)
