import { defineConfig } from "vite";
import zaloMiniApp from "zmp-vite-plugin";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default () => {
  return defineConfig({
    root: "./src",
    base: "",
    // Đọc file .env ở thư mục gốc dự án (nơi đang có sẵn .env chứa APP_ID/ZMP_TOKEN),
    // để biến VITE_API_BASE_URL (địa chỉ backend đồng bộ dữ liệu) cũng được nạp từ đó.
    envDir: process.cwd(),
    plugins: [zaloMiniApp(), react()],
    build: {
      assetsInlineLimit: 0,
    },
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  });
};
