const { readDB, writeDB } = require("../db");

/**
 * Sinh nội dung chuyển khoản duy nhất cho 1 hóa đơn, dùng để đối soát tự động.
 * VD: "MH P1HP0926" (prefix + mã phụ huynh rút gọn + mã hóa đơn rút gọn)
 */
function buildTransferContent(prefix, parentId, invoiceId) {
  const p = (prefix || "MH").toUpperCase().replace(/[^A-Z0-9]/g, "");
  const shortParent = parentId.replace(/[^a-zA-Z0-9]/g, "").slice(-4).toUpperCase();
  const shortInvoice = invoiceId.replace(/[^a-zA-Z0-9]/g, "").slice(-6).toUpperCase();
  return `${p} ${shortParent}${shortInvoice}`;
}

function normalize(str) {
  return (str || "")
    .toString()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

/**
 * Tìm hóa đơn (đang "unpaid") có transferContent khớp với nội dung giao dịch ngân hàng,
 * đồng thời số tiền phải khớp. Trả về { parentId, invoice } hoặc null nếu không tìm thấy.
 */
function matchInvoiceByTransaction(db, { content, amount }) {
  const normalizedContent = normalize(content);
  const numericAmount = Number(amount) || 0;

  for (const parentId of Object.keys(db.invoices || {})) {
    const list = db.invoices[parentId] || [];
    for (const inv of list) {
      if (inv.status === "paid") continue; // "unpaid" hoặc "pending" (chờ duyệt) đều được đối soát tự động
      const code = normalize(inv.transferContent);
      if (!code) continue;
      if (normalizedContent.includes(code) && Math.round(inv.amount) === Math.round(numericAmount)) {
        return { parentId, invoice: inv };
      }
    }
  }
  return null;
}

/**
 * Đánh dấu 1 hóa đơn là đã thanh toán (dùng chung cho cả webhook SePay và cron TheAPIBank),
 * đồng thời tạo thông báo gửi tới phụ huynh. Trả về hóa đơn đã cập nhật hoặc null.
 */
function markInvoicePaidFromTransaction({ content, amount, methodLabel, transactionRef }) {
  const db = readDB();
  const match = matchInvoiceByTransaction(db, { content, amount });
  if (!match) return null;

  const { parentId, invoice } = match;
  const paidAt = new Date().toLocaleDateString("vi-VN");

  db.invoices[parentId] = (db.invoices[parentId] || []).map((inv) =>
    inv.id === invoice.id
      ? {
          ...inv,
          status: "paid",
          method: methodLabel || "Chuyển khoản ngân hàng (tự động)",
          paidAt,
          transactionRef: transactionRef || undefined,
        }
      : inv
  );

  const notif = {
    id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: "Đóng học phí thành công",
    content: `Hệ thống đã tự động ghi nhận chuyển khoản ${Number(amount).toLocaleString(
      "vi-VN"
    )}đ cho ${invoice.month} (${methodLabel || "chuyển khoản ngân hàng"}).`,
    time: new Date().toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
    }),
    read: false,
    type: "tuition",
  };
  db.notifications[parentId] = [notif, ...(db.notifications[parentId] || [])];

  writeDB(db);
  return { parentId, invoice: db.invoices[parentId].find((i) => i.id === invoice.id) };
}

module.exports = { buildTransferContent, matchInvoiceByTransaction, markInvoicePaidFromTransaction, normalize };
