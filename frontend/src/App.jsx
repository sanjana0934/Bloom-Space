// frontend/src/App.jsx — replace whole file
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Shell from "./components/Shell.jsx";
import MomDashboard from "./pages/MomDashboard.jsx";
import FamilyDashboard from "./pages/FamilyDashboard.jsx";
import EPDSForm from "./pages/EPDSForm.jsx";
import CrisisChat from "./pages/CrisisChat.jsx";
import AnonymousChat from "./pages/AnonymousChat.jsx";
import Education from "./pages/Education.jsx";
import AINurse from "./pages/AINurse.jsx";
import Helplines from "./pages/Helplines.jsx";

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-state">Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function MomOnly({ children }) {
  const { user } = useAuth();
  if (user?.role !== "mom") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/" /> : <Register />} />
      <Route
        path="/"
        element={
          <Protected>
            <Shell />
          </Protected>
        }
      >
        <Route index element={user?.role === "mom" ? <MomDashboard /> : <FamilyDashboard />} />
        <Route path="epds" element={<MomOnly><EPDSForm /></MomOnly>} />
        <Route path="crisis" element={<MomOnly><CrisisChat /></MomOnly>} />
        <Route path="nurse" element={<MomOnly><AINurse /></MomOnly>} />
        <Route path="community" element={<MomOnly><AnonymousChat /></MomOnly>} />
        <Route path="learn" element={<Education />} />
        <Route path="help" element={<Helplines />} />
      </Route>
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}