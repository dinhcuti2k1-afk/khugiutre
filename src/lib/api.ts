/* =========================================================
 *  API CLIENT — gọi backend (thư mục /server) để đồng bộ dữ liệu
 *  giữa phụ huynh & admin trên mọi thiết bị.
 * =======================================================*/
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
} from "@/state/types";

const BASE_URL: string =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:4000/api";

export interface BootstrapData {
  users: UserAccount[];
  invoices: Record<string, Invoice[]>;
  schedules: Record<string, ScheduleSubmission[]>;
  notifications: Record<string, AppNotification[]>;
  messages: Record<string, ChatMessage[]>;
  mealPlan: MealDay[];
  foodNotes: FoodNote[];
  carpool: CarpoolRegistration[];
  paymentSettings: PaymentSettings;
  serverTime: string;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
  } catch (e) {
    throw new Error(
      "Không thể kết nối tới máy chủ đồng bộ dữ liệu. Vui lòng kiểm tra kết nối mạng hoặc địa chỉ VITE_API_BASE_URL."
    );
  }

  let body: any = null;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    throw new Error(body?.message || `Lỗi máy chủ (${res.status})`);
  }
  return body as T;
}

export const api = {
  bootstrap: () => request<BootstrapData>("/bootstrap"),

  login: (phone: string, password: string) =>
    request<{ user: UserAccount }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ phone, password }),
    }),

  getUsers: (role?: UserRole) =>
    request<{ users: UserAccount[] }>(`/users${role ? `?role=${role}` : ""}`),

  addParent: (data: {
    phone: string;
    password: string;
    name: string;
    studentName?: string;
    className?: string;
    email?: string;
    childBirthYear?: number | null;
    grade?: number | null;
  }) =>
    request<{ user: UserAccount }>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, patch: Partial<UserAccount>) =>
    request<{ user: UserAccount }>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(patch),
    }),

  deleteParent: (id: string) =>
    request<{ ok: boolean; id: string }>(`/users/${id}`, { method: "DELETE" }),

  createInvoice: (data: { parentId: string; month: string; amount: number | string; dueDate: string }) =>
    request<{ invoice: Invoice }>("/invoices", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  patchInvoice: (parentId: string, invoiceId: string, patch: { status?: Invoice["status"]; method?: string; actor?: "parent" | "admin" }) =>
    request<{ invoice: Invoice }>(`/invoices/${parentId}/${invoiceId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  createSchedule: (data: { parentId: string; weekLabel: string; className?: string; content: string }) =>
    request<{ schedule: ScheduleSubmission }>("/schedules", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  patchSchedule: (
    parentId: string,
    scheduleId: string,
    patch: { status: ScheduleSubmission["status"]; adminNote?: string }
  ) =>
    request<{ schedule: ScheduleSubmission }>(`/schedules/${parentId}/${scheduleId}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  markNotificationRead: (parentId: string, notifId: string) =>
    request<{ ok: true }>(`/notifications/${parentId}/${notifId}/read`, { method: "PATCH" }),

  markAllNotificationsRead: (parentId: string) =>
    request<{ ok: true }>(`/notifications/${parentId}/read-all`, { method: "PATCH" }),

  sendMessage: (parentId: string, sender: "me" | "admin", text: string) =>
    request<{ message: ChatMessage }>("/messages", {
      method: "POST",
      body: JSON.stringify({ parentId, sender, text }),
    }),

  saveMealPlan: (mealPlan: MealDay[]) =>
    request<{ mealPlan: MealDay[] }>("/mealplan", {
      method: "PUT",
      body: JSON.stringify({ mealPlan }),
    }),

  addFoodNote: (data: { parentId: string; parentName: string; content: string }) =>
    request<{ note: FoodNote }>("/foodnotes", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  registerCarpool: (data: {
    parentId: string;
    pickupAddress: string;
    dropoffAddress: string;
    pickupTime?: string;
    note?: string;
  }) =>
    request<{ registration: CarpoolRegistration }>("/carpool", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  patchCarpool: (id: string, patch: { status: CarpoolRegistration["status"]; adminNote?: string }) =>
    request<{ registration: CarpoolRegistration }>(`/carpool/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),

  savePaymentSettings: (settings: Partial<PaymentSettings>) =>
    request<{ paymentSettings: PaymentSettings }>("/settings/payment", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
};
