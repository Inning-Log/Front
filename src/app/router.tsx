import { createBrowserRouter } from "react-router-dom";

import { RootLayout } from "./layouts/RootLayout";
import { MainLayout } from "./layouts/MainLayout";
import { AuthLayout } from "./layouts/AuthLayout";

import { LoginPage } from "../pages/Auth/LoginPage";
import { MainPage } from "../pages/Home/MainPage";
import { AddFriendPage } from "../pages/Home/AddFriendPage";
import { NotificationPage } from "../pages/Home/NotificationPage";
import { NotificationSettingPage } from "../pages/Home/NotificationSettingPage";
import { MyPage } from "../pages/MyPage/MyPage";
import { OnBoardingPage } from "../pages/Onboarding/OnBoardingPage";
import { RecordPage } from "../pages/Record/RecordPage";
import { SplashPage } from "../pages/Splash/SplashPage";
import { TimelinePage } from "../pages/Timeline/TimelinePage";

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: "/", element: <SplashPage /> },
          { path: "/login", element: <LoginPage /> },
          { path: "/onboarding", element: <OnBoardingPage /> },
        ],
      },
      {
        element: <MainLayout />,
        children: [
          { path: "/home", element: <MainPage /> },
          { path: "/home/friends/add", element: <AddFriendPage /> },
          { path: "/home/notifications", element: <NotificationPage /> },
          {
            path: "/home/notifications/settings",
            element: <NotificationSettingPage />,
          },
          { path: "/mypage", element: <MyPage /> },
          { path: "/home/record", element: <RecordPage /> },
          { path: "/timeline", element: <TimelinePage /> },
        ],
      },
    ],
  },
]);
