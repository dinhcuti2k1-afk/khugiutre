import { useEffect, useRef, useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Button, Input, useSnackbar } from "zmp-ui";
import { paymentSettingsAtom } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import AdminTabBar from "@/components/admin-tab-bar";

type Provider = "sepay" | "thueapibank" | null;

export default function AdminSettingsPage() {
  const settings = useAtomValue(paymentSettingsAtom);
  const { openSnackbar } = useSnackbar();

  const [provider, setProvider] = useState<Provider>(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [accountName, setAccountName] = useState("");
  const [transferPrefix, setTransferPrefix] = useState("MH");

  const [sepayWebhookToken, setSepayWebhookToken] = useState("");

  const [thueApiBaseUrl, setThueApiBaseUrl] = useState("");
  const [thueApiToken, setThueApiToken] = useState("");
  const [thueCronMinutes, setThueCronMinutes] = useState("5");

  const [saving, setSaving] = useState(false);

  // Chỉ nạp cấu hình từ server vào form ĐÚNG 1 LẦN (lần đầu có dữ liệu).
  // Trước đây mỗi 4 giây app đồng bộ lại dữ liệu → settings đổi tham chiếu → form bị
  // ghi đè về giá trị cũ trên server, làm lựa chọn SePay/TheAPIBank tự bỏ chọn sau vài giây.
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!settings || initializedRef.current) return;
    initializedRef.current = true;
    setProvider(settings.provider);
    setAccountNumber(settings.accountNumber || "");
    setBankCode(settings.bankCode || "");
    setAccountName(settings.accountName || "");
    setTransferPrefix(settings.transferPrefix || "MH");
    setSepayWebhookToken(settings.sepay?.webhookToken || "");
    setThueApiBaseUrl(settings.thueapibank?.apiBaseUrl || "");
    setThueApiToken(settings.thueapibank?.apiToken || "");
    setThueCronMinutes(String(settings.thueapibank?.cronIntervalMinutes ?? 5));
  }, [settings]);

  const save = async () => {
    setSaving(true);
    try {
      await api.savePaymentSettings({
        provider,
        accountNumber: accountNumber.trim(),
        bankCode: bankCode.trim(),
        accountName: accountName.trim(),
        transferPrefix: transferPrefix.trim() || "MH",
        sepay: { webhookToken: sepayWebhookToken.trim() },
        thueapibank: {
          apiBaseUrl: thueApiBaseUrl.trim(),
          apiToken: thueApiToken.trim(),
          cronIntervalMinutes: Number(thueCronMinutes) || 5,
        },
      });
      await refreshAll();
      openSnackbar({ text: "Đã lưu cấu hình cổng thanh toán!", type: "success" });
    } catch (e: any) {
      openSnackbar({ text: e?.message || "Không thể lưu cấu hình.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const ProviderBtn = ({ value, label, desc }: { value: Provider; label: string; desc: string }) => (
    <Box
      onClick={() => setProvider(value)}
      p={3}
      mb={2}
      style={{
        border: provider === value ? "2px solid #2f7dfa" : "1px solid #e5e7eb",
        borderRadius: 12,
        cursor: "pointer",
      }}
    >
      <Text bold size="small">
        {label}
      </Text>
      <Text size="xSmall" style={{ color: "#8a8a8e" }}>
        {desc}
      </Text>
    </Box>
  );

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Cài đặt thanh toán" showBackIcon={false} />

      <Box p={4}>
        <Text bold style={{ marginBottom: 10, display: "block" }}>
          Chọn cổng chuyển khoản ngân hàng
        </Text>
        <ProviderBtn
          value="sepay"
          label="SePay"
          desc="Có webhook — hệ thống tự đối soát ngay khi có giao dịch, tự tạo nội dung chuyển khoản riêng cho từng hóa đơn."
        />
        <ProviderBtn
          value="thueapibank"
          label="TheAPIBank (thuê API ngân hàng)"
          desc="Không có webhook — cần chạy cron job quét giao dịch định kỳ (xem thư mục server/src/cron)."
        />

        <Text bold style={{ margin: "20px 0 10px" }}>
          Thông tin tài khoản nhận tiền
        </Text>
        <Input label="Số tài khoản" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} />
        <Box mt={3}>
          <Input label="Ngân hàng" placeholder="VD: MBBank, Vietcombank..." value={bankCode} onChange={(e) => setBankCode(e.target.value)} />
        </Box>
        <Box mt={3}>
          <Input label="Chủ tài khoản" value={accountName} onChange={(e) => setAccountName(e.target.value)} />
        </Box>
        <Box mt={3}>
          <Input
            label="Tiền tố nội dung chuyển khoản"
            placeholder="VD: MH"
            value={transferPrefix}
            onChange={(e) => setTransferPrefix(e.target.value)}
          />
        </Box>

        {provider === "sepay" && (
          <>
            <Text bold style={{ margin: "20px 0 10px" }}>
              Cấu hình SePay
            </Text>
            <Input
              label="Webhook token (tự đặt, dán vào cấu hình Webhook trên SePay)"
              value={sepayWebhookToken}
              onChange={(e) => setSepayWebhookToken(e.target.value)}
            />
            <Text size="xSmall" style={{ color: "#8a8a8e", marginTop: 8 }}>
              Trỏ webhook SePay về: <b>https://domain-server-cua-ban/api/payments/sepay/webhook</b>
              <br />
              Header xác thực: <b>Authorization: Apikey {sepayWebhookToken || "<token>"}</b>
              <br />
              SePay sẽ tự gợi ý nội dung chuyển khoản cho khách theo mã hóa đơn — không cần cấu hình
              thêm gì khác.
            </Text>
          </>
        )}

        {provider === "thueapibank" && (
          <>
            <Text bold style={{ margin: "20px 0 10px" }}>
              Cấu hình TheAPIBank
            </Text>
            <Input
              label="API Base URL"
              placeholder="https://thueapibank.vn"
              value={thueApiBaseUrl}
              onChange={(e) => setThueApiBaseUrl(e.target.value)}
            />
            <Box mt={3}>
              <Input label="API Token" value={thueApiToken} onChange={(e) => setThueApiToken(e.target.value)} />
            </Box>
            <Box mt={3}>
              <Input
                type="number"
                label="Quét mỗi (phút)"
                value={thueCronMinutes}
                onChange={(e) => setThueCronMinutes(e.target.value)}
              />
            </Box>
            <Text size="xSmall" style={{ color: "#8a8a8e", marginTop: 8 }}>
              Cần chạy cron job trên server: <b>npm run cron:thueapibank</b> (xem README trong thư mục
              server/). TheAPIBank không hỗ trợ webhook nên bắt buộc phải quét định kỳ.
            </Text>
          </>
        )}

        <Button fullWidth style={{ marginTop: 20 }} loading={saving} onClick={save}>
          Lưu cấu hình
        </Button>
      </Box>

      <AdminTabBar />
    </Page>
  );
}
