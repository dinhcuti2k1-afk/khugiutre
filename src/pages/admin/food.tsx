import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Button, Input, useSnackbar } from "zmp-ui";
import { mealPlanAtom, foodNotesAtom, MealDay } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import AdminTabBar from "@/components/admin-tab-bar";

export default function AdminFoodPage() {
  const mealPlan = useAtomValue(mealPlanAtom);
  const foodNotes = useAtomValue(foodNotesAtom);
  const { openSnackbar } = useSnackbar();

  const [draft, setDraft] = useState<MealDay[]>(mealPlan);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);

  // đồng bộ draft khi mealPlan từ server thay đổi, trừ khi admin đang chỉnh sửa dở dang
  useEffect(() => {
    if (!touched) setDraft(mealPlan);
  }, [mealPlan, touched]);

  const updateField = (idx: number, field: keyof MealDay, value: string) => {
    setTouched(true);
    setDraft((prev) =>
      prev.map((d, i) => (i === idx ? { ...d, [field]: value } : d))
    );
  };

  const saveAll = async () => {
    setSaving(true);
    try {
      await api.saveMealPlan(draft);
      await refreshAll();
      setTouched(false);
      openSnackbar({ text: "Đã cập nhật thực đơn cho phụ huynh xem!", type: "success" });
    } catch (e: any) {
      openSnackbar({ text: e?.message || "Không thể lưu thực đơn.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Quản lý thực đơn" showBackIcon={false} />

      <Box p={4}>
        <Text bold style={{ marginBottom: 10, display: "block" }}>
          Thực đơn tuần (chỉnh sửa trực tiếp)
        </Text>

        <Box style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {draft.map((m, idx) => (
            <Box
              key={m.day}
              p={4}
              style={{ background: "#fff", borderRadius: 14, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}
            >
              <Text bold size="small" style={{ marginBottom: 8, display: "block" }}>
                {m.day}
              </Text>
              <Input
                label="Bữa sáng"
                value={m.breakfast}
                onChange={(e) => updateField(idx, "breakfast", e.target.value)}
              />
              <Box mt={2}>
                <Input
                  label="Bữa trưa"
                  value={m.lunch}
                  onChange={(e) => updateField(idx, "lunch", e.target.value)}
                />
              </Box>
              <Box mt={2}>
                <Input
                  label="Bữa xế"
                  value={m.snack}
                  onChange={(e) => updateField(idx, "snack", e.target.value)}
                />
              </Box>
            </Box>
          ))}
        </Box>

        <Button fullWidth style={{ marginTop: 16 }} loading={saving} onClick={saveAll}>
          Lưu thực đơn
        </Button>

        <Text bold style={{ margin: "24px 0 8px" }}>
          Ghi chú dị ứng / yêu cầu từ phụ huynh
        </Text>
        {foodNotes.length === 0 ? (
          <Text size="small" style={{ color: "#8a8a8e" }}>
            Chưa có ghi chú nào.
          </Text>
        ) : (
          foodNotes.map((n) => (
            <Box
              key={n.id}
              p={3}
              mb={2}
              style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
            >
              <Text bold size="small">
                {n.parentName}
              </Text>
              <Text size="small">{n.content}</Text>
              <Text size="xxSmall" style={{ color: "#8a8a8e", marginTop: 4 }}>
                {n.time}
              </Text>
            </Box>
          ))
        )}
      </Box>

      <AdminTabBar />
    </Page>
  );
}
