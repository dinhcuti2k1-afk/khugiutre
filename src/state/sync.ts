import { getDefaultStore } from "jotai";
import { api } from "@/lib/api";
import {
  usersAtom,
  invoicesAtom,
  schedulesAtom,
  notificationsAtom,
  messagesAtom,
  mealPlanAtom,
  foodNotesAtom,
  carpoolAtom,
  paymentSettingsAtom,
  bootstrappedAtom,
  syncErrorAtom,
} from "./store";

const jotaiStore = getDefaultStore();

let inFlight: Promise<void> | null = null;
let timer: ReturnType<typeof setInterval> | null = null;

/** Gọi backend lấy toàn bộ trạng thái mới nhất & ghi đè vào các atom dùng chung. */
export async function refreshAll(): Promise<void> {
  // Gộp các lần gọi chồng chéo (VD: vừa mutate xong vừa tới hẹn polling) thành 1 request
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const data = await api.bootstrap();
      jotaiStore.set(usersAtom, data.users);
      jotaiStore.set(invoicesAtom, data.invoices);
      jotaiStore.set(schedulesAtom, data.schedules);
      jotaiStore.set(notificationsAtom, data.notifications);
      jotaiStore.set(messagesAtom, data.messages);
      jotaiStore.set(mealPlanAtom, data.mealPlan);
      jotaiStore.set(foodNotesAtom, data.foodNotes);
      jotaiStore.set(carpoolAtom, data.carpool);
      jotaiStore.set(paymentSettingsAtom, data.paymentSettings);
      jotaiStore.set(syncErrorAtom, null);
      jotaiStore.set(bootstrappedAtom, true);
    } catch (e: any) {
      jotaiStore.set(syncErrorAtom, e?.message ?? "Không thể đồng bộ dữ liệu với máy chủ.");
      // vẫn đánh dấu đã "bootstrap" để không chặn UI mãi mãi khi mất mạng
      jotaiStore.set(bootstrappedAtom, true);
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}

/** Bắt đầu đồng bộ định kỳ (gọi 1 lần khi app khởi động). */
export function startAutoSync(intervalMs = 4000) {
  refreshAll();
  if (timer) clearInterval(timer);
  timer = setInterval(refreshAll, intervalMs);
}
