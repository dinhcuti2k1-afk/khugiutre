import { useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Icon, Sheet, Button } from "zmp-ui";
import { notificationsAtom, currentUserAtom, AppNotification } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import TabBar from "@/components/tab-bar";

const TYPE_META: Record<
  AppNotification["type"],
  { icon: string; color: string; bg: string }
> = {
  tuition: { icon: "zi-note", color: "#2f7dfa", bg: "#e6f0ff" },
  schedule: { icon: "zi-calendar", color: "#f59e0b", bg: "#fef3c7" },
  system: { icon: "zi-info-circle-solid", color: "#8b5cf6", bg: "#ede9fe" },
  chat: { icon: "zi-chat-solid", color: "#10b981", bg: "#d1fae5" },
  food: { icon: "zi-star-solid", color: "#ec4899", bg: "#fce7f3" },
};

export default function NotificationsPage() {
  const user = useAtomValue(currentUserAtom);
  const notifMap = useAtomValue(notificationsAtom);
  const [selected, setSelected] = useState<AppNotification | null>(null);

  const notifications = user ? notifMap[user.id] ?? [] : [];

  const openNotification = async (n: AppNotification) => {
    setSelected(n);
    if (!n.read && user) {
      await api.markNotificationRead(user.id, n.id);
      await refreshAll();
    }
  };

  const markAllRead = async () => {
    if (!user) return;
    await api.markAllNotificationsRead(user.id);
    await refreshAll();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Thông báo" showBackIcon={false} />

      <Box p={4}>
        <Box flex flexDirection="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Text size="small" style={{ color: "#8a8a8e" }}>
            {unreadCount > 0 ? `${unreadCount} thông báo chưa đọc` : "Đã đọc hết"}
          </Text>
          {unreadCount > 0 && (
            <Text
              size="small"
              style={{ color: "#2f7dfa", cursor: "pointer" }}
              onClick={markAllRead}
            >
              Đánh dấu tất cả đã đọc
            </Text>
          )}
        </Box>

        {notifications.length === 0 && (
          <Text size="small" style={{ color: "#8a8a8e" }}>
            Chưa có thông báo nào.
          </Text>
        )}

        {notifications.map((n) => {
          const meta = TYPE_META[n.type];
          return (
            <Box
              key={n.id}
              onClick={() => openNotification(n)}
              p={3}
              mb={2}
              style={{
                background: "#fff",
                borderRadius: 14,
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                border: n.read ? "none" : "1px solid #dbeafe",
                cursor: "pointer",
              }}
            >
              <Box
                style={{
                  width: 40,
                  height: 40,
                  minWidth: 40,
                  borderRadius: 10,
                  background: meta.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon icon={meta.icon as any} style={{ color: meta.color }} />
              </Box>
              <Box style={{ flex: 1 }}>
                <Box flex flexDirection="row" justifyContent="space-between">
                  <Text bold size="small">
                    {n.title}
                  </Text>
                  {!n.read && (
                    <Box
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: "#ef4444",
                        marginTop: 4,
                      }}
                    />
                  )}
                </Box>
                <Text
                  size="xSmall"
                  style={{
                    color: "#8a8a8e",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    overflow: "hidden",
                  }}
                >
                  {n.content}
                </Text>
                <Text size="xxSmall" style={{ color: "#b0b0b6", marginTop: 4 }}>
                  {n.time}
                </Text>
              </Box>
            </Box>
          );
        })}
      </Box>

      <Sheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        autoHeight
        mask
        handler
      >
        {selected && (
          <Box p={5}>
            <Box flex flexDirection="row" alignItems="center" mb={3}>
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: TYPE_META[selected.type].bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 10,
                }}
              >
                <Icon
                  icon={TYPE_META[selected.type].icon as any}
                  style={{ color: TYPE_META[selected.type].color }}
                />
              </Box>
              <Box>
                <Text.Title size="small">{selected.title}</Text.Title>
                <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                  {selected.time}
                </Text>
              </Box>
            </Box>
            <Text size="small">{selected.content}</Text>
            <Button fullWidth style={{ marginTop: 20 }} onClick={() => setSelected(null)}>
              Đóng
            </Button>
          </Box>
        )}
      </Sheet>

      <TabBar />
    </Page>
  );
}
