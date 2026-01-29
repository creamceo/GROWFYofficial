// src/components/course/CourseViewPage.tsx
import React from "react";
import { Button } from "../../ui/Button";

export const CourseViewPage: React.FC = () => {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 14 }}>Видео 3/12</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "1px solid #5A6650",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            ←
          </button>
          <button
            style={{
              width: 36,
              height: 36,
              borderRadius: 999,
              border: "1px solid #5A6650",
              background: "transparent",
              cursor: "pointer",
            }}
          >
            →
          </button>
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
              background: "#000",
              height: 340,
              overflow: "hidden",
            }}
          >
            <video
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              controls
            />
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
            }}
          >
            <p style={{ marginTop: 0 }}>Фрагменты текста текущего видео…</p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 16,
        }}
      >
        <Button variant="secondary">Выйти</Button>
        <Button>Редактировать</Button>
      </div>
    </div>
  );
};
