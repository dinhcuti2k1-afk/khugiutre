import { useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Button, Icon, Sheet, List, useSnackbar } from "zmp-ui";
import { invoicesAtom, currentUserAtom, paymentSettingsAtom, formatCurrency, Invoice } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import TabBar from "@/components/tab-bar";

const PAYMENT_METHODS = [
  { key: "bank", label: "Chuyển khoản ngân hàng (tự động đối soát)", icon: "zi-note" },
  { key: "zalopay", label: "Ví ZaloPay", icon: "zi-wallpaper" },
  { key: "cash", label: "Tiền mặt tại trường", icon: "zi-location" },
];

export default function TuitionPage() {
  const user = useAtomValue(currentUserAtom);
  const invoicesMap = useAtomValue(invoicesAtom);
  const paymentSettings = useAtomValue(paymentSettingsAtom);
  const { openSnackbar } = useSnackbar();

  const [selected, setSelected] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState<string | null>(null);
  const [paidSheet, setPaidSheet] = useState(false);
  const [sentMethod, setSentMethod] = useState("");
  const [confirming, setConfirming] = useState(false);

  const invoices = user ? invoicesMap[user.id] ?? [] : [];
  const unpaid = invoices.filter((i) => i.status === "unpaid");
  const pending = invoices.filter((i) => i.status === "pending");
  const paid = invoices.filter((i) => i.status === "paid");
  const unpaidTotal = unpaid.reduce((s, i) => s + i.amount, 0);

  const openInvoice = (inv: Invoice) => {
    setSelected(inv);
    setPayMethod(null);
  };

  const confirmPayment = async () => {
    if (!selected || !payMethod || !user) return;
    // Chuyển khoản ngân hàng: hệ thống tự đối soát qua webhook SePay / cron TheAPIBank,
    // phụ huynh không cần (và không nên) tự bấm xác nhận đã đóng.
    if (payMethod === "bank") return;

    const methodLabel = PAYMENT_METHODS.find((m) => m.key === payMethod)?.label ?? "";
    setConfirming(true);
    try {
      await api.patchInvoice(user.id, selected.id, { status: "pending", method: methodLabel, actor: "parent" });
      await refreshAll();
      setSelected(null);
      setSentMethod(methodLabel);
      setPaidSheet(true);
    } catch (e: any) {
      openSnackbar({ text: e?.message || "Không thể gửi yêu cầu thanh toán.", type: "error" });
    } finally {
      setConfirming(false);
    }
  };

  const bankReady = paymentSettings?.provider && paymentSettings.accountNumber;

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Đóng học phí" showBackIcon={false} />

      <Box p={4}>
        <Box
          p={4}
          style={{
            background: "linear-gradient(135deg,#2f7dfa,#5aa4ff)",
            borderRadius: 16,
            color: "#fff",
          }}
        >
          <Text size="xSmall" style={{ color: "rgba(255,255,255,0.85)" }}>
            Tổng học phí cần đóng
          </Text>
          <Text bold size="xLarge" style={{ color: "#fff" }}>
            {formatCurrency(unpaidTotal)}
          </Text>
          <Text size="xSmall" style={{ color: "rgba(255,255,255,0.85)" }}>
            {unpaid.length} khoản chưa thanh toán{pending.length > 0 ? ` · ${pending.length} khoản chờ admin duyệt` : ""}
          </Text>
        </Box>

        <Text bold style={{ margin: "16px 0 8px" }}>
          Cần thanh toán
        </Text>
        {unpaid.length === 0 && (
          <Text size="small" style={{ color: "#8a8a8e" }}>
            🎉 Bạn đã thanh toán đầy đủ học phí.
          </Text>
        )}
        <List>
          {unpaid.map((inv) => (
            <List.Item
              key={inv.id}
              title={inv.month}
              subTitle={`Hạn đóng: ${inv.dueDate}`}
              prefix={
                <Box
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: "#fdecea",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon icon="zi-warning-circle-solid" style={{ color: "#ef4444" }} />
                </Box>
              }
              suffix={
                <Box textAlign="right">
                  <Text bold style={{ color: "#ef4444" }}>
                    {formatCurrency(inv.amount)}
                  </Text>
                  <Text size="xSmall" style={{ color: "#2f7dfa" }}>
                    Thanh toán ›
                  </Text>
                </Box>
              }
              onClick={() => openInvoice(inv)}
            />
          ))}
        </List>

        {pending.length > 0 && (
          <>
            <Text bold style={{ margin: "20px 0 8px" }}>
              Chờ admin duyệt
            </Text>
            <List>
              {pending.map((inv) => (
                <List.Item
                  key={inv.id}
                  title={inv.month}
                  subTitle={`${inv.method ?? ""}${inv.requestedAt ? ` · gửi ${inv.requestedAt}` : ""}`}
                  prefix={
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "#fff7e6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon icon="zi-clock-1" style={{ color: "#f59e0b" }} />
                    </Box>
                  }
                  suffix={
                    <Box textAlign="right">
                      <Text bold style={{ color: "#f59e0b" }}>
                        {formatCurrency(inv.amount)}
                      </Text>
                      <Text size="xSmall" style={{ color: "#f59e0b" }}>
                        ⏳ Chờ duyệt
                      </Text>
                    </Box>
                  }
                />
              ))}
            </List>
          </>
        )}

        <Text bold style={{ margin: "20px 0 8px" }}>
          Lịch sử thanh toán
        </Text>
        {paid.length === 0 ? (
          <Text size="small" style={{ color: "#8a8a8e" }}>
            Chưa có lịch sử thanh toán.
          </Text>
        ) : (
          <List>
            {paid.map((inv) => (
              <List.Item
                key={inv.id}
                title={inv.month}
                subTitle={`${inv.method ?? ""} · ${inv.paidAt ?? ""}`}
                prefix={
                  <Box
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: "#e8f8ef",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon icon="zi-check-circle-solid" style={{ color: "#10b981" }} />
                  </Box>
                }
                suffix={
                  <Text bold style={{ color: "#10b981" }}>
                    {formatCurrency(inv.amount)}
                  </Text>
                }
              />
            ))}
          </List>
        )}
      </Box>

      {/* Sheet chọn phương thức thanh toán */}
      <Sheet
        visible={!!selected}
        onClose={() => setSelected(null)}
        autoHeight
        mask
        handler
        swipeToClose
      >
        {selected && (
          <Box p={5}>
            <Text.Title size="small">Thanh toán học phí</Text.Title>
            <Text size="small" style={{ color: "#8a8a8e", marginBottom: 12 }}>
              {selected.month} · {formatCurrency(selected.amount)}
            </Text>

            {PAYMENT_METHODS.map((m) => (
              <Box
                key={m.key}
                onClick={() => setPayMethod(m.key)}
                p={3}
                mb={2}
                style={{
                  border:
                    payMethod === m.key
                      ? "2px solid #2f7dfa"
                      : "1px solid #e5e7eb",
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                }}
              >
                <Icon icon={m.icon as any} />
                <Text>{m.label}</Text>
                {payMethod === m.key && (
                  <Icon
                    icon="zi-check-circle-solid"
                    style={{ color: "#2f7dfa", marginLeft: "auto" }}
                  />
                )}
              </Box>
            ))}

            {payMethod === "bank" && (
              <Box p={3} mt={1} style={{ background: "#f5f7fb", borderRadius: 12 }}>
                {bankReady ? (
                  <>
                    <Text size="small">
                      Chủ TK: <b>{paymentSettings?.accountName || "—"}</b>
                    </Text>
                    <Text size="small">
                      Số TK: <b>{paymentSettings?.accountNumber}</b> ({paymentSettings?.bankCode})
                    </Text>
                    <Text size="small">
                      Nội dung CK: <b>{selected.transferContent || "—"}</b>
                    </Text>
                    <Text size="xSmall" style={{ color: "#8a8a8e", marginTop: 6 }}>
                      Vui lòng chuyển khoản đúng số tiền & nội dung ở trên. Hệ thống sẽ tự động ghi
                      nhận đã thanh toán sau ít phút, không cần bấm xác nhận.
                    </Text>
                  </>
                ) : (
                  <Text size="xSmall" style={{ color: "#ef4444" }}>
                    Nhà trường chưa cấu hình cổng chuyển khoản tự động. Vui lòng liên hệ admin qua
                    mục Nhắn tin.
                  </Text>
                )}
              </Box>
            )}

            {(payMethod === "zalopay" || payMethod === "cash") && (
              <Text size="xSmall" style={{ color: "#8a8a8e", marginTop: 6 }}>
                {payMethod === "zalopay"
                  ? "Sau khi thanh toán bằng Ví ZaloPay, bấm nút bên dưới để gửi yêu cầu. Admin sẽ kiểm tra và duyệt — hóa đơn chỉ được ghi nhận đã đóng sau khi admin xác nhận."
                  : "Sau khi đóng tiền mặt tại trường, bấm nút bên dưới để gửi yêu cầu. Admin sẽ xác nhận khi nhận được tiền."}
              </Text>
            )}

            {payMethod !== "bank" && (
              <Button
                fullWidth
                style={{ marginTop: 12 }}
                disabled={!payMethod}
                loading={confirming}
                onClick={confirmPayment}
              >
                Gửi yêu cầu xác nhận thanh toán
              </Button>
            )}
          </Box>
        )}
      </Sheet>

      {/* Sheet thông báo thành công */}
      <Sheet visible={paidSheet} onClose={() => setPaidSheet(false)} autoHeight mask>
        <Box p={5} textAlign="center">
          <Icon
            icon="zi-clock-1"
            style={{ color: "#f59e0b", fontSize: 48 }}
          />
          <Text.Title size="small" style={{ marginTop: 8 }}>
            Đã gửi yêu cầu cho admin!
          </Text.Title>
          <Text size="small" style={{ color: "#8a8a8e", marginBottom: 16 }}>
            {sentMethod ? `Phương thức: ${sentMethod}. ` : ""}Hóa đơn sẽ được ghi nhận đã thanh toán sau khi admin
            duyệt. Bạn sẽ nhận thông báo ngay khi có kết quả.
          </Text>
          <Button fullWidth onClick={() => setPaidSheet(false)}>
            Đóng
          </Button>
        </Box>
      </Sheet>

      <TabBar />
    </Page>
  );
}
