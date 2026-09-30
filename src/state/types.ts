/* =========================================================
 *  KIỂU DỮ LIỆU DÙNG CHUNG
 * =======================================================*/
export type UserRole = "parent" | "admin";

export interface UserAccount {
  id: string;
  phone: string;
  password?: string; // chỉ có ở backend, FE không nhận về (đã bị lược bỏ)
  role: UserRole;
  name: string; // Tên hiển thị (phụ huynh hoặc admin)
  studentName?: string; // chỉ có với role = parent
  className?: string; // chỉ có với role = parent
  email?: string; // email phụ huynh
  childBirthYear?: number | null; // năm sinh của con
  grade?: number | null; // khối lớp (1-12) — dùng để xét quyền "Chở xe cấp 2" (>= 6)
}

export interface Invoice {
  id: string;
  month: string; // "Tháng 9/2026"
  amount: number; // VNĐ
  dueDate: string; // "05/09/2026"
  status: "unpaid" | "pending" | "paid"; // pending = phụ huynh đã gửi yêu cầu, chờ admin duyệt
  paidAt?: string;
  requestedAt?: string; // thời điểm phụ huynh gửi yêu cầu xác nhận
  method?: string;
  transferContent?: string; // nội dung chuyển khoản riêng, dùng để đối soát tự động
  transactionRef?: string;
}

export interface ScheduleSubmission {
  id: string;
  parentId: string;
  weekLabel: string; // "Tuần 1 (22/09 - 28/09/2026)"
  className: string;
  content: string;
  submittedAt: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  content: string;
  time: string;
  read: boolean;
  type: "tuition" | "schedule" | "system" | "chat" | "food";
}

export interface ChatMessage {
  id: string;
  sender: "me" | "admin";
  text: string;
  time: string;
}

export interface MealDay {
  day: string; // "Thứ 2"
  breakfast: string;
  lunch: string;
  snack: string;
  note?: string;
}

export interface FoodNote {
  id: string;
  parentId: string;
  parentName: string;
  content: string;
  time: string;
}

/** Đăng ký "Chở xe cấp 2" — chỉ hiển thị & dùng được với phụ huynh có con lớp 6 trở lên */
export interface CarpoolRegistration {
  id: string;
  parentId: string;
  studentName?: string;
  grade?: number | null;
  pickupAddress: string;
  dropoffAddress: string;
  pickupTime?: string;
  note?: string;
  status: "pending" | "approved" | "rejected";
  adminNote?: string;
  createdAt: string;
}

/** Cấu hình cổng thanh toán chuyển khoản ngân hàng (SePay hoặc TheAPIBank) */
export interface PaymentSettings {
  provider: "sepay" | "thueapibank" | null;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  transferPrefix: string;
  sepay: {
    webhookToken: string;
  };
  thueapibank: {
    apiBaseUrl: string;
    apiToken: string;
    cronIntervalMinutes: number;
  };
  updatedAt: string | null;
}
