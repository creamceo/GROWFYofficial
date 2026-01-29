// src/components/course/CourseGrid.tsx
import React from "react";
import { Card } from "../../ui/Card";
import { ProgressBar } from "../../ui/ProgressBar";
import { Button } from "../../ui/Button";

const courses = [
  {
    id: 1,
    title: "Онбординг менеджеров розницы",
    image: "",
    total: 7,
    watched: 3,
  },
  {
    id: 2,
    title: "Стандарты сервиса X5",
    image: "",
    total: 5,
    watched: 1,
  },
  {
    id: 3,
    title: "Работа с возражениями",
    image: "",
    total: 9,
    watched: 4,
  },
];

export const CourseGrid: React.FC = () => {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 24,
      }}
    >
      {courses.map((course) => {
        const value = (course.watched / course.total) * 100;
        return (
          <Card
            key={course.id}
            style={{
              padding: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 18px 40px rgba(0,0,0,0.06)",
            }}
          >
            <div
              style={{
                height: 140,
                background:
                  "linear-gradient(135deg, #C6CEC0, #A3AD9A)",
              }}
            />
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  minHeight: 44,
                }}
              >
                {course.title}
              </div>
              <div style={{ fontSize: 13, color: "#5A6650" }}>
                {course.watched} из {course.total} видео просмотрено
              </div>
              <ProgressBar value={value} />
              <div
                style={{
                  marginTop: 10,
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Button
                  variant="secondary"
                  style={{ height: 36, paddingInline: 14 }}
                >
                  Просмотр
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
