// src/components/material/MaterialEmptyPage.tsx
import React from "react";
import { colors } from "../../theme";

export const MaterialEmptyPage: React.FC = () => (
  <div
    style={{
      minHeight: 360,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 12,
    }}
  >
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: "50%",
        background:
          "linear-gradient(135deg, #C0C7B8, #9CA493)",
      }}
    />
    <div style={{ fontSize: 16, marginTop: 4 }}>
      Здесь пока ничего нет
    </div>
    <div
      style={{ fontSize: 14, color: colors.textSoft, maxWidth: 360, textAlign: "center" }}
    >
      Как только вы добавите материалы, они появятся на этой вкладке.
    </div>
  </div>
);
