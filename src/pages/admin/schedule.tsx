import { useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Icon, Button, Sheet, Input } from "zmp-ui";
import { parentUsersAtom, schedulesAtom, ScheduleSubmission } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import AdminTabBar from "@/components/admin-tab-bar";

const STATUS_META: Record<
  ScheduleSubmission["status"],
  { label: string; color: string; bg: string }
> = {
  pending: { label: "Đang chờ duyệt", color: "#f59e0b", bg: "#fef3c7" },
  approved: { label: "Đã duyệt", color: "#10b981", bg: "#d1fae5" },
  rejected: { label: "Từ chối", color: "#ef4444", bg: "#fee2e2" },
};

export default function AdminSchedulePage() {
  const parents = useAtomValue(parentUsersAtom);
  const schedulesMap = useAtomValue(schedulesAtom);

  const [rejecting, setRejecting] = useState<{ parentId: string; item: ScheduleSubmission } | null>(
    null
  );
  const [rejectNote, setRejectNote] = useState("");

  const allItems = parents.reduce<{ parent: (typeof parents)[number]; item: ScheduleSubmission }[]>(
    (acc, p) =>
      acc.concat((schedulesMap[p.id] ?? []).map((s) => ({ parent: p, item: s }))),
    []
  );
  allItems.sort((a, b) => (a.item.status === "pending" ? -1 : 1));

  const approve = async (parentId: string, item: ScheduleSubmission) => {
    await api.patchSchedule(parentId, item.id, { status: "approved" });
    await refreshAll();
  };

  const confirmReject = async () => {
    if (!rejecting) return;
    const { parentId, item } = rejecting;
    await api.patchSchedule(parentId, item.id, {
      status: "rejected",
      adminNote: rejectNote.trim() || "Cần chỉnh sửa lại",
    });
    await refreshAll();
    setRejecting(null);
    setRejectNote("");
  };

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Duyệt thời khóa biểu" showBackIcon={false} />

      <Box p={4}>
        {allItems.length === 0 && (
          <Text size="small" style={{ color: "#8a8a8e" }}>
            Chưa có thời khóa biểu nào được gửi.
          </Text>
        )}

        {allItems.map(({ parent, item }) => {
          const meta = STATUS_META[item.status];
          return (
            <Box
              key={item.id}
              p={4}
              mb={3}
              style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
            >
              <Box flex flexDirection="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Text bold size="small">
                    {item.weekLabel}
                  </Text>
                  <Text size="xxSmall" style={{ color: "#8a8a8e" }}>
                    {parent.studentName} · {parent.className} · {item.submittedAt}
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

              <Text size="small" style={{ marginTop: 8, whiteSpace: "pre-wrap" }}>
                {item.content}
              </Text>

              {item.adminNote && (
                <Text size="xSmall" style={{ color: "#ef4444", marginTop: 6 }}>
                  Ghi chú: {item.adminNote}
                </Text>
              )}

              {item.status === "pending" && (
                <Box flex flexDirection="row" style={{ gap: 8, marginTop: 12 }}>
                  <Button
                    size="small"
                    style={{ flex: 1 }}
                    onClick={() => approve(parent.id, item)}
                  >
                    <Icon icon="zi-check-circle-solid" /> Duyệt
                  </Button>
                  <Button
                    size="small"
                    variant="secondary"
                    type="danger"
                    style={{ flex: 1 }}
                    onClick={() => setRejecting({ parentId: parent.id, item })}
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
              placeholder="VD: Vui lòng bổ sung giờ ngủ trưa cho bé..."
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
