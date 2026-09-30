import { useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Icon, Input, Button, useSnackbar } from "zmp-ui";
import { mealPlanAtom, foodNotesAtom, currentUserAtom } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import TabBar from "@/components/tab-bar";

export default function FoodPage() {
  const mealPlan = useAtomValue(mealPlanAtom);
  const foodNotes = useAtomValue(foodNotesAtom);
  const user = useAtomValue(currentUserAtom);
  const { openSnackbar } = useSnackbar();

  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const todayIndex = (new Date().getDay() + 6) % 7; // 0 = Thứ 2

  const sendNote = async () => {
    if (!note.trim() || !user) return;
    setSending(true);
    try {
      await api.addFoodNote({
        parentId: user.id,
        parentName: `${user.name} (${user.studentName ?? ""})`,
        content: note.trim(),
      });
      await refreshAll();
      setNote("");
      openSnackbar({ text: "Đã gửi ghi chú cho admin!", type: "success" });
    } catch (e: any) {
      openSnackbar({ text: e?.message || "Không thể gửi ghi chú.", type: "error" });
    } finally {
      setSending(false);
    }
  };

  const myNotes = foodNotes.filter((n) => n.parentId === user?.id);

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Thực đơn ăn uống" showBackIcon={false} />

      <Box p={4}>
        <Text bold style={{ marginBottom: 10, display: "block" }}>
          Thực đơn tuần này
        </Text>

        <Box style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {mealPlan.map((m, idx) => (
            <Box
              key={m.day}
              p={4}
              style={{
                background: "#fff",
                borderRadius: 14,
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                border: idx === todayIndex ? "2px solid #f59e0b" : "none",
              }}
            >
              <Box flex flexDirection="row" justifyContent="space-between" alignItems="center">
                <Text bold size="small">
                  {m.day}
                </Text>
                {idx === todayIndex && (
                  <Text size="xxSmall" bold style={{ color: "#f59e0b" }}>
                    HÔM NAY
                  </Text>
                )}
              </Box>
              <Box mt={2}>
                <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                  🌅 Bữa sáng
                </Text>
                <Text size="small">{m.breakfast}</Text>
              </Box>
              <Box mt={2}>
                <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                  🍚 Bữa trưa
                </Text>
                <Text size="small">{m.lunch}</Text>
              </Box>
              <Box mt={2}>
                <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                  🍪 Bữa xế
                </Text>
                <Text size="small">{m.snack}</Text>
              </Box>
            </Box>
          ))}
        </Box>

        <Box
          mt={5}
          p={4}
          style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
        >
          <Text bold style={{ marginBottom: 8, display: "block" }}>
            Ghi chú dị ứng / yêu cầu đặc biệt
          </Text>
          <Input.TextArea
            placeholder="VD: Bé bị dị ứng tôm cua, xin nhà trường lưu ý giúp ạ..."
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button fullWidth style={{ marginTop: 12 }} loading={sending} onClick={sendNote}>
            Gửi cho admin
          </Button>
        </Box>

        {myNotes.length > 0 && (
          <Box mt={4}>
            <Text bold style={{ marginBottom: 8, display: "block" }}>
              Ghi chú đã gửi
            </Text>
            {myNotes.map((n) => (
              <Box
                key={n.id}
                p={3}
                mb={2}
                style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
              >
                <Text size="small">{n.content}</Text>
                <Text size="xxSmall" style={{ color: "#8a8a8e", marginTop: 4 }}>
                  {n.time}
                </Text>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      <TabBar />
    </Page>
  );
}
