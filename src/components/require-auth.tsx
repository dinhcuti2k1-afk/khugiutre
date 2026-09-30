import { ReactElement, useEffect } from "react";
import { useAtomValue } from "jotai";
import { useNavigate } from "zmp-ui";
import { currentUserAtom, UserRole } from "@/state/store";

interface RequireAuthProps {
  children: ReactElement;
  role?: UserRole;
}

/**
 * Bọc quanh 1 trang để bắt buộc phải đăng nhập mới xem được.
 * Nếu truyền `role`, chỉ tài khoản đúng vai trò đó mới được vào,
 * còn lại sẽ tự động điều hướng về đúng khu vực của họ.
 */
export default function RequireAuth({ children, role }: RequireAuthProps) {
  const user = useAtomValue(currentUserAtom);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (role && user.role !== role) {
      navigate(user.role === "admin" ? "/admin" : "/", { replace: true });
    }
  }, [user, role]);

  if (!user) return null;
  if (role && user.role !== role) return null;

  return children;
}
