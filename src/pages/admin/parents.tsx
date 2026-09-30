import { useState } from "react";
import { useAtomValue } from "jotai";
import { Page, Header, Box, Text, Input, Button, Icon, Sheet, Modal, useSnackbar, useLocation } from "zmp-ui";
import { parentUsersAtom, invoicesAtom, formatCurrency } from "@/state/store";
import { api } from "@/lib/api";
import { refreshAll } from "@/state/sync";
import AdminTabBar from "@/components/admin-tab-bar";

export default function AdminParentsPage() {
  const parents = useAtomValue(parentUsersAtom);
  const invoicesMap = useAtomValue(invoicesAtom);
  const { openSnackbar } = useSnackbar();

  const location = useLocation();
  const [showAdd, setShowAdd] = useState<boolean>(!!(location.state as any)?.openAdd);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; label: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [className, setClassName] = useState("");
  const [email, setEmail] = useState("");
  const [childBirthYear, setChildBirthYear] = useState("");
  const [grade, setGrade] = useState("");

  const resetForm = () => {
    setPhone("");
    setPassword("");
    setName("");
    setStudentName("");
    setClassName("");
    setEmail("");
    setChildBirthYear("");
    setGrade("");
  };

  const submit = async () => {
    if (!phone.trim() || !password.trim() || !name.trim()) {
      openSnackbar({ text: "Vui lòng nhập đầy đủ SĐT, mật khẩu và tên phụ huynh.", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await api.addParent({
        phone: phone.trim(),
        password: password.trim(),
        name: name.trim(),
        studentName: studentName.trim(),
        className: className.trim(),
        email: email.trim(),
        childBirthYear: childBirthYear ? Number(childBirthYear) : null,
        grade: grade ? Number(grade) : null,
      });
      await refreshAll();
      resetForm();
      setShowAdd(false);
      openSnackbar({ text: "Đã thêm phụ huynh mới!", type: "success" });
    } catch (e: any) {
      openSnackbar({ text: e?.message || "Không thể thêm phụ huynh.", type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.deleteParent(deleteTarget.id);
      await refreshAll();
      setDeleteTarget(null);
      openSnackbar({ text: "Đã xóa phụ huynh.", type: "success" });
    } catch (e: any) {
      openSnackbar({ text: e?.message || "Không thể xóa phụ huynh.", type: "error" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Page className="page mh-with-header" style={{ background: "#f5f7fb" }}>
      <Header title="Quản lý phụ huynh" showBackIcon={false} />

      <Box p={4}>
        <Button fullWidth onClick={() => setShowAdd(true)}>
          <Icon icon="zi-plus" /> Thêm phụ huynh mới
        </Button>

        <Text bold style={{ margin: "20px 0 8px" }}>
          Danh sách phụ huynh ({parents.length})
        </Text>

        {parents.length === 0 && (
          <Text size="small" style={{ color: "#8a8a8e" }}>
            Chưa có phụ huynh nào.
          </Text>
        )}

        {parents.map((p) => {
          const inv = invoicesMap[p.id] ?? [];
          const unpaid = inv.filter((i) => i.status === "unpaid").reduce((s, i) => s + i.amount, 0);
          return (
            <Box
              key={p.id}
              p={3}
              mb={2}
              style={{ background: "#fff", borderRadius: 12, boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}
            >
              <Box flex flexDirection="row" justifyContent="space-between" alignItems="flex-start">
                <Box>
                  <Text bold size="small">
                    {p.studentName || "(chưa có tên bé)"} · {p.className || "—"}
                  </Text>
                  <Text size="xSmall" style={{ color: "#8a8a8e" }}>
                    PH: {p.name} · {p.phone}
                  </Text>
                  {p.email && (
                    <Text size="xxSmall" style={{ color: "#8a8a8e" }}>
                      ✉️ {p.email}
                    </Text>
                  )}
                  <Text size="xxSmall" style={{ color: "#8a8a8e" }}>
                    {p.childBirthYear ? `Năm sinh con: ${p.childBirthYear}` : ""}
                    {p.grade ? ` · Khối: Lớp ${p.grade}` : ""}
                    {typeof p.grade === "number" && p.grade >= 6 ? " · ✅ Đủ ĐK chở xe cấp 2" : ""}
                  </Text>
                </Box>
                <Text size="xSmall" bold style={{ color: unpaid > 0 ? "#ef4444" : "#10b981" }}>
                  {unpaid > 0 ? formatCurrency(unpaid) : "Đã đóng đủ"}
                </Text>
              </Box>
              <Box flex flexDirection="row" justifyContent="flex-end" style={{ marginTop: 8 }}>
                <Button
                  size="small"
                  variant="tertiary"
                  onClick={() =>
                    setDeleteTarget({ id: p.id, label: `${p.studentName || "(chưa có tên bé)"} · PH ${p.name}` })
                  }
                  style={{ color: "#ef4444" }}
                >
                  🗑️ Xóa phụ huynh
                </Button>
              </Box>
            </Box>
          );
        })}
      </Box>

      {/* Nút nổi "+" luôn nằm sát góc phải, phía trên thanh menu dưới — không bao giờ bị thanh tiêu đề che */}
      <div className="mh-fab" onClick={() => setShowAdd(true)} role="button" aria-label="Thêm phụ huynh">
        <Icon icon="zi-plus" style={{ color: "#fff" }} />
      </div>

      <Modal
        visible={!!deleteTarget}
        title="Xóa phụ huynh?"
        description={`Bạn chắc chắn muốn xóa ${deleteTarget?.label ?? ""}? Toàn bộ hóa đơn, lịch học, tin nhắn và thông báo của phụ huynh này sẽ bị xóa vĩnh viễn, không khôi phục được.`}
        onClose={() => setDeleteTarget(null)}
        actions={[
          { text: "Hủy", close: true },
          { text: deleting ? "Đang xóa..." : "Xóa", danger: true, onClick: confirmDelete },
        ]}
      />

      <Sheet visible={showAdd} onClose={() => setShowAdd(false)} autoHeight mask handler swipeToClose>
        <Box p={5} style={{ maxHeight: "80vh", overflowY: "auto" }}>
          <Text.Title size="small">Thêm phụ huynh mới</Text.Title>

          <Box mt={3}>
            <Input label="Số điện thoại *" placeholder="VD: 0912345678" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </Box>
          <Box mt={3}>
            <Input label="Mật khẩu *" placeholder="Mật khẩu đăng nhập cho phụ huynh" value={password} onChange={(e) => setPassword(e.target.value)} />
          </Box>
          <Box mt={3}>
            <Input label="Tên phụ huynh *" placeholder="VD: Chị Hoa" value={name} onChange={(e) => setName(e.target.value)} />
          </Box>
          <Box mt={3}>
            <Input label="Tên học sinh" placeholder="VD: Bé An" value={studentName} onChange={(e) => setStudentName(e.target.value)} />
          </Box>
          <Box mt={3}>
            <Input label="Lớp / nhóm" placeholder="VD: Lớp Mầm 2 hoặc Lớp 7A" value={className} onChange={(e) => setClassName(e.target.value)} />
          </Box>
          <Box mt={3}>
            <Input label="Email" placeholder="VD: phuhuynh@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </Box>
          <Box mt={3}>
            <Input
              label="Năm sinh của con"
              placeholder="VD: 2013"
              type="number"
              value={childBirthYear}
              onChange={(e) => setChildBirthYear(e.target.value)}
            />
          </Box>
          <Box mt={3}>
            <Input
              label="Khối lớp (số, để xét quyền Chở xe cấp 2)"
              placeholder="VD: 7 (từ lớp 6 trở lên sẽ hiện tính năng Chở xe cấp 2)"
              type="number"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
            />
          </Box>

          <Button fullWidth style={{ marginTop: 20 }} loading={saving} onClick={submit}>
            Lưu phụ huynh
          </Button>
        </Box>
      </Sheet>

      <AdminTabBar />
    </Page>
  );
}
