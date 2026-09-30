require("dotenv").config();
const cron = require("node-cron");
const { readDB } = require("../db");
const { runOnce } = require("./poll-once");

/**
 * File này CHỈ CẦN CHẠY khi trang Admin > Cài đặt chọn cổng "TheAPIBank" (nhà cung cấp không hỗ
 * trợ webhook, phải chủ động quét giao dịch định kỳ). Nếu dùng "SePay" thì KHÔNG cần chạy file
 * này — SePay sẽ tự gọi webhook về server (xem route POST /api/payments/sepay/webhook).
 * Vẫn để sẵn file này ở đây để dự phòng, phòng khi đổi sang TheAPIBank sau này.
 *
 * Cách chạy:
 *   node src/cron/thueapibank-sync.js
 * hoặc dùng pm2 để chạy nền lâu dài:
 *   pm2 start src/cron/thueapibank-sync.js --name moon-house-thueapibank-cron
 */

function getIntervalMinutes() {
  const db = readDB();
  return Number(db.paymentSettings?.thueapibank?.cronIntervalMinutes) || 5;
}

let task = null;

function scheduleJob() {
  const minutes = Math.max(1, getIntervalMinutes());
  const expr = `*/${minutes} * * * *`;

  if (task) task.stop();
  task = cron.schedule(expr, () => {
    console.log(`[thueapibank cron] Bắt đầu quét lúc ${new Date().toLocaleString("vi-VN")}`);
    runOnce();
  });

  console.log(`[thueapibank cron] Đã lên lịch quét mỗi ${minutes} phút (cron: "${expr}").`);
}

scheduleJob();
// Quét ngay 1 lần khi khởi động tiến trình
runOnce();

// Nếu admin đổi cấu hình interval trong lúc tiến trình đang chạy, kiểm tra lại mỗi 5 phút để
// áp dụng lịch mới (đơn giản, không cần restart tiến trình).
setInterval(() => {
  const minutes = Math.max(1, getIntervalMinutes());
  const currentExpr = `*/${minutes} * * * *`;
  if (task && task._expr !== currentExpr) {
    scheduleJob();
  }
}, 5 * 60 * 1000);
