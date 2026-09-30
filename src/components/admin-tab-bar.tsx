import { useAtomValue } from "jotai";
import { BottomNavigation, Icon, useNavigate, useLocation } from "zmp-ui";
import { totalUnreadForAdminAtom } from "@/state/store";

const TABS = [
  { key: "/admin", label: "Tổng quan", icon: "zi-admin", path: "/admin" },
  { key: "/admin/tuition", label: "Học phí", icon: "zi-note", path: "/admin/tuition" },
  { key: "/admin/schedule", label: "Lịch học", icon: "zi-calendar", path: "/admin/schedule" },
  { key: "/admin/food", label: "Thực đơn", emoji: "🍽️", path: "/admin/food" },
  { key: "/admin/chat", label: "Tin nhắn", icon: "zi-chat", path: "/admin/chat" },
];

function AdminTabBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const unread = useAtomValue(totalUnreadForAdminAtom);

  const activeKey =
    TABS.find((t) => t.path === location.pathname)?.key ?? "/admin";

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
              {tab.key === "/admin/chat" && unread > 0 && (
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

export default AdminTabBar;
