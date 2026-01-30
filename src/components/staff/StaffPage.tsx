// src/components/staff/StaffPage.tsx
import React from "react";
import { Card } from "../../ui/Card";
import { colors } from "../../theme";

import annaPhoto from "../../assets/staff_anna.svg";
import igorPhoto from "../../assets/staff_igor.svg";
import nikitaPhoto from "../../assets/staff_nikita.svg";

type StaffMember = {
  id: string;
  name: string;
  role: string;
  team: string;
  photo: string;
};

const staff: StaffMember[] = [
  { id: "anna", name: "Анна Смирнова", role: "Методист", team: "Контент", photo: annaPhoto },
  { id: "igor", name: "Игорь Петров", role: "Продюсер курса", team: "Обучение", photo: igorPhoto },
  { id: "nikita", name: "Никита Волков", role: "Frontend разработчик", team: "Платформа", photo: nikitaPhoto },
];

export const StaffPage: React.FC = () => {
  return (
    <div>
      <div style={{ marginBottom: 18, color: colors.textSoft, fontSize: 14 }}>
        Команда, которая помогает создавать и запускать курсы.
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 16,
        }}
      >
        {staff.map((p) => (
          <Card key={p.id} style={{ padding: 18 }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <img
                src={p.photo}
                alt={p.name}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 18,
                  objectFit: "cover",
                  border: "1px solid rgba(0,0,0,0.06)",
                }}
              />
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 600,
                    color: colors.textMain,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {p.name}
                </div>
                <div style={{ fontSize: 14, color: colors.textSoft, marginTop: 2 }}>
                  {p.role}
                </div>
                <div
                  style={{
                    marginTop: 10,
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "6px 10px",
                    borderRadius: 999,
                    background: "rgba(214,218,207,0.7)",
                    fontSize: 12,
                    color: "#2F352B",
                  }}
                >
                  {p.team}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
