import { useAtomValue } from "jotai";
import { BottomNavigation, Icon, useNavigate, useLocation } from "zmp-ui";
import { unreadNotificationCountAtom } from "@/state/store";

const TABS = [
  { key: "/", label: "Trang chủ", icon: "zi-home", path: "/" },
  { key: "/tuition", label: "Học phí", icon: "zi-note", path: "/tuition" },
  { key: "/schedule", label: "Lịch học", icon: "zi-calendar", path: "/schedule" },
  { key: "/food", label: "Thực đơn", emoji: "🍽️", path: "/food" },
  { key: "/notifications", label: "Thông báo", icon: "zi-notif", path: "/notifications" },
  { key: "/chat", label: "Nhắn tin", icon: "zi-chat", path: "/chat" },
];

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const unread = useAtomValue(unreadNotificationCountAtom);

  const activeKey =
    TABS.find((t) => t.path === location.pathname)?.key ?? "/";

  return (
    <BottomNavigation
      fixed
      activeKey={activeKey}
      className="mh-bottom-nav"
      onChange={(key) => {
        const tab = TABS.find((t) => t.key === key);
        if (tab) navigate(tab.path);
      }}
    >
      {TABS.map((tab) => (
        <BottomNavigation.Item
          key={tab.key}
          itemKey={tab.key}
          label={tab.label}
          icon={
            <div style={{ position: "relative" }}>
              {tab.icon ? (
                <Icon icon={tab.icon as any} />
              ) : (
                <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.emoji}</span>
              )}
              {tab.key === "/notifications" && unread > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -8,
                    background: "#e53935",
                    color: "#fff",
                    borderRadius: 999,
                    fontSize: 10,
                    lineHeight: "14px",
                    minWidth: 14,
                    height: 14,
                    padding: "0 3px",
                    textAlign: "center",
                    fontWeight: 700,
                  }}
                >
                  {unread > 9 ? "9+" : unread}
                </span>
              )}
            </div>
          }
        />
      ))}
    </BottomNavigation>
  );
}

export default TabBar;
