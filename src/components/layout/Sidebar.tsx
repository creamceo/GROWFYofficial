// src/components/layout/Sidebar.tsx
import React from "react";
import { NavLink } from "react-router-dom";
import { colors, radius } from "../../theme";
import iconLogo from "../../assets/icon_logo.svg";

const navItems = [
  { to: "/courses", label: "Разработка курсов" },
  { to: "/material", label: "Материал" },
  { to: "/events", label: "Мероприятия" },
  { to: "/staff", label: "Сотрудники" },
];

type Props = { onMentorClick: () => void };

export const Sidebar: React.FC<Props> = ({ onMentorClick }) => {
  return (
    <aside
      style={{
        width: 260,
        background: "#E3E5DF",
        display: "flex",
        flexDirection: "column",
        padding: "24px 20px 20px",
        gap: 24,
      }}
    >
      <div style={{ height: 80, display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={iconLogo} alt="GROWFY" style={{ width: 26, height: 26 }} />
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
            }}
          >
            GROWFY
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            style={({ isActive }) => ({
              height: 48,
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              textDecoration: "none",
              fontSize: 15,
              color: isActive ? colors.textMain : colors.textSoft,
              background: isActive ? "#D6DACF" : "transparent",
              borderLeft: isActive
                ? `4px solid ${colors.primaryDark}`
                : "4px solid transparent",
            })}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onMentorClick}
        style={{
          marginTop: "auto",
          border: "none",
          padding: 0,
          background: "transparent",
          cursor: "pointer",
        }}
      >
        <div
          style={{
            borderRadius: radius.md,
            padding: 16,
            background: "rgba(247,248,245,0.86)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #C0C8B8, #909887)",
            }}
          />
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>Иван Иванов</div>
            <div style={{ fontSize: 13, color: colors.textSoft }}>Ментор</div>
          </div>
        </div>
      </button>
    </aside>
  );
};
