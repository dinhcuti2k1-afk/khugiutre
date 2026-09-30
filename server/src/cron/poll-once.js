require("dotenv").config();
const { fetchRecentTransactions } = require("./thueapibank-client");
const { markInvoicePaidFromTransaction } = require("../lib/payment");
const { readDB } = require("../db");

async function runOnce() {
  const db = readDB();
  if (db.paymentSettings?.provider !== "thueapibank") {
    console.log("[thueapibank cron] Cổng thanh toán hiện tại không phải TheAPIBank, bỏ qua.");
    return;
  }

  try {
    const transactions = await fetchRecentTransactions({ sinceMinutes: 15 });
    console.log(`[thueapibank cron] Tìm thấy ${transactions.length} giao dịch tiền vào gần đây.`);

    for (const tx of transactions) {
      const result = markInvoicePaidFromTransaction({
        content: tx.content,
        amount: tx.amount,
        methodLabel: "Chuyển khoản qua TheAPIBank (tự động - cron)",
        transactionRef: tx.transactionRef,
      });
      if (result) {
        console.log(`  ✅ Khớp hóa đơn ${result.invoice.id} (${result.parentId}) — đã đánh dấu đã thanh toán.`);
      }
    }
  } catch (err) {
    console.error("[thueapibank cron] Lỗi khi quét giao dịch:", err.message);
  }
}

// Cho phép chạy trực tiếp: `node src/cron/poll-once.js`
if (require.main === module) {
  runOnce().then(() => process.exit(0));
}

module.exports = { runOnce };
