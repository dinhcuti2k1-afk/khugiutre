require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { readDB, writeDB } = require("./db");
const { buildTransferContent, markInvoicePaidFromTransaction } = require("./lib/payment");

const PORT = process.env.PORT || 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "*";

const app = express();
app.use(cors({ origin: CORS_ORIGIN === "*" ? true : CORS_ORIGIN.split(",") }));
app.use(express.json());

/* ========================================================= helpers ==== */
function now() {
  return new Date().toLocaleString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}
function nowTime() {
  return new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
}
function genId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}
function buildNotification(title, content, type) {
  return { id: genId("n"), title, content, time: now(), read: false, type };
}
function pushNotificationTo(map, parentId, notif) {
  return { ...map, [parentId]: [notif, ...(map[parentId] || [])] };
}
function stripPasswords(users) {
  return users.map(({ password, ...rest }) => rest);
}
/** Cấp học >= 6 (lớp 6 trở lên, tức từ cấp 2) mới được dùng tính năng chở xe cấp 2 */
function isEligibleForCarpool(user) {
  return typeof user.grade === "number" && user.grade >= 6;
}

/* ========================================================= bootstrap == */
// Trả về toàn bộ trạng thái ứng dụng — FE gọi định kỳ (polling) để đồng bộ
// dữ liệu giữa admin & phụ huynh, trên mọi thiết bị.
app.get("/api/bootstrap", (req, res) => {
  const db = readDB();
  res.json({
    users: stripPasswords(db.users),
    invoices: db.invoices,
    schedules: db.schedules,
    notifications: db.notifications,
    messages: db.messages,
    mealPlan: db.mealPlan,
    foodNotes: db.foodNotes,
    carpool: db.carpool,
    paymentSettings: db.paymentSettings,
    serverTime: new Date().toISOString(),
  });
});

/* ========================================================= auth ======= */
app.post("/api/auth/login", (req, res) => {
  const { phone, password } = req.body || {};
  const db = readDB();
  const user = db.users.find(
    (u) => u.phone === String(phone || "").trim() && u.password === password
  );
  if (!user) {
    return res.status(401).json({ message: "Số điện thoại hoặc mật khẩu không đúng." });
  }
  const { password: _pw, ...safeUser } = user;
  res.json({ user: safeUser });
});

/* ========================================================= users ====== */
app.get("/api/users", (req, res) => {
  const db = readDB();
  let list = db.users;
  if (req.query.role) list = list.filter((u) => u.role === req.query.role);
  res.json({ users: stripPasswords(list) });
});

// Admin thêm phụ huynh mới: sđt, mật khẩu, tên PH, tên bé, lớp, email, năm sinh của con, lớp (số) để xét chở xe cấp 2
app.post("/api/users", (req, res) => {
  const db = readDB();
  const {
    phone,
    password,
    name,
    studentName,
    className,
    email,
    childBirthYear,
    grade,
  } = req.body || {};

  if (!phone || !password || !name) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ SĐT, mật khẩu và tên phụ huynh." });
  }
  if (db.users.some((u) => u.phone === String(phone).trim())) {
    return res.status(409).json({ message: "Số điện thoại này đã được đăng ký." });
  }

  const newUser = {
    id: genId("parent"),
    phone: String(phone).trim(),
    password: String(password),
    role: "parent",
    name: String(name).trim(),
    studentName: studentName ? String(studentName).trim() : "",
    className: className ? String(className).trim() : "",
    email: email ? String(email).trim() : "",
    childBirthYear: childBirthYear ? Number(childBirthYear) : null,
    grade: grade !== undefined && grade !== null && grade !== "" ? Number(grade) : null,
  };

  db.users.push(newUser);
  db.invoices[newUser.id] = db.invoices[newUser.id] || [];
  db.schedules[newUser.id] = db.schedules[newUser.id] || [];
  db.foodNotes = db.foodNotes || [];
  db.notifications[newUser.id] = [
    buildNotification(
      "Chào mừng đến với Moon House",
      "Cảm ơn phụ huynh đã đồng hành cùng Khu giữ trẻ Moon House. Mọi thắc mắc vui lòng nhắn tin cho admin.",
      "system"
    ),
  ];
  db.messages[newUser.id] = [
    {
      id: genId("m"),
      sender: "admin",
      text: "Chào phụ huynh! Admin Moon House có thể hỗ trợ gì cho mình ạ? 🌙",
      time: nowTime(),
    },
  ];

  writeDB(db);
  const { password: _pw, ...safeUser } = newUser;
  res.status(201).json({ user: safeUser });
});

app.put("/api/users/:id", (req, res) => {
  const db = readDB();
  const idx = db.users.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy phụ huynh." });

  const allowed = ["name", "studentName", "className", "email", "childBirthYear", "grade", "password"];
  const patch = {};
  allowed.forEach((k) => {
    if (req.body[k] !== undefined) patch[k] = req.body[k];
  });
  if (patch.childBirthYear !== undefined) patch.childBirthYear = patch.childBirthYear ? Number(patch.childBirthYear) : null;
  if (patch.grade !== undefined) patch.grade = patch.grade !== null && patch.grade !== "" ? Number(patch.grade) : null;

  db.users[idx] = { ...db.users[idx], ...patch };
  writeDB(db);
  const { password: _pw, ...safeUser } = db.users[idx];
  res.json({ user: safeUser });
});

// Xóa phụ huynh + toàn bộ dữ liệu liên quan (hóa đơn, lịch học, thông báo, tin nhắn, ghi chú ăn, đăng ký chở xe)
app.delete("/api/users/:id", (req, res) => {
  const db = readDB();
  const id = req.params.id;
  const user = db.users.find((u) => u.id === id);
  if (!user) return res.status(404).json({ message: "Không tìm thấy phụ huynh." });
  if (user.role !== "parent") {
    return res.status(403).json({ message: "Chỉ được xóa tài khoản phụ huynh." });
  }

  db.users = db.users.filter((u) => u.id !== id);
  ["invoices", "schedules", "notifications", "messages"].forEach((key) => {
    if (db[key] && typeof db[key] === "object") delete db[key][id];
  });
  db.foodNotes = (db.foodNotes || []).filter((n) => n.parentId !== id);
  db.carpool = (db.carpool || []).filter((c) => c.parentId !== id);

  writeDB(db);
  res.json({ ok: true, id });
});

/* ========================================================= invoices === */
app.post("/api/invoices", (req, res) => {
  const db = readDB();
  const { parentId, month, amount, dueDate } = req.body || {};
  if (!parentId || !month || !amount || !dueDate) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin hóa đơn." });
  }
  const id = genId("hp");
  const invoice = {
    id,
    month: String(month).trim(),
    amount: Number(String(amount).replace(/\D/g, "")) || 0,
    dueDate: String(dueDate).trim(),
    status: "unpaid",
    transferContent: buildTransferContent(db.paymentSettings.transferPrefix, parentId, id),
  };
  db.invoices[parentId] = [invoice, ...(db.invoices[parentId] || [])];
  db.notifications[parentId] = [
    buildNotification(
      "Hóa đơn học phí mới",
      `Bạn có khoản học phí mới: ${invoice.month} - ${invoice.amount.toLocaleString("vi-VN")}đ, hạn ${invoice.dueDate}.`,
      "tuition"
    ),
    ...(db.notifications[parentId] || []),
  ];
  writeDB(db);
  res.status(201).json({ invoice });
});

// Cập nhật trạng thái hóa đơn.
//  - Phụ huynh (actor = "parent") chỉ được GỬI YÊU CẦU xác nhận (status = "pending"), KHÔNG tự chuyển thành "paid".
//  - Admin (actor = "admin"): "paid" = duyệt/đã thu, "unpaid" = từ chối hoặc hoàn tác.
app.patch("/api/invoices/:parentId/:invoiceId", (req, res) => {
  const db = readDB();
  const { parentId, invoiceId } = req.params;
  const list = db.invoices[parentId] || [];
  const idx = list.findIndex((i) => i.id === invoiceId);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy hóa đơn." });

  const { status, method, actor } = req.body || {};
  const inv = list[idx];

  // ---- Phụ huynh gửi yêu cầu (ZaloPay / tiền mặt tại trường) -> chờ admin duyệt
  if (actor === "parent") {
    if (inv.status === "paid") {
      return res.status(400).json({ message: "Hóa đơn này đã được thanh toán." });
    }
    if (inv.status === "pending") {
      return res.status(400).json({ message: "Yêu cầu của bạn đang chờ admin duyệt." });
    }
    const updated = {
      ...inv,
      status: "pending",
      method: method || "Chờ admin xác nhận",
      requestedAt: new Date().toLocaleString("vi-VN"),
      paidAt: undefined,
    };
    list[idx] = updated;
    db.invoices[parentId] = list;
    db.notifications[parentId] = [
      buildNotification(
        "Đã gửi yêu cầu xác nhận thanh toán",
        `Yêu cầu thanh toán ${updated.month} (${updated.method}) đã được gửi tới admin. Vui lòng chờ admin duyệt.`,
        "tuition"
      ),
      ...(db.notifications[parentId] || []),
    ];
    writeDB(db);
    return res.json({ invoice: updated });
  }

  // ---- Admin
  const nextStatus = status || (inv.status === "paid" ? "unpaid" : "paid");
  const wasPending = inv.status === "pending";
  const updated = {
    ...inv,
    status: nextStatus,
    method: nextStatus === "paid" ? method || inv.method || "Admin xác nhận" : undefined,
    paidAt: nextStatus === "paid" ? new Date().toLocaleDateString("vi-VN") : undefined,
    requestedAt: nextStatus === "pending" ? inv.requestedAt : undefined,
  };
  list[idx] = updated;
  db.invoices[parentId] = list;

  if (nextStatus === "paid") {
    db.notifications[parentId] = [
      buildNotification(
        "Đã ghi nhận thanh toán",
        `Admin đã xác nhận thanh toán ${updated.amount.toLocaleString("vi-VN")}đ cho ${updated.month} qua ${updated.method}.`,
        "tuition"
      ),
      ...(db.notifications[parentId] || []),
    ];
  } else if (nextStatus === "unpaid" && wasPending) {
    db.notifications[parentId] = [
      buildNotification(
        "Yêu cầu thanh toán chưa được duyệt",
        `Admin chưa xác nhận thanh toán cho ${updated.month}. Vui lòng kiểm tra lại hoặc nhắn tin cho admin.`,
        "tuition"
      ),
      ...(db.notifications[parentId] || []),
    ];
  }
  writeDB(db);
  res.json({ invoice: updated });
});

/* ========================================================= schedules == */
app.post("/api/schedules", (req, res) => {
  const db = readDB();
  const { parentId, weekLabel, className, content } = req.body || {};
  if (!parentId || !weekLabel || !content) {
    return res.status(400).json({ message: "Vui lòng nhập đầy đủ tuần học và nội dung." });
  }
  const item = {
    id: genId("sch"),
    parentId,
    weekLabel: String(weekLabel).trim(),
    className: className || "",
    content: String(content).trim(),
    submittedAt: now(),
    status: "pending",
  };
  db.schedules[parentId] = [item, ...(db.schedules[parentId] || [])];
  db.notifications[parentId] = [
    buildNotification(
      "Đã gửi thời khóa biểu",
      `Thời khóa biểu "${item.weekLabel}" đã được gửi tới admin, đang chờ duyệt.`,
      "schedule"
    ),
    ...(db.notifications[parentId] || []),
  ];
  writeDB(db);
  res.status(201).json({ schedule: item });
});

app.patch("/api/schedules/:parentId/:scheduleId", (req, res) => {
  const db = readDB();
  const { parentId, scheduleId } = req.params;
  const { status, adminNote } = req.body || {};
  const list = db.schedules[parentId] || [];
  const idx = list.findIndex((s) => s.id === scheduleId);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy thời khóa biểu." });

  list[idx] = { ...list[idx], status, adminNote: status === "rejected" ? adminNote || "Cần chỉnh sửa lại" : undefined };
  db.schedules[parentId] = list;

  const title = status === "approved" ? "Thời khóa biểu đã được duyệt" : "Thời khóa biểu bị từ chối";
  const content =
    status === "approved"
      ? `Thời khóa biểu "${list[idx].weekLabel}" đã được admin phê duyệt.`
      : `Thời khóa biểu "${list[idx].weekLabel}" chưa được duyệt. Lý do: ${list[idx].adminNote}`;
  db.notifications[parentId] = [buildNotification(title, content, "schedule"), ...(db.notifications[parentId] || [])];

  writeDB(db);
  res.json({ schedule: list[idx] });
});

/* ========================================================= notifications */
app.patch("/api/notifications/:parentId/:notifId/read", (req, res) => {
  const db = readDB();
  const { parentId, notifId } = req.params;
  db.notifications[parentId] = (db.notifications[parentId] || []).map((n) =>
    n.id === notifId ? { ...n, read: true } : n
  );
  writeDB(db);
  res.json({ ok: true });
});

app.patch("/api/notifications/:parentId/read-all", (req, res) => {
  const db = readDB();
  const { parentId } = req.params;
  db.notifications[parentId] = (db.notifications[parentId] || []).map((n) => ({ ...n, read: true }));
  writeDB(db);
  res.json({ ok: true });
});

/* ========================================================= messages === */
app.post("/api/messages", (req, res) => {
  const db = readDB();
  const { parentId, sender, text } = req.body || {};
  if (!parentId || !text || !sender) {
    return res.status(400).json({ message: "Thiếu dữ liệu tin nhắn." });
  }
  const msg = { id: genId("m"), sender, text: String(text).trim(), time: nowTime() };
  db.messages[parentId] = [...(db.messages[parentId] || []), msg];

  if (sender === "admin") {
    db.notifications[parentId] = [
      buildNotification("Admin đã trả lời", msg.text, "chat"),
      ...(db.notifications[parentId] || []),
    ];
  } else {
    // Tin nhắn từ phụ huynh -> tạo "thông báo nội bộ" để admin thấy có hội thoại cần phản hồi
    db.notifications[parentId] = db.notifications[parentId] || [];
  }

  writeDB(db);
  res.status(201).json({ message: msg });
});

/* ========================================================= meal plan == */
app.put("/api/mealplan", (req, res) => {
  const db = readDB();
  const { mealPlan } = req.body || {};
  if (!Array.isArray(mealPlan)) return res.status(400).json({ message: "Dữ liệu thực đơn không hợp lệ." });
  db.mealPlan = mealPlan;
  writeDB(db);
  res.json({ mealPlan: db.mealPlan });
});

app.post("/api/foodnotes", (req, res) => {
  const db = readDB();
  const { parentId, parentName, content } = req.body || {};
  if (!parentId || !content) return res.status(400).json({ message: "Thiếu nội dung ghi chú." });
  const note = { id: genId("fn"), parentId, parentName, content: String(content).trim(), time: now() };
  db.foodNotes = [note, ...(db.foodNotes || [])];
  db.notifications[parentId] = [
    buildNotification("Đã gửi ghi chú ăn uống", `Ghi chú của bạn: "${note.content}" đã được gửi tới admin.`, "food"),
    ...(db.notifications[parentId] || []),
  ];
  writeDB(db);
  res.status(201).json({ note });
});

/* ========================================================= carpool cấp 2 */
// Chỉ phụ huynh có con từ lớp 6 trở lên (grade >= 6) mới được đăng ký
app.post("/api/carpool", (req, res) => {
  const db = readDB();
  const { parentId, pickupAddress, dropoffAddress, pickupTime, note } = req.body || {};
  const parent = db.users.find((u) => u.id === parentId);
  if (!parent) return res.status(404).json({ message: "Không tìm thấy phụ huynh." });
  if (!isEligibleForCarpool(parent)) {
    return res.status(403).json({
      message: "Tính năng Chở xe cấp 2 chỉ áp dụng cho phụ huynh có con từ lớp 6 trở lên.",
    });
  }
  if (!pickupAddress || !dropoffAddress) {
    return res.status(400).json({ message: "Vui lòng nhập điểm đón và điểm trả." });
  }

  const item = {
    id: genId("cp"),
    parentId,
    studentName: parent.studentName || "",
    grade: parent.grade,
    pickupAddress: String(pickupAddress).trim(),
    dropoffAddress: String(dropoffAddress).trim(),
    pickupTime: pickupTime ? String(pickupTime).trim() : "",
    note: note ? String(note).trim() : "",
    status: "pending",
    createdAt: now(),
  };
  db.carpool = [item, ...(db.carpool || [])];
  db.notifications[parentId] = [
    buildNotification(
      "Đã gửi đăng ký chở xe cấp 2",
      "Đăng ký chở xe cấp 2 của bạn đã được gửi tới admin, đang chờ xác nhận.",
      "system"
    ),
    ...(db.notifications[parentId] || []),
  ];
  writeDB(db);
  res.status(201).json({ registration: item });
});

app.patch("/api/carpool/:id", (req, res) => {
  const db = readDB();
  const { id } = req.params;
  const { status, adminNote } = req.body || {};
  const idx = (db.carpool || []).findIndex((c) => c.id === id);
  if (idx === -1) return res.status(404).json({ message: "Không tìm thấy đăng ký." });

  db.carpool[idx] = { ...db.carpool[idx], status, adminNote };
  const parentId = db.carpool[idx].parentId;
  const label = status === "approved" ? "đã được duyệt" : status === "rejected" ? "đã bị từ chối" : "đang chờ duyệt";
  db.notifications[parentId] = [
    buildNotification("Cập nhật đăng ký chở xe cấp 2", `Đăng ký chở xe cấp 2 của bạn ${label}.`, "system"),
    ...(db.notifications[parentId] || []),
  ];
  writeDB(db);
  res.json({ registration: db.carpool[idx] });
});

/* ========================================================= payment settings */
app.put("/api/settings/payment", (req, res) => {
  const db = readDB();
  const body = req.body || {};
  db.paymentSettings = {
    ...db.paymentSettings,
    provider: body.provider ?? db.paymentSettings.provider,
    accountNumber: body.accountNumber ?? db.paymentSettings.accountNumber,
    bankCode: body.bankCode ?? db.paymentSettings.bankCode,
    accountName: body.accountName ?? db.paymentSettings.accountName,
    transferPrefix: body.transferPrefix ?? db.paymentSettings.transferPrefix,
    sepay: { ...db.paymentSettings.sepay, ...(body.sepay || {}) },
    thueapibank: { ...db.paymentSettings.thueapibank, ...(body.thueapibank || {}) },
    updatedAt: new Date().toISOString(),
  };
  writeDB(db);
  res.json({ paymentSettings: db.paymentSettings });
});

/* ========================================================= SePay webhook */
// Cấu hình URL này trong SePay > Cấu hình > Webhook: https://<domain-server-cua-ban>/api/payments/sepay/webhook
// SePay tự tạo "nội dung chuyển khoản" gợi ý cho khách, ở đây ta đối soát theo nội dung thực nhận + số tiền.
app.post("/api/payments/sepay/webhook", (req, res) => {
  const db = readDB();
  const configuredToken = db.paymentSettings?.sepay?.webhookToken;

  if (configuredToken) {
    const authHeader = req.headers["authorization"] || "";
    const ok = authHeader === `Apikey ${configuredToken}` || authHeader === configuredToken;
    if (!ok) return res.status(401).json({ success: false, message: "Sai token xác thực webhook." });
  }

  const body = req.body || {};
  // SePay thường gửi các trường: content, transferAmount, accountNumber, referenceCode, transactionDate, gateway...
  const content = body.content || body.description || "";
  const amount = body.transferAmount ?? body.amount ?? 0;
  const transactionRef = body.referenceCode || body.id || body.transactionId;

  const result = markInvoicePaidFromTransaction({
    content,
    amount,
    methodLabel: "Chuyển khoản qua SePay (tự động)",
    transactionRef,
  });

  if (!result) {
    // Vẫn trả 200 để SePay không retry liên tục, nhưng ghi rõ là chưa khớp được hóa đơn nào
    return res.status(200).json({ success: true, matched: false });
  }
  res.status(200).json({ success: true, matched: true, invoiceId: result.invoice.id });
});

/* ========================================================= TheAPIBank == */
// Endpoint nội bộ để cron job (hoặc gọi thủ công) đánh dấu 1 giao dịch đã khớp là "đã thanh toán".
// Cron job xem file: server/src/cron/thueapibank-sync.js
app.post("/api/payments/thueapibank/mark-paid", (req, res) => {
  const internalToken = process.env.INTERNAL_API_TOKEN;
  if (internalToken) {
    const provided = req.headers["x-internal-token"];
    if (provided !== internalToken) {
      return res.status(401).json({ success: false, message: "Sai internal token." });
    }
  }
  const { content, amount, transactionRef } = req.body || {};
  const result = markInvoicePaidFromTransaction({
    content,
    amount,
    methodLabel: "Chuyển khoản qua TheAPIBank (tự động - cron)",
    transactionRef,
  });
  if (!result) return res.status(200).json({ success: true, matched: false });
  res.status(200).json({ success: true, matched: true, invoiceId: result.invoice.id });
});

app.get("/api/health", (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ============================================================ zalo webhook ===
// Nhận sự kiện "user rút lại sự đồng ý và xoá dữ liệu" từ Zalo Open API.
// Tài liệu: https://docs.zaloplatforms.com/docs/MA/openApis/open/webhook/eventRevokeAndRemoveUserData
// Lấy API Key tại: https://mini.zalo.me/developers > chọn app > Open APIs > Quản lý APIs.
const crypto = require("crypto");

function verifyZaloSignature(data, signatureHeader, apiKey) {
  if (!apiKey || !signatureHeader) return false;
  const keys = Object.keys(data).sort();
  let content = "";
  for (const k of keys) {
    let value = data[k];
    if (typeof value === "object" && value !== null) value = JSON.stringify(value);
    content += value;
  }
  const expected = crypto.createHash("sha256").update(`${content}${apiKey}`).digest("hex");
  return expected === signatureHeader;
}

app.post("/api/zalo/webhook", (req, res) => {
  const apiKey = process.env.ZALO_OPEN_API_KEY || "";
  const signature = req.headers["x-zevent-signature"];
  const body = req.body || {};

  if (!apiKey) {
    console.warn("[zalo-webhook] Chưa cấu hình ZALO_OPEN_API_KEY, bỏ qua kiểm tra chữ ký (chỉ nên xảy ra lúc mới thiết lập).");
  } else if (!verifyZaloSignature(body, signature, apiKey)) {
    console.warn("[zalo-webhook] Chữ ký không hợp lệ, từ chối request.", { appId: body.appId, event: body.event });
    return res.status(401).json({ message: "Invalid signature" });
  }

  // event = "user.revoke.consent": người dùng rút lại sự đồng ý / yêu cầu xoá dữ liệu.
  // App này đăng nhập bằng số điện thoại + mật khẩu riêng, KHÔNG dùng Zalo Login nên
  // không lưu trữ bất kỳ dữ liệu nào gắn với userId của Zalo -> không có gì cần xoá thêm.
  console.log("[zalo-webhook] Nhận sự kiện:", body.event, "| userId:", body.userId, "| appId:", body.appId);

  res.status(200).json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`✅ Moon House server đang chạy tại http://localhost:${PORT}`);
});
