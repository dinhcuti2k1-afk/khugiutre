import { useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Icon, Button, Input, Sheet, useSnackbar } from "zmp-ui";
import { parentUsersAtom, invoicesAtom, formatCurrency, Invoice } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import AdminTabBar from "@/components/admin-tab-bar";

export default function AdminTuitionPage() {
  const parents = useAtomValue(parentUsersAtom);
  const invoicesMap = useAtomValue(invoicesAtom);
  const { openSnackbar } = useSnackbar();

  const [addFor, setAddFor] = useState<string | null>(null);
  const [month, setMonth] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const togglePaid = async (parentId: string, inv: Invoice) => {
    if (inv.status === "pending") return; // hóa đơn chờ duyệt dùng nút Duyệt / Từ chối
    const nextStatus = inv.status === "paid" ? "unpaid" : "paid";
    await api.patchInvoice(parentId, inv.id, {
      status: nextStatus,
      method: nextStatus === "paid" ? "Admin xác nhận tiền mặt" : undefined,
      actor: "admin",
    });
    await refreshAll();
  };

  // Duyệt / từ chối yêu cầu thanh toán do phụ huynh gửi (ZaloPay, tiền mặt tại trường)
  const reviewPending = async (parentId: string, inv: Invoice, approve: boolean) => {
    try {
      await api.patchInvoice(parentId, inv.id, {
        status: approve ? "paid" : "unpaid",
        actor: "admin",
      });
      await refreshAll();
      openSnackbar({
        text: approve ? "Đã duyệt thanh toán." : "Đã từ chối, hóa đơn trở về chưa thanh toán.",
        type: "success",
      });
    } catch (e: any) {
      openSnackbar({ text: e?.message || "Không thể cập nhật hóa đơn.", type: "error" });
    }
  };

  const createInvoice = async () => {
    if (!addFor || !month.trim() || !amount.trim() || !dueDate.trim()) {
      openSnackbar({ text: "Vui lòng nhập đầy đủ thông tin hóa đơn.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await api.createInvoice({ parentId: addFor, month: month.trim(), amount: amount.trim(), dueDate: dueDate.trim() });
      await refreshAll();
      setMonth("");
      setAmount("");
      setDueDate("");
      setAddFor(null);
      openSnackbar({ text: "Đã tạo hóa đơn và gửi thông báo cho phụ huynh!", type: "success" });
    } catch (e: any) {
      openSnackbar({ text: e?.message || "Không thể tạo hóa đơn.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Quản lý học phí" showBackIcon={false} />

      <Box p={4} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {parents.map((p) => {
          const invoices = invoicesMap[p.id] ?? [];
          return (
            <Box
              key={p.id}
              p={4}
              style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
            >
              <Box flex flexDirection="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Box>
                  <Text bold size="small">
                    {p.studentName} · {p.className}
                  </Text>
                  <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                    PH: {p.name}
                  </Text>
                </Box>
                <Text
                  size="xSmall"
                  style={{ color: "#2f7dfa", cursor: "pointer" }}
                  onClick={() => setAddFor(p.id)}
                >
                  + Tạo hóa đơn
                </Text>
              </Box>

              {invoices.length === 0 ? (
                <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                  Chưa có hóa đơn nào.
                </Text>
              ) : (
                invoices.map((inv) => (
                  <Box
                    key={inv.id}
                    onClick={() => togglePaid(p.id, inv)}
                    p={3}
                    mb={2}
                    style={{
                      background: inv.status === "paid" ? "#f0fdf4" : inv.status === "pending" ? "#fff7e6" : "#fef2f2",
                      borderRadius: 10,
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      cursor: inv.status === "pending" ? "default" : "pointer",
                    }}
                  >
                    <Box>
                      <Text size="small" bold>
                        {inv.month}
                      </Text>
                      <Text size="xxSmall" style={{ color: "#8a8a8e" }}>
                        Hạn: {inv.dueDate} {inv.transferContent ? `· ND CK: ${inv.transferContent}` : ""}
                      </Text>
                    </Box>
                    <Box textAlign="right">
                      <Text
                        size="small"
                        bold
                        style={{ color: inv.status === "paid" ? "#10b981" : inv.status === "pending" ? "#f59e0b" : "#ef4444" }}
                      >
                        {formatCurrency(inv.amount)}
                      </Text>
                      <Text size="xxSmall" style={{ color: "#8a8a8e" }}>
                        {inv.status === "paid"
                          ? "✓ Đã thu · chạm để hoàn tác"
                          : inv.status === "pending"
                          ? `⏳ Chờ duyệt · ${inv.method ?? ""}`
                          : "Chạm để đánh dấu đã thu"}
                      </Text>
                    </Box>
                    {inv.status === "pending" && (
                      <Box flex flexDirection="row" style={{ width: "100%", gap: 8, marginTop: 8 }}>
                        <Button size="small" fullWidth onClick={() => reviewPending(p.id, inv, true)}>
                          ✓ Duyệt đã thanh toán
                        </Button>
                        <Button size="small" fullWidth variant="secondary" onClick={() => reviewPending(p.id, inv, false)}>
                          ✕ Từ chối
                        </Button>
                      </Box>
                    )}
                  </Box>
                ))
              )}
            </Box>
          );
        })}
      </Box>

      <Sheet visible={!!addFor} onClose={() => setAddFor(null)} autoHeight mask handler>
        <Box p={5}>
          <Text.Title size="small">Tạo hóa đơn mới</Text.Title>
          <Box mt={3}>
            <Input
              label="Tháng học phí"
              placeholder="VD: Tháng 10/2026"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
            />
          </Box>
          <Box mt={3}>
            <Input
              label="Số tiền (VNĐ)"
              placeholder="VD: 3500000"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </Box>
          <Box mt={3}>
            <Input
              label="Hạn đóng"
              placeholder="VD: 05/10/2026"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Box>
          <Button fullWidth style={{ marginTop: 16 }} loading={saving} onClick={createInvoice}>
            Tạo & gửi thông báo
          </Button>
        </Box>
      </Sheet>

      <AdminTabBar />
    </Page>
  );
}
