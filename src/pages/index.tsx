import { useAtomValue, useSetAtom } from "jotai";
import { Page, Box, Text, Icon, Avatar, useNavigate } from "zmp-ui";
import {
  currentUserAtom,
  currentUserIdAtom,
  invoicesAtom,
  unreadNotificationCountAtom,
  isCarpoolEligibleAtom,
  formatCurrency,
} from "@/state/store";
import TabBar from "@/components/tab-bar";

interface MenuItem {
  path: string;
  label: string;
  desc: string;
  color: string;
  icon?: string;
  emoji?: string;
}

const BASE_MENU: MenuItem[] = [
  {
    path: "/tuition",
    label: "Đóng học phí",
    desc: "Xem & thanh toán học phí",
    icon: "zi-note",
    color: "#2f7dfa",
  },
  {
    path: "/schedule",
    label: "Thời khóa biểu",
    desc: "Gửi lịch học lên admin",
    icon: "zi-calendar",
    color: "#f59e0b",
  },
  {
    path: "/food",
    label: "Thực đơn ăn uống",
    desc: "Xem thực đơn hàng ngày",
    emoji: "🍽️",
    color: "#ec4899",
  },
  {
    path: "/notifications",
    label: "Thông báo",
    desc: "Tin tức từ nhà trường",
    icon: "zi-notif",
    color: "#ef4444",
  },
  {
    path: "/chat",
    label: "Nhắn tin admin",
    desc: "Trao đổi trực tiếp",
    icon: "zi-chat",
    color: "#10b981",
  },
];

const CARPOOL_ITEM: MenuItem = {
  path: "/carpool",
  label: "Chở xe cấp 2",
  desc: "Đăng ký điểm đón / trả xe",
  emoji: "🚐",
  color: "#0ea5e9",
};

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAtomValue(currentUserAtom);
  const setCurrentUserId = useSetAtom(currentUserIdAtom);
  const invoicesMap = useAtomValue(invoicesAtom);
  const unread = useAtomValue(unreadNotificationCountAtom);
  const carpoolEligible = useAtomValue(isCarpoolEligibleAtom);

  const invoices = user ? invoicesMap[user.id] ?? [] : [];
  const unpaidTotal = invoices
    .filter((i) => i.status === "unpaid")
    .reduce((sum, i) => sum + i.amount, 0);

  const MENU = carpoolEligible ? [...BASE_MENU, CARPOOL_ITEM] : BASE_MENU;

  const handleLogout = () => {
    setCurrentUserId(null);
    navigate("/login", { replace: true });
  };

  return (
    <Page className="page" style={{ background: "#f5f7fb" }}>
      {/* Header chào mừng */}
      <Box
        p={5}
        style={{
          background: "linear-gradient(135deg, #6d5bd0 0%, #a084e8 100%)",
          borderRadius: "0 0 24px 24px",
          color: "#fff",
        }}
      >
        <Box flex flexDirection="row" alignItems="center" justifyContent="space-between">
          <Box flex flexDirection="row" alignItems="center">
            <Avatar size={52} online>
              🌙
            </Avatar>
            <Box ml={3}>
              <Text.Title style={{ color: "#fff" }} size="large">
                Moon House
              </Text.Title>
              <Text style={{ color: "rgba(255,255,255,0.85)" }} size="small">
                Khu giữ trẻ Moon House
              </Text>
            </Box>
          </Box>
          <Box onClick={handleLogout} style={{ cursor: "pointer", padding: 6 }}>
            <Icon icon="zi-leave" style={{ color: "#fff" }} />
          </Box>
        </Box>

        <Box
          mt={4}
          p={4}
          style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 16,
          }}
        >
          <Text style={{ color: "rgba(255,255,255,0.85)" }} size="xSmall">
            Học sinh
          </Text>
          <Text style={{ color: "#fff" }} bold size="large">
            {user?.studentName ?? "—"} · {user?.className ?? ""}
          </Text>
          <Box mt={2} flex flexDirection="row" justifyContent="space-between">
            <Box>
              <Text style={{ color: "rgba(255,255,255,0.85)" }} size="xSmall">
                Học phí cần đóng
              </Text>
              <Text style={{ color: "#fff" }} bold size="normal">
                {unpaidTotal > 0 ? formatCurrency(unpaidTotal) : "Đã hoàn tất"}
              </Text>
            </Box>
            <Box>
              <Text style={{ color: "rgba(255,255,255,0.85)" }} size="xSmall">
                Thông báo mới
              </Text>
              <Text style={{ color: "#fff" }} bold size="normal">
                {unread} thông báo
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Menu chức năng */}
      <Box p={4}>
        <Text bold size="normal" style={{ marginBottom: 12, display: "block" }}>
          Chức năng chính
        </Text>
        <Box className="mh-menu-grid">
          {MENU.map((item) => (
            <Box
              key={item.path}
              onClick={() => navigate(item.path)}
              p={4}
              style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                cursor: "pointer",
              }}
            >
              <Box
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: `${item.color}1A`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 10,
                }}
              >
                {item.icon ? (
                  <Icon icon={item.icon as any} style={{ color: item.color }} />
                ) : (
                  <span style={{ fontSize: 20 }}>{item.emoji}</span>
                )}
              </Box>
              <Text bold size="small">
                {item.label}
              </Text>
              <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                {item.desc}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      <TabBar />
    </Page>
  );
}
