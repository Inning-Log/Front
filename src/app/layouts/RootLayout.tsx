import { Outlet } from "react-router-dom";

export function RootLayout() {
  return (
    <div className="min-h-dvh">
      <div className="mx-auto min-h-dvh w-full max-w-[430px] bg-white">
        <Outlet />
      </div>
    </div>
  );
}