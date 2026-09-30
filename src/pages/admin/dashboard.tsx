import { useAtomValue, useSetAtom } from "jotai";
import { Page, Box, Text, Icon, Button, useNavigate } from "zmp-ui";
import {
  parentUsersAtom,
  invoicesAtom,
  schedulesAtom,
  foodNotesAtom,
  carpoolAtom,
  currentUserIdAtom,
  formatCurrency,
} from "@/state/store";
import AdminTabBar from "@/components/admin-tab-bar";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const parents = useAtomValue(parentUsersAtom);
  const invoicesMap = useAtomValue(invoicesAtom);
  const schedulesMap = useAtomValue(schedulesAtom);
  const foodNotes = useAtomValue(foodNotesAtom);
  const carpool = useAtomValue(carpoolAtom);
  const setCurrentUserId = useSetAtom(currentUserIdAtom);

  const allInvoices = parents.reduce<typeof invoicesMap[string]>(
    (acc, p) => acc.concat(invoicesMap[p.id] ?? []),
    []
  );
  const unpaidTotal = allInvoices
    .filter((i) => i.status !== "paid")
    .reduce((s, i) => s + i.amount, 0);
  const unpaidCount = allInvoices.filter((i) => i.status !== "paid").length;
  const pendingPayments = allInvoices.filter((i) => i.status === "pending").length;

  const allSchedules = parents.reduce<typeof schedulesMap[string]>(
    (acc, p) => acc.concat(schedulesMap[p.id] ?? []),
    []
  );
  const pendingSchedules = allSchedules.filter((s) => s.status === "pending").length;
  const pendingCarpool = carpool.filter((c) => c.status === "pending").length;

  const handleLogout = () => {
    setCurrentUserId(null);
    navigate("/login", { replace: true });
  };

  const STAT_CARDS = [
    {
      label: "Phụ huynh",
      value: `${parents.length}`,
      color: "#2f7dfa",
      icon: "zi-group",
      path: "/admin/parents",
    },
    {
      label: "Học phí chưa thu",
      value: formatCurrency(unpaidTotal),
      sub: pendingPayments > 0 ? `${unpaidCount} khoản · ${pendingPayments} chờ duyệt` : `${unpaidCount} khoản`,
      color: "#ef4444",
      icon: "zi-note",
      path: "/admin/tuition",
    },
    {
      label: "Lịch học chờ duyệt",
      value: `${pendingSchedules}`,
      color: "#f59e0b",
      icon: "zi-calendar",
      path: "/admin/schedule",
    },
    {
      label: "Ghi chú ăn uống",
      value: `${foodNotes.length}`,
      color: "#ec4899",
      icon: "zi-star-solid",
      path: "/admin/food",
    },
    {
      label: "Chở xe cấp 2 chờ duyệt",
      value: `${pendingCarpool}`,
      color: "#0ea5e9",
      icon: "zi-location",
      path: "/admin/carpool",
    },
    {
      label: "Cài đặt thanh toán",
      value: "⚙️",
      color: "#8b5cf6",
      icon: "zi-setting",
      path: "/admin/settings",
    },
  ];

  return (
    <Page className="page" style={{ background: "#f5f7fb" }}>
      <Box
        p={5}
        style={{
          background: "linear-gradient(135deg,#1f2a56,#3949ab)",
          borderRadius: "0 0 24px 24px",
          color: "#fff",
        }}
      >
        <Box flex flexDirection="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Text.Title style={{ color: "#fff" }} size="large">
              🛠️ Trang Admin
            </Text.Title>
            <Text style={{ color: "rgba(255,255,255,0.85)" }} size="small">
              Quản lý Khu giữ trẻ Moon House
            </Text>
          </Box>
          <Box onClick={handleLogout} style={{ cursor: "pointer", padding: 6 }}>
            <Icon icon="zi-leave" style={{ color: "#fff" }} />
          </Box>
        </Box>
      </Box>

      <Box p={4}>
        <Box className="mh-menu-grid">
          {STAT_CARDS.map((c) => (
            <Box
              key={c.label}
              onClick={() => c.path && navigate(c.path)}
              p={4}
              style={{
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
                cursor: c.path ? "pointer" : "default",
              }}
            >
              <Box
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${c.color}1A`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 8,
                }}
              >
                <Icon icon={c.icon as any} style={{ color: c.color }} />
              </Box>
              <Text bold size="normal">
                {c.value}
              </Text>
              <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                {c.label}
                {c.sub ? ` · ${c.sub}` : ""}
              </Text>
            </Box>
          ))}
        </Box>

        <Box
          flex
          flexDirection="row"
          justifyContent="space-between"
          alignItems="center"
          style={{ margin: "20px 0 8px" }}
        >
          <Text bold>Danh sách phụ huynh</Text>
          <Button
            size="small"
            onClick={() => navigate("/admin/parents", { state: { openAdd: true } })}
          >
            + Thêm phụ huynh
          </Button>
        </Box>
        <Box style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {parents.map((p) => {
            const pInvoices = invoicesMap[p.id] ?? [];
            const pUnpaid = pInvoices
              .filter((i) => i.status !== "paid")
              .reduce((s, i) => s + i.amount, 0);
            return (
              <Box
                key={p.id}
                onClick={() => navigate("/admin/parents")}
                p={3}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <Box>
                  <Text bold size="small">
                    {p.studentName} · {p.className}
                  </Text>
                  <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                    PH: {p.name} · {p.phone}
                  </Text>
                </Box>
                <Text
                  size="xSmall"
                  bold
                  style={{ color: pUnpaid > 0 ? "#ef4444" : "#10b981" }}
                >
                  {pUnpaid > 0 ? formatCurrency(pUnpaid) : "Đã đóng đủ"}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>

      <AdminTabBar />
    </Page>
  );
}
