import { useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Icon, Button, Sheet, Input } from "zmp-ui";
import { carpoolAtom, usersAtom, CarpoolRegistration } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import AdminTabBar from "@/components/admin-tab-bar";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending: { label: "Chờ duyệt", color: "#f59e0b", bg: "#fef3c7" },
  approved: { label: "Đã duyệt", color: "#10b981", bg: "#d1fae5" },
  rejected: { label: "Từ chối", color: "#ef4444", bg: "#fee2e2" },
};

export default function AdminCarpoolPage() {
  const carpool = useAtomValue(carpoolAtom);
  const users = useAtomValue(usersAtom);

  const [rejecting, setRejecting] = useState<CarpoolRegistration | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const findParent = (id: string) => users.find((u) => u.id === id);

  const approve = async (item: CarpoolRegistration) => {
    await api.patchCarpool(item.id, { status: "approved" });
    await refreshAll();
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    await api.patchCarpool(rejecting.id, {
      status: "rejected",
      adminNote: rejectNote.trim() || "Không sắp xếp được tuyến xe phù hợp",
    });
    await refreshAll();
    setRejecting(null);
    setRejectNote("");
  };

  const sorted = [...carpool].sort((a, b) => (a.status === "pending" ? -1 : 1));

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Chở xe cấp 2" showBackIcon={false} />

      <Box p={4}>
        {sorted.length === 0 && (
          <Text size="small" style={{ color: "#8a8a8e" }}>
            Chưa có đăng ký chở xe cấp 2 nào.
          </Text>
        )}

        {sorted.map((item) => {
          const parent = findParent(item.parentId);
          const meta = STATUS_META[item.status];
          return (
            <Box
              key={item.id}
              p={4}
              mb={3}
              style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
            >
              <Box flex flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Text bold size="small">
                    {item.studentName || parent?.studentName || "—"} · Lớp {item.grade ?? "—"}
                  </Text>
                  <Text size="xxSmall" style={{ color: "#8a8a8e" }}>
                    PH: {parent?.name} · {parent?.phone} · {item.createdAt}
                  </Text>
                </Box>
                <Text
                  size="xxSmall"
                  bold
                  style={{ color: meta.color, background: meta.bg, padding: "3px 8px", borderRadius: 8 }}
                >
                  {meta.label}
                </Text>
              </Box>

              <Box mt={2}>
                <Text size="small">
                  <Icon icon="zi-location" /> Đón: {item.pickupAddress}
                </Text>
                <Text size="small">
                  <Icon icon="zi-location-solid" /> Trả: {item.dropoffAddress}
                </Text>
                {item.pickupTime && (
                  <Text size="small">
                    <Icon icon="zi-clock-1" /> Giờ đón: {item.pickupTime}
                  </Text>
                )}
                {item.note && (
                  <Text size="xSmall" style={{ color: "#8a8a8e", marginTop: 4 }}>
                    Ghi chú: {item.note}
                  </Text>
                )}
                {item.adminNote && (
                  <Text size="xSmall" style={{ color: "#ef4444", marginTop: 4 }}>
                    Ghi chú admin: {item.adminNote}
                  </Text>
                )}
              </Box>

              {item.status === "pending" && (
                <Box flex flexDirection="row" style={{ gap: 8, marginTop: 12 }}>
                  <Button size="small" style={{ flex: 1 }} onClick={() => approve(item)}>
                    <Icon icon="zi-check-circle-solid" /> Duyệt
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    type="danger"
                    style={{ flex: 1 }}
                    onClick={() => setRejecting(item)}
                  >
                    <Icon icon="zi-close-circle-solid" /> Từ chối
                  </Button>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>

      <Sheet visible={!!rejecting} onClose={() => setRejecting(null)} autoHeight mask handler>
        <Box p={5}>
          <Text.Title size="small">Lý do từ chối</Text.Title>
          <Box mt={3}>
            <Input.TextArea
              placeholder="VD: Không sắp xếp được tuyến xe phù hợp..."
              rows={3}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </Box>
          <Button fullWidth style={{ marginTop: 16 }} type="danger" onClick={confirmReject}>
            Xác nhận từ chối
          </Button>
        </Box>
      </Sheet>

      <AdminTabBar />
    </Page>
  );
}
