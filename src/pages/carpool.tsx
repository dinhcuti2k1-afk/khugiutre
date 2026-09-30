import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Input, Button, Icon, useSnackbar, useNavigate } from "zmp-ui";
import { carpoolAtom, currentUserAtom, isCarpoolEligibleAtom } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import TabBar from "@/components/tab-bar";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Đang chờ xác nhận", color: "#f59e0b", bg: "#fef3c7" },
  approved: { label: "Đã xác nhận", color: "#10b981", bg: "#d1fae5" },
  rejected: { label: "Từ chối", color: "#ef4444", bg: "#fee2e2" },
};

export default function CarpoolPage() {
  const user = useAtomValue(currentUserAtom);
  const eligible = useAtomValue(isCarpoolEligibleAtom);
  const carpool = useAtomValue(carpoolAtom);
  const { openSnackbar } = useSnackbar();
  const navigate = useNavigate();

  const [pickupAddress, setPickupAddress] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [pickupTime, setPickupTime] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user && !eligible) {
      navigate("/", { replace: true });
    }
  }, [user, eligible]);

  if (!user || !eligible) return null;

  const myRegistrations = carpool.filter((c) => c.parentId === user.id);

  const submit = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      openSnackbar({ text: "Vui lòng nhập điểm đón và điểm trả.", type: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await api.registerCarpool({
        parentId: user.id,
        pickupAddress: pickupAddress.trim(),
        dropoffAddress: dropoffAddress.trim(),
        pickupTime: pickupTime.trim(),
        note: note.trim(),
      });
      await refreshAll();
      setPickupAddress("");
      setDropoffAddress("");
      setPickupTime("");
      setNote("");
      openSnackbar({ text: "Đã gửi đăng ký chở xe cấp 2 cho admin!", type: "success" });
    } catch (e: any) {
      openSnackbar({ text: e?.message || "Không thể gửi đăng ký.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Chở xe cấp 2" showBackIcon={false} />

      <Box p={4}>
        <Box
          p={4}
          style={{
            background: "linear-gradient(135deg,#0ea5e9,#38bdf8)",
            borderRadius: 16,
            color: "#fff",
          }}
        >
          <Text bold size="normal" style={{ color: "#fff" }}>
            🚐 Dịch vụ chở xe dành cho học sinh cấp 2
          </Text>
          <Text size="xSmall" style={{ color: "rgba(255,255,255,0.9)", marginTop: 4 }}>
            Áp dụng cho học sinh từ lớp 6 trở lên. Đăng ký điểm đón / trả để nhà trường sắp xếp xe.
          </Text>
        </Box>

        <Box
          mt={4}
          p={4}
          style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
        >
          <Text bold style={{ marginBottom: 12, display: "block" }}>
            Đăng ký mới
          </Text>

          <Input
            label="Điểm đón"
            placeholder="VD: 123 Nguyễn Văn Cừ, Quận 5"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
          />
          <Box mt={3}>
            <Input
              label="Điểm trả"
              placeholder="VD: Khu giữ trẻ Moon House"
              value={dropoffAddress}
              onChange={(e) => setDropoffAddress(e.target.value)}
            />
          </Box>
          <Box mt={3}>
            <Input
              label="Giờ đón mong muốn"
              placeholder="VD: 17:00"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
            />
          </Box>
          <Box mt={3}>
            <Input.TextArea
              label="Ghi chú thêm"
              placeholder="VD: Bé hay đợi ở cổng trường B..."
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Box>

          <Button fullWidth style={{ marginTop: 16 }} loading={submitting} onClick={submit}>
            Gửi đăng ký
          </Button>
        </Box>

        <Text bold style={{ margin: "20px 0 8px" }}>
          Đăng ký đã gửi
        </Text>
        {myRegistrations.length === 0 ? (
          <Text size="small" style={{ color: "#8a8a8e" }}>
            Chưa có đăng ký nào.
          </Text>
        ) : (
          myRegistrations.map((c) => {
            const meta = STATUS_META[c.status];
            return (
              <Box
                key={c.id}
                p={3}
                mb={2}
                style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
              >
                <Box flex flexDirection="row" justifyContent="space-between" alignItems="center">
                  <Text bold size="small">
                    {c.pickupAddress} → {c.dropoffAddress}
                  </Text>
                  <Text
                    size="xxSmall"
                    bold
                    style={{ color: meta.color, background: meta.bg, padding: "3px 8px", borderRadius: 8 }}
                  >
                    {meta.label}
                  </Text>
                </Box>
                {c.pickupTime && (
                  <Text size="xSmall" style={{ color: "#8a8a8e", marginTop: 4 }}>
                    <Icon icon="zi-clock-1" /> {c.pickupTime}
                  </Text>
                )}
                {c.note && (
                  <Text size="xSmall" style={{ color: "#8a8a8e", marginTop: 2 }}>
                    {c.note}
                  </Text>
                )}
                {c.adminNote && (
                  <Text size="xxSmall" style={{ color: "#ef4444", marginTop: 4 }}>
                    Ghi chú admin: {c.adminNote}
                  </Text>
                )}
              </Box>
            );
          })
        )}
      </Box>

      <TabBar />
    </Page>
  );
}
