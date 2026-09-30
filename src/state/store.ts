import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import type {
  UserAccount,
  UserRole,
  Invoice,
  ScheduleSubmission,
  AppNotification,
  ChatMessage,
  MealDay,
  FoodNote,
  CarpoolRegistration,
  PaymentSettings,
} from "./types";

export type {
  UserAccount,
  UserRole,
  Invoice,
  ScheduleSubmission,
  AppNotification,
  ChatMessage,
  MealDay,
  FoodNote,
  CarpoolRegistration,
  PaymentSettings,
};

/* =========================================================
 *  ATOMS TÀI KHOẢN & PHIÊN ĐĂNG NHẬP
 *  (id user đang đăng nhập được lưu theo thiết bị — đây là phiên
 *   đăng nhập cục bộ, KHÔNG phải dữ liệu dùng chung nên vẫn dùng
 *   localStorage như trước)
 * =======================================================*/
export const currentUserIdAtom = atomWithStorage<string | null>("mh_current_user", null);

/* =========================================================
 *  ATOMS DỮ LIỆU DÙNG CHUNG — được nạp từ backend (xem sync.ts),
 *  KHÔNG còn atomWithStorage/localStorage riêng theo từng máy nữa,
 *  để phụ huynh & admin luôn thấy cùng một dữ liệu đã đồng bộ.
 * =======================================================*/
export const usersAtom = atom<UserAccount[]>([]);
export const invoicesAtom = atom<Record<string, Invoice[]>>({});
export const schedulesAtom = atom<Record<string, ScheduleSubmission[]>>({});
export const notificationsAtom = atom<Record<string, AppNotification[]>>({});
export const messagesAtom = atom<Record<string, ChatMessage[]>>({});
export const mealPlanAtom = atom<MealDay[]>([]);
export const foodNotesAtom = atom<FoodNote[]>([]);
export const carpoolAtom = atom<CarpoolRegistration[]>([]);
export const paymentSettingsAtom = atom<PaymentSettings | null>(null);

/** true khi lần đồng bộ đầu tiên với backend đã hoàn tất */
export const bootstrappedAtom = atom(false);
/** thông báo lỗi đồng bộ gần nhất (null nếu đang ổn) */
export const syncErrorAtom = atom<string | null>(null);

export const currentUserAtom = atom((get) => {
  const id = get(currentUserIdAtom);
  if (!id) return null;
  return get(usersAtom).find((u) => u.id === id) ?? null;
});

export const parentUsersAtom = atom((get) => get(usersAtom).filter((u) => u.role === "parent"));

/** Chỉ phụ huynh có con từ lớp 6 trở lên mới thấy & dùng được tính năng "Chở xe cấp 2" */
export const isCarpoolEligibleAtom = atom((get) => {
  const user = get(currentUserAtom);
  return !!user && typeof user.grade === "number" && user.grade >= 6;
});

/* Số thông báo chưa đọc của user đang đăng nhập — dùng để hiển thị badge đỏ */
export const unreadNotificationCountAtom = atom((get) => {
  const user = get(currentUserAtom);
  if (!user) return 0;
  const list = get(notificationsAtom)[user.id] ?? [];
  return list.filter((n) => !n.read).length;
});

/* Tổng số hội thoại có tin nhắn (dùng cho admin, đếm số phụ huynh cần phản hồi) */
export const totalUnreadForAdminAtom = atom((get) => {
  const parents = get(parentUsersAtom);
  const notifMap = get(notificationsAtom);
  return parents.reduce((sum, p) => {
    const list = notifMap[p.id] ?? [];
    return sum + list.filter((n) => !n.read && n.type === "chat").length;
  }, 0);
});

/* Số đăng ký chở xe cấp 2 đang chờ admin duyệt */
export const pendingCarpoolCountAtom = atom((get) => get(carpoolAtom).filter((c) => c.status === "pending").length);

/* =========================================================
 *  HÀM TIỆN ÍCH
 * =======================================================*/
export function formatCurrency(value: number): string {
  return value.toLocaleString("vi-VN") + "đ";
}
