// frontend/src/components/Shell.jsx — replace whole file
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import ShelterMark from "./ShelterMark.jsx";

export default function Shell() {
  const { user, logout } = useAuth();

  const momLinks = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/epds", label: "Screening" },
    { to: "/crisis", label: "Immediate Help" },
    { to: "/nurse", label: "AI Nurse" },
    { to: "/community", label: "Bloom Space" },
    { to: "/learn", label: "Understanding PPD" },
    { to: "/help", label: "Emergency Help" },
  ];
  const familyLinks = [
    { to: "/", label: "Dashboard", end: true },
    { to: "/learn", label: "Understanding PPD" },
    { to: "/help", label: "Emergency Help" },
  ];
  const links = user?.role === "mom" ? momLinks : familyLinks;
  const teamLabel = user?.role === "mom" ? "Mother" : user?.linkedMom ? `${user.linkedMom.name}'s Team` : "Team Member";

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <ShelterMark className="brand-mark" />
          Bloom
        </div>
        <div className="topbar-right">
          <span className="role-pill">{teamLabel}</span>
          <span style={{ fontSize: 14, color: "var(--ink-soft)" }}>{user?.name}</span>
          <button className="logout-btn" onClick={logout}>Sign out</button>
        </div>
      </div>
      <div className="main-area">
        <nav className="sidenav">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={({ isActive }) => `navlink${isActive ? " active" : ""}`}>
              {l.label}
            </NavLink>
          ))}
        </nav>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}