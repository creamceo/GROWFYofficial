// src/components/course/LessonFinalPage.tsx
import React from "react";
import { Button } from "../../ui/Button";
import { useNavigate } from "react-router-dom";

export const LessonFinalPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Видеоурок №3
        </div>
        <h1 style={{ margin: 0, fontSize: 26 }}>
          Итоговый видеоурок
        </h1>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)",
          gap: 32,
        }}
      >
        <div>
          <div
            style={{
              borderRadius: 20,
              overflow: "hidden",
              background: "#000",
              height: 340,
            }}
          >
            <video
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              controls
            >
              <source src="" />
            </video>
          </div>
        </div>

        <div>
          <h3 style={{ marginTop: 0, marginBottom: 10, fontSize: 18 }}>
            Транскрибация
          </h3>
          <div
            style={{
              borderRadius: 18,
              background: "#F7F8F5",
              padding: 16,
              maxHeight: 340,
              overflow: "auto",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {/* здесь — фактический текст транскрибации */}
            <p style={{ marginTop: 0 }}>
              Полный текст видеоурока доступен для чтения и
              копирования…
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <Button variant="secondary" onClick={() => navigate("/courses")}>
          Выйти
        </Button>
        <Button onClick={() => navigate("/lesson/edit")}>
          Редактировать
        </Button>
      </div>
    </div>
  );
};
