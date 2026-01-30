// src/components/layout/MainLayout.tsx
import React, { useState } from "react";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { MentorProfileModal } from "../mentor/MentorProfileModal";

const titleMap: Record<string, string> = {
  "/courses": "Разработка курсов",
  "/courses/create": "Создание курса",
  "/material": "Материал",
  "/events": "Мероприятия",
  "/staff": "Сотрудники",
};

export const MainLayout: React.FC = () => {
  const [mentorOpen, setMentorOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const title = titleMap[location.pathname] || "Окно ментора";

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "#EFF1ED",
      }}
    >
      <Sidebar onMentorClick={() => setMentorOpen(true)} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <TopBar
          title={title}
          onCreateLesson={
            location.pathname === "/courses" ? () => navigate("/courses/create") : undefined
          }
        />
        <main
          style={{
            padding: 32,
            maxWidth: 1600,
            width: "100%",
            margin: "0 auto",
          }}
        >
          <Outlet />
        </main>
      </div>

      <MentorProfileModal open={mentorOpen} onClose={() => setMentorOpen(false)} />
    </div>
  );
};
