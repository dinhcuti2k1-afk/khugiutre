import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Icon } from "zmp-ui";
import { messagesAtom, currentUserAtom } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import TabBar from "@/components/tab-bar";

export default function ChatPage() {
  const user = useAtomValue(currentUserAtom);
  const messagesMap = useAtomValue(messagesAtom);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const messages = user ? messagesMap[user.id] ?? [] : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const sendMessage = async () => {
    const value = text.trim();
    if (!value || !user || sending) return;
    setText("");
    setSending(true);
    try {
      await api.sendMessage(user.id, "me", value);
      await refreshAll();
    } finally {
      setSending(false);
    }
  };

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
      <Header title="Nhắn tin với Admin" showBackIcon={false} />

      <Box
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          paddingBottom: 140,
        }}
      >
        {messages.map((m) => (
          <Box
            key={m.id}
            style={{
              display: "flex",
              justifyContent: m.sender === "me" ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            {m.sender === "admin" && (
              <Box
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 999,
                  background: "#6d5bd0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 8,
                  flexShrink: 0,
                  fontSize: 14,
                }}
              >
                🌙
              </Box>
            )}
            <Box style={{ maxWidth: "75%" }}>
              <Box
                p={3}
                style={{
                  background: m.sender === "me" ? "#2f7dfa" : "#fff",
                  color: m.sender === "me" ? "#fff" : "#111",
                  borderRadius:
                    m.sender === "me"
                      ? "14px 14px 2px 14px"
                      : "14px 14px 14px 2px",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                }}
              >
                <Text
                  size="small"
                  style={{ color: m.sender === "me" ? "#fff" : "#111" }}
                >
                  {m.text}
                </Text>
              </Box>
              <Text
                size="xxSmall"
                style={{
                  color: "#8a8a8e",
                  marginTop: 2,
                  textAlign: m.sender === "me" ? "right" : "left",
                }}
              >
                {m.time}
              </Text>
            </Box>
          </Box>
        ))}
        <div ref={bottomRef} />
      </Box>

      {/* Ô nhập tin nhắn */}
      <Box className="mh-chat-input-bar">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
          placeholder="Nhập tin nhắn cho admin..."
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
          onClick={sendMessage}
          style={{
            width: 40,
            height: 40,
            minWidth: 40,
            borderRadius: 999,
            background: "#2f7dfa",
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

      <TabBar />
    </Page>
  );
}
