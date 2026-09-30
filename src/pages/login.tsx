import { useState } from "react";
import { useSetAtom } from "jotai";
import { Page, Box, Text, Input, Button, useSnackbar, useNavigate } from "zmp-ui";
import { currentUserIdAtom } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";

export default function LoginPage() {
  const setCurrentUserId = useSetAtom(currentUserIdAtom);
  const navigate = useNavigate();
  const { openSnackbar } = useSnackbar();

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!phone.trim() || !password) {
      openSnackbar({ text: "Vui lòng nhập số điện thoại và mật khẩu.", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const { user } = await api.login(phone.trim(), password);
      await refreshAll();
      setCurrentUserId(user.id);
      openSnackbar({ text: `Chào mừng ${user.name}!`, type: "success" });
      navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (e: any) {
      openSnackbar({
        text: e?.message || "Số điện thoại hoặc mật khẩu không đúng.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (phoneVal: string, pass: string) => {
    setPhone(phoneVal);
    setPassword(pass);
  };

  return (
    <Page
      className="page mh-login-page"
      style={{
        background: "linear-gradient(160deg,#6d5bd0 0%, #a084e8 55%, #f5f7fb 55%)",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box style={{ textAlign: "center", padding: "48px 16px 24px" }}>
        <div style={{ fontSize: 56 }}>🌙</div>
        <Text.Title size="large" style={{ color: "#fff", marginTop: 8 }}>
          Moon House
        </Text.Title>
        <Text style={{ color: "rgba(255,255,255,0.9)" }} size="small">
          Khu giữ trẻ Moon House
        </Text>
      </Box>

      <Box
        p={5}
        mx={4}
        style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          flex: "none",
        }}
      >
        <Text bold size="normal" style={{ marginBottom: 16, display: "block" }}>
          Đăng nhập
        </Text>

        <Input
          label="Số điện thoại"
          placeholder="Nhập số điện thoại"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Box mt={3}>
          <Input
            type="password"
            label="Mật khẩu"
            placeholder="Nhập mật khẩu"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Box>

        <Button fullWidth style={{ marginTop: 20 }} loading={loading} onClick={handleLogin}>
          Đăng nhập
        </Button>

        <Box mt={5}>
          <Text size="xSmall" style={{ color: "#8a8a8e", marginBottom: 8, display: "block" }}>
            Tài khoản demo (bấm để điền nhanh):
          </Text>
          <Box style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <Box
              onClick={() => quickFill("0900000001", "123456")}
              p={3}
              style={{ background: "#f5f7fb", borderRadius: 10, cursor: "pointer" }}
            >
              <Text size="small" bold>
                👨‍👩‍👧 Phụ huynh (bé Minh An)
              </Text>
              <Text size="xxSmall" style={{ color: "#8a8a8e" }}>
                SĐT: 0900000001 · Mật khẩu: 123456
              </Text>
            </Box>
            <Box
              onClick={() => quickFill("admin", "admin123")}
              p={3}
              style={{ background: "#f5f7fb", borderRadius: 10, cursor: "pointer" }}
            >
              <Text size="small" bold>
                🛠️ Admin nhà trường
              </Text>
              <Text size="xxSmall" style={{ color: "#8a8a8e" }}>
                SĐT: admin · Mật khẩu: admin123
              </Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Page>
  );
}
