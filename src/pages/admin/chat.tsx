import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Icon } from "zmp-ui";
import { parentUsersAtom, messagesAtom } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import AdminTabBar from "@/components/admin-tab-bar";

export default function AdminChatPage() {
  const parents = useAtomValue(parentUsersAtom);
  const messagesMap = useAtomValue(messagesAtom);
  const [activeParentId, setActiveParentId] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const activeParent = parents.find((p) => p.id === activeParentId) ?? null;
  const messages = activeParentId ? messagesMap[activeParentId] ?? [] : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, activeParentId]);

  const send = async () => {
    const value = text.trim();
    if (!value || !activeParentId || sending) return;
    setText("");
    setSending(true);
    try {
      await api.sendMessage(activeParentId, "admin", value);
      await refreshAll();
    } finally {
      setSending(false);
    }
  };

  // Danh sách hội thoại (chưa chọn phụ huynh)
  if (!activeParentId || !activeParent) {
    return (
      <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
        <Header title="Tin nhắn phụ huynh" showBackIcon={false} />
        <Box p={4}>
          {parents.length === 0 && (
            <Text size="small" style={{ color: "#8a8a8e" }}>
              Chưa có phụ huynh nào. Vào "Quản lý phụ huynh" để thêm mới.
            </Text>
          )}
          {parents.map((p) => {
            const list = messagesMap[p.id] ?? [];
            const last = list[list.length - 1];
            return (
              <Box
                key={p.id}
                onClick={() => setActiveParentId(p.id)}
                p={3}
                mb={2}
                style={{
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 1px 6px rgba(0,0,0,0.05)",
                  cursor: "pointer",
                }}
              >
                <Text bold size="small">
                  {p.studentName} ({p.name})
                </Text>
                <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                  {last ? last.text : "Chưa có tin nhắn"}
                </Text>
              </Box>
            );
          })}
        </Box>
        <AdminTabBar />
      </Page>
    );
  }

  // Màn hình chat với 1 phụ huynh cụ thể
  return (
    <Page
      className="page mh-chat-page mh-with-header"
      style={{
        paddingBottom: 0,
        background: "#f5f7fb",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <Header
        title={`${activeParent.studentName} · ${activeParent.name}`}
        showBackIcon
        onBackClick={() => setActiveParentId(null)}
      />

      <Box style={{ flex: 1, overflowY: "auto", padding: "12px 16px", paddingBottom: 140 }}>
        {messages.map((m) => (
          <Box
            key={m.id}
            style={{
              display: "flex",
              justifyContent: m.sender === "admin" ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            <Box style={{ maxWidth: "75%" }}>
              <Box
                p={3}
                style={{
                  background: m.sender === "admin" ? "#1f2a56" : "#fff",
                  color: m.sender === "admin" ? "#fff" : "#111",
                  borderRadius:
                    m.sender === "admin" ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <Text size="small" style={{ color: m.sender === "admin" ? "#fff" : "#111" }}>
                  {m.text}
                </Text>
              </Box>
              <Text
                size="xxSmall"
                style={{
                  color: "#8a8a8e",
                  marginTop: 2,
                  textAlign: m.sender === "admin" ? "right" : "left",
                }}
              >
                {m.time}
              </Text>
            </Box>
          </Box>
        ))}
        <div ref={bottomRef} />
      </Box>

      <Box className="mh-chat-input-bar">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
          placeholder="Trả lời phụ huynh..."
          style={{
            flex: 1,
            border: "1px solid #e5e7eb",
            borderRadius: 20,
            padding: "10px 14px",
            outline: "none",
            fontSize: 14,
          }}
        />
        <Box
          onClick={send}
          style={{
            width: 40,
            height: 40,
            minWidth: 40,
            borderRadius: 999,
            background: "#1f2a56",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            opacity: sending ? 0.6 : 1,
          }}
        >
          <Icon icon="zi-send-solid" style={{ color: "#fff" }} />
        </Box>
      </Box>

      <AdminTabBar />
    </Page>
  );
}
