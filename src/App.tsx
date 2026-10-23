import { RouterProvider } from "react-router-dom";

import { router } from "./app/router";
import { ForegroundNotificationInitializer } from "./shared/firebase/ForegroundNotificationInitializer";
import { PushRegistrationInitializer } from "./shared/firebase/PushRegistrationInitializer";

function App() {
  return (
    <>
      <PushRegistrationInitializer />
      <ForegroundNotificationInitializer />

      <RouterProvider router={router} />
    </>
  );
}

export default App;