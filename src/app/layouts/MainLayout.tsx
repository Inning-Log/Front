import { Outlet } from "react-router-dom";
import { BottomBar } from "./BottomBar";

export function MainLayout() {
  return (
    <>
      <main>
        <Outlet />
      </main>

      <BottomBar />
    </>
  );
}
