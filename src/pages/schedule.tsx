import { useState } from "react";
import { useAtomValue } from "jotai";
import {
  Page,
  Header,
  Box,
  Text,
  Button,
  Input,
  Icon,
  List,
  useSnackbar,
} from "zmp-ui";
import { schedulesAtom, currentUserAtom, ScheduleSubmission } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import TabBar from "@/components/tab-bar";

const STATUS_META: Record<
  ScheduleSubmission["status"],
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: {
    label: "Đang chờ duyệt",
    color: "#f59e0b",
    bg: "#fef3c7",
    icon: "zi-clock-1",
  },
  approved: {
    label: "Đã duyệt",
    color: "#10b981",
    bg: "#d1fae5",
    icon: "zi-check-circle-solid",
  },
  rejected: {
    label: "Từ chối",
    color: "#ef4444",
    bg: "#fee2e2",
    icon: "zi-close-circle-solid",
  },
};

export default function SchedulePage() {
  const user = useAtomValue(currentUserAtom);
  const schedulesMap = useAtomValue(schedulesAtom);
  const { openSnackbar } = useSnackbar();

  const [weekLabel, setWeekLabel] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const schedules = user ? schedulesMap[user.id] ?? [] : [];

  const handleSubmit = async () => {
    if (!user) return;
    if (!weekLabel.trim() || !content.trim()) {
      openSnackbar({
        text: "Vui lòng nhập đầy đủ tuần học và nội dung thời khóa biểu.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);
    try {
      await api.createSchedule({
        parentId: user.id,
        weekLabel: weekLabel.trim(),
        className: user.className ?? "",
        content: content.trim(),
      });
      await refreshAll();
      setWeekLabel("");
      setContent("");
      openSnackbar({ text: "Đã gửi thời khóa biểu cho admin!", type: "success" });
    } catch (e: any) {
      openSnackbar({ text: e?.message || "Không thể gửi thời khóa biểu.", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Thời khóa biểu" showBackIcon={false} />

      <Box p={4}>
        <Box
          p={4}
          style={{ background: "#fff", borderRadius: 16, boxShadow: "0 2px 10px rgba(0,0,0,0.06)" }}
        >
          <Text bold style={{ marginBottom: 12, display: "block" }}>
            Gửi thời khóa biểu mới
          </Text>

          <Input
            label="Tuần / thời gian áp dụng"
            placeholder="VD: Tuần 1 (22/09 - 28/09/2026)"
            value={weekLabel}
            onChange={(e) => setWeekLabel(e.target.value)}
          />

          <Box mt={3}>
            <Input.TextArea
              label="Nội dung thời khóa biểu"
              placeholder={
                "VD:\nThứ 2: Đón trẻ, ăn sáng, học vần A-B-C\nThứ 3: Vận động ngoài trời, ăn trưa, ngủ trưa\n..."
              }
              rows={5}
              showCount
              maxLength={800}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </Box>

          <Button fullWidth style={{ marginTop: 16 }} loading={submitting} onClick={handleSubmit}>
            Gửi cho admin
          </Button>
        </Box>

        <Text bold style={{ margin: "20px 0 8px" }}>
          Lịch sử đã gửi
        </Text>

        {schedules.length === 0 ? (
          <Text size="small" style={{ color: "#8a8a8e" }}>
            Chưa có thời khóa biểu nào được gửi.
          </Text>
        ) : (
          <List>
            {schedules.map((s) => {
              const meta = STATUS_META[s.status];
              return (
                <List.Item
                  key={s.id}
                  title={s.weekLabel}
                  subTitle={`Gửi lúc ${s.submittedAt}`}
                  prefix={
                    <Box
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: meta.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Icon icon={meta.icon as any} style={{ color: meta.color }} />
                    </Box>
                  }
                  suffix={
                    <Text size="xSmall" bold style={{ color: meta.color }}>
                      {meta.label}
                    </Text>
                  }
                >
                  <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                    {s.content.length > 80
                      ? s.content.slice(0, 80) + "…"
                      : s.content}
                  </Text>
                  {s.adminNote && (
                    <Text size="xSmall" style={{ color: "#ef4444", marginTop: 4 }}>
                      Ghi chú admin: {s.adminNote}
                    </Text>
                  )}
                </List.Item>
              );
            })}
          </List>
        )}
      </Box>

      <TabBar />
    </Page>
  );
}
