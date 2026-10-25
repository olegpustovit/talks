import { Navigate, Route, Routes } from "react-router-dom";
import { isStaticDeployment } from "./deployment";
import { Home } from "./Home";
import { Remote } from "./Remote";
import { TalkPage } from "./TalkPage";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      {!isStaticDeployment && <Route path="/remote" element={<Remote />} />}
      <Route path="/t/:slug" element={<TalkPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
