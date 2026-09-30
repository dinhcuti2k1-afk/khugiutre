const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "..", "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

/* =========================================================
 *  DỮ LIỆU MẶC ĐỊNH (khởi tạo lần đầu, tương tự bản demo cũ)
 * =======================================================*/
function defaultData() {
  return {
    users: [
      {
        id: "parent-1",
        phone: "0900000001",
        password: "123456",
        role: "parent",
        name: "Chị Lan",
        studentName: "Bé Minh An",
        className: "Lớp Mầm 2",
        email: "",
        childBirthYear: null,
        grade: null, // chưa vào cấp học phổ thông
      },
      {
        id: "parent-2",
        phone: "0900000002",
        password: "123456",
        role: "parent",
        name: "Anh Hùng",
        studentName: "Bé Bảo Ngọc",
        className: "Lớp Chồi 1",
        email: "",
        childBirthYear: null,
        grade: null,
      },
      {
        id: "admin-1",
        phone: "admin",
        password: "admin123",
        role: "admin",
        name: "Admin Moon House",
      },
    ],
    invoices: {
      "parent-1": [
        {
          id: "hp-2026-09-p1",
          month: "Tháng 9/2026",
          amount: 3500000,
          dueDate: "05/09/2026",
          status: "unpaid",
          transferContent: "MH P1HP0926",
        },
        {
          id: "hp-2026-08-p1",
          month: "Tháng 8/2026",
          amount: 3500000,
          dueDate: "05/08/2026",
          status: "paid",
          paidAt: "03/08/2026",
          method: "Chuyển khoản ngân hàng",
          transferContent: "MH P1HP0826",
        },
      ],
      "parent-2": [
        {
          id: "hp-2026-09-p2",
          month: "Tháng 9/2026",
          amount: 3200000,
          dueDate: "05/09/2026",
          status: "unpaid",
          transferContent: "MH P2HP0926",
        },
      ],
    },
    schedules: { "parent-1": [], "parent-2": [] },
    notifications: {
      "parent-1": [
        {
          id: "n-welcome-1",
          title: "Chào mừng đến với Moon House",
          content:
            "Cảm ơn phụ huynh đã đồng hành cùng Khu giữ trẻ Moon House. Mọi thắc mắc vui lòng nhắn tin cho admin.",
          time: "Hôm nay",
          read: false,
          type: "system",
        },
      ],
      "parent-2": [
        {
          id: "n-welcome-2",
          title: "Chào mừng đến với Moon House",
          content:
            "Cảm ơn phụ huynh đã đồng hành cùng Khu giữ trẻ Moon House. Mọi thắc mắc vui lòng nhắn tin cho admin.",
          time: "Hôm nay",
          read: false,
          type: "system",
        },
      ],
    },
    messages: {
      "parent-1": [
        {
          id: "m-welcome-1",
          sender: "admin",
          text: "Chào phụ huynh! Admin Moon House có thể hỗ trợ gì cho mình ạ? 🌙",
          time: "08:00",
        },
      ],
      "parent-2": [
        {
          id: "m-welcome-2",
          sender: "admin",
          text: "Chào phụ huynh! Admin Moon House có thể hỗ trợ gì cho mình ạ? 🌙",
          time: "08:00",
        },
      ],
    },
    mealPlan: [
      { day: "Thứ 2", breakfast: "Cháo thịt bằm bí đỏ", lunch: "Cơm, cá kho, canh rau ngót", snack: "Sữa chua + chuối" },
      { day: "Thứ 3", breakfast: "Súp gà nấm", lunch: "Cơm, thịt kho trứng, canh bí xanh", snack: "Bánh flan" },
      { day: "Thứ 4", breakfast: "Nui thịt bằm", lunch: "Cơm, tôm rim, canh cải", snack: "Sữa + bánh quy" },
      { day: "Thứ 5", breakfast: "Cháo lươn cà rốt", lunch: "Cơm, gà kho gừng, canh mồng tơi", snack: "Trái cây theo mùa" },
      { day: "Thứ 6", breakfast: "Phở gà thiếu nhi", lunch: "Cơm, cá sốt cà, canh bầu", snack: "Sữa chua nếp cẩm" },
    ],
    foodNotes: [],
    // Đăng ký "Chở xe cấp 2" – chỉ áp dụng cho phụ huynh có con từ lớp 6 trở lên
    carpool: [],
    // Cấu hình cổng thanh toán chuyển khoản ngân hàng (SePay hoặc TheAPIBank)
    paymentSettings: {
      provider: null, // "sepay" | "thueapibank" | null
      accountNumber: "",
      bankCode: "",
      accountName: "",
      transferPrefix: "MH",
      sepay: {
        webhookToken: "",
      },
      thueapibank: {
        apiBaseUrl: "",
        apiToken: "",
        cronIntervalMinutes: 5,
      },
      updatedAt: null,
    },
  };
}

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultData(), null, 2), "utf-8");
  }
}

function readDB() {
  ensureDb();
  const raw = fs.readFileSync(DB_PATH, "utf-8");
  try {
    return JSON.parse(raw);
  } catch {
    const fresh = defaultData();
    fs.writeFileSync(DB_PATH, JSON.stringify(fresh, null, 2), "utf-8");
    return fresh;
  }
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  return data;
}

module.exports = { readDB, writeDB, defaultData, DB_PATH };
