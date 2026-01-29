// src/components/course/LessonDemoPage.tsx
import React from "react";
import { Button } from "../../ui/Button";
import { colors } from "../../theme";
import { useNavigate } from "react-router-dom";

export const LessonDemoPage: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              display: "inline-flex",
              padding: "4px 10px",
              borderRadius: 999,
              border: "1px solid #766153",
              fontSize: 12,
              marginBottom: 10,
            }}
          >
            Демо‑версия
          </div>
          <h1 style={{ margin: 0, fontSize: 26 }}>
            Превью видеоурока
          </h1>
        </div>
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
              height: 320,
              position: "relative",
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
              maxHeight: 320,
              overflow: "auto",
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            <p
              style={{
                marginTop: 0,
                padding: 8,
                borderRadius: 10,
                background: "#E3E5DF",
              }}
            >
              Сегодня мы разберём, как Growfy помогает компаниям
              ускорять создание видеоуроков…
            </p>
            <p style={{ padding: 8 }}>
              На первом шаге вы загружаете суфлёр и презентацию, а
              затем выбираете AI‑аватара и голос.
            </p>
            <p style={{ padding: 8 }}>
              Система автоматически собирает видео и позволяет
              отредактировать результат перед публикацией.
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
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Вернуться
        </Button>
        <Button onClick={() => navigate("/lesson/final")}>
          Сохранить
        </Button>
      </div>
    </div>
  );
};
