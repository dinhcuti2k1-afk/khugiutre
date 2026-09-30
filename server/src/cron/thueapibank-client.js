const axios = require("axios");
const { readDB } = require("../db");

/**
 * API thật của ThueAPI (thueapibank.vn) cho nguồn tiền VÍ ZALOPAY:
 *
 *   GET https://thueapibank.vn/historyapizalopay/{token}
 *
 * {token} = giá trị apiToken (ô "ThueAPI API Key / Access Token" trong Admin > Cài đặt).
 *
 * CẤU TRÚC RESPONSE THẬT (khác tài liệu chính thức của ThueAPI, đã xác nhận qua debug):
 *
 * {
 *   "status": "success",
 *   "data": [
 *     { "data": { "transaction": {
 *         "trans_id": "...",
 *         "trans_amount": "2000",
 *         "sign": 1,                // 1 = tiền vào ví, -1 = tiền ra khỏi ví
 *         "status_info": { "status": 1 },
 *         "template_info": {
 *           "custom_fields": [
 *             { "name": "Lời nhắn", "value": "NAP1436558" }   <- mã nội dung chuyển khoản
 *           ]
 *         },
 *         "description": "Nhận tiền từ ..."   // chỉ là câu chung chung, KHÔNG dùng để đối soát
 *     } } },
 *     ...
 *   ]
 * }
 *
 * Chỉ nhận giao dịch NHẬN TIỀN thành công (sign === 1 && status_info.status === 1).
 */

function getConfig() {
  const db = readDB();
  const settings = db.paymentSettings?.thueapibank || {};
  return {
    baseUrl: (settings.apiBaseUrl || process.env.THUEAPIBANK_BASE_URL || "https://thueapibank.vn").replace(/\/$/, ""),
    apiToken: settings.apiToken || process.env.THUEAPIBANK_API_TOKEN || "",
    intervalMinutes:
      Number(settings.cronIntervalMinutes) ||
      Number(process.env.THUEAPIBANK_CRON_INTERVAL_MINUTES) ||
      5,
  };
}

/**
 * Đọc nội dung chuyển khoản + số tiền từ 1 giao dịch thô của Zalopay.
 * Trả về null nếu giao dịch không phải "tiền vào thành công" (để chỗ gọi bỏ qua).
 */
function mapTransaction(tx) {
  const sign = tx?.sign;
  const status = tx?.status_info?.status;

  if (sign !== null && sign !== undefined && Number(sign) !== 1) return null; // tiền ra, bỏ qua
  if (status !== null && status !== undefined && Number(status) !== 1) return null; // chưa thành công

  // Mã nội dung chuyển khoản nằm trong template_info.custom_fields, field tên "Lời nhắn"
  let content = "";
  const customFields = tx?.template_info?.custom_fields;
  if (Array.isArray(customFields)) {
    const field = customFields.find((f) => f?.name === "Lời nhắn");
    if (field) content = String(field.value ?? "").trim();
  }
  // Dự phòng nếu không có field "Lời nhắn"
  if (!content) content = String(tx?.description ?? "").trim();

  const amount = Number(String(tx?.trans_amount ?? "0").replace(/[^0-9.-]/g, "")) || 0;

  return {
    content,
    amount,
    transactionRef: tx?.trans_id ?? undefined,
    type: "in",
  };
}

/**
 * Lấy danh sách giao dịch "tiền vào" gần đây từ ThueAPI (historyapizalopay).
 * Trả về mảng [{content, amount, transactionRef}].
 * (Tham số sinceMinutes được giữ lại để không phải sửa nơi gọi, nhưng API này không hỗ trợ lọc
 * theo thời gian — việc quét trùng giao dịch cũ không sao vì markInvoicePaidFromTransaction chỉ
 * khớp hóa đơn đang ở trạng thái "unpaid", hóa đơn đã "paid" sẽ tự động được bỏ qua ở lần quét sau.)
 */
async function fetchRecentTransactions({ sinceMinutes = 15 } = {}) {
  const { baseUrl, apiToken } = getConfig();
  if (!baseUrl || !apiToken) {
    console.warn(
      "[thueapibank] Chưa cấu hình apiBaseUrl / apiToken (Admin > Cài đặt hoặc file .env) — bỏ qua lượt quét này."
    );
    return [];
  }

  const url = `${baseUrl}/historyapizalopay/${encodeURIComponent(apiToken)}`;

  let res;
  try {
    res = await axios.get(url, {
      headers: { Accept: "application/json" },
      timeout: 15000,
    });
  } catch (err) {
    console.error(
      "[thueapibank] Lỗi gọi ThueAPI Zalopay:",
      err.response?.status,
      err.response?.data ?? err.message
    );
    return [];
  }

  const data = res.data;
  if (data?.status === "error") {
    // VD: bị rate-limit "ZLP Too many requests"
    console.warn("[thueapibank] ThueAPI trả lỗi:", data?.msg ?? JSON.stringify(data));
    return [];
  }

  const rawList = Array.isArray(data?.data) ? data.data : [];

  const out = [];
  for (const item of rawList) {
    const tx = item?.data?.transaction;
    if (!tx) continue;
    const mapped = mapTransaction(tx);
    if (mapped) out.push(mapped);
  }
  return out;
}

module.exports = { fetchRecentTransactions, getConfig };
