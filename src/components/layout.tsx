import { getSystemInfo } from "zmp-sdk";
import {
  AnimationRoutes,
  App,
  Route,
  SnackbarProvider,
  ZMPRouter,
} from "zmp-ui";
import { AppProps } from "zmp-ui/app";

import RequireAuth from "@/components/require-auth";

import LoginPage from "@/pages/login";
import HomePage from "@/pages/index";
import TuitionPage from "@/pages/tuition";
import SchedulePage from "@/pages/schedule";
import FoodPage from "@/pages/food";
import NotificationsPage from "@/pages/notifications";
import ChatPage from "@/pages/chat";
import CarpoolPage from "@/pages/carpool";

import AdminDashboard from "@/pages/admin/dashboard";
import AdminTuitionPage from "@/pages/admin/tuition";
import AdminSchedulePage from "@/pages/admin/schedule";
import AdminFoodPage from "@/pages/admin/food";
import AdminChatPage from "@/pages/admin/chat";
import AdminParentsPage from "@/pages/admin/parents";
import AdminSettingsPage from "@/pages/admin/settings";
import AdminCarpoolPage from "@/pages/admin/carpool";

const Layout = () => {
  return (
    <App theme={getSystemInfo().zaloTheme as AppProps["theme"]}>
      <SnackbarProvider>
        <ZMPRouter>
          <AnimationRoutes>
            {/* Đăng nhập */}
            <Route path="/login" element={<LoginPage />}></Route>

            {/* Khu vực phụ huynh */}
            <Route
              path="/"
              element={
                <RequireAuth role="parent">
                  <HomePage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/tuition"
              element={
                <RequireAuth role="parent">
                  <TuitionPage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/schedule"
              element={
                <RequireAuth role="parent">
                  <SchedulePage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/food"
              element={
                <RequireAuth role="parent">
                  <FoodPage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/notifications"
              element={
                <RequireAuth role="parent">
                  <NotificationsPage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/chat"
              element={
                <RequireAuth role="parent">
                  <ChatPage />
                </RequireAuth>
              }
            ></Route>
            {/* Chở xe cấp 2 — chỉ phụ huynh có con lớp 6 trở lên mới dùng được,
                CarpoolPage tự kiểm tra & điều hướng về "/" nếu không đủ điều kiện */}
            <Route
              path="/carpool"
              element={
                <RequireAuth role="parent">
                  <CarpoolPage />
                </RequireAuth>
              }
            ></Route>

            {/* Khu vực Admin */}
            <Route
              path="/admin"
              element={
                <RequireAuth role="admin">
                  <AdminDashboard />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/admin/tuition"
              element={
                <RequireAuth role="admin">
                  <AdminTuitionPage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/admin/schedule"
              element={
                <RequireAuth role="admin">
                  <AdminSchedulePage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/admin/food"
              element={
                <RequireAuth role="admin">
                  <AdminFoodPage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/admin/chat"
              element={
                <RequireAuth role="admin">
                  <AdminChatPage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/admin/parents"
              element={
                <RequireAuth role="admin">
                  <AdminParentsPage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/admin/settings"
              element={
                <RequireAuth role="admin">
                  <AdminSettingsPage />
                </RequireAuth>
              }
            ></Route>
            <Route
              path="/admin/carpool"
              element={
                <RequireAuth role="admin">
                  <AdminCarpoolPage />
                </RequireAuth>
              }
            ></Route>
          </AnimationRoutes>
        </ZMPRouter>
      </SnackbarProvider>
    </App>
  );
};
export default Layout;
