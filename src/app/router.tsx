import { createBrowserRouter } from "react-router-dom";

import { RootLayout } from "./layouts/RootLayout";

import { LoginPage } from "../pages/Auth/LoginPage";
import { ProfileSetupPage } from "../pages/Auth/ProfileSetupPage";
import { AddFriendPage } from "../pages/Home/AddFriendPage";
import { MainPage } from "../pages/Home/MainPage";
import { NotificationPage } from "../pages/Home/NotificationPage";
import { NotificationSettingPage } from "../pages/Home/NotificationSettingPage";
import { MyPage } from "../pages/MyPage/MyPage";
import { OnBoardingPage } from "../pages/Onboarding/OnBoardingPage";
import { RecordPage } from "../pages/Record/RecordPage";
import { SplashPage } from "../pages/Splash/SplashPage";
import { TimelinePage } from "../pages/Timeline/TimelinePage";
import { TimelineFriendSelectPage } from "../pages/Timeline/TimelineFriendSelectPage";
import { TimelineVideoPreviewPage } from "../pages/Timeline/TimelineVideoPreviewPage";
import { FriendsPage } from "../pages/MyPage/FriendsPage";


export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <SplashPage /> },
      { path: "/login", element: <LoginPage /> },
      { path: "/profile-setup", element: <ProfileSetupPage /> },
      { path: "/onboarding", element: <OnBoardingPage /> },

      { path: "/home", element: <MainPage /> },
      { path: "/home/friends/add", element: <AddFriendPage /> },
      { path: "/home/notifications", element: <NotificationPage /> },
      {
        path: "/home/notifications/settings",
        element: <NotificationSettingPage />,
      },
      { path: "/home/record", element: <RecordPage /> },

      { path: "/mypage", element: <MyPage /> },
      { path: "/mypage/friends", element: <FriendsPage /> },

      // 본인 타임라인
      { path: "/timeline", element: <TimelinePage /> },

      // 친구 타임라인
      { path: "/timeline/:userId", element: <TimelinePage /> },

      // 지난 경기 타임라인
      {
        path: "/timeline/history/:gameId",
        element: <TimelinePage />,
      },
      {
        path: "/timeline/save/friend",
        element: <TimelineFriendSelectPage />,
      },
      {
        path: "/timeline/video-preview",
        element: <TimelineVideoPreviewPage />,
      },
    ],
  },
]);