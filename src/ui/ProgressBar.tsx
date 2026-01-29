// src/ui/ProgressBar.tsx
import React from "react";
import { colors, radius } from "../theme";

export const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div
    style={{
      width: "100%",
      height: 6,
      borderRadius: radius.full,
      background: "#D0D4C8",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        width: `${Math.min(Math.max(value, 0), 100)}%`,
        height: "100%",
        borderRadius: radius.full,
        background: "#295135",
      }}
    />
  </div>
);
