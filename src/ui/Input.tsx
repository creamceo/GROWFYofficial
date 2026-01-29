// src/ui/Input.tsx
import React from "react";
import { colors, radius } from "../theme";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  rightSlot?: React.ReactNode;
};

export const Input: React.FC<InputProps> = ({
  label,
  error,
  rightSlot,
  style,
  ...rest
}) => {
  return (
    <div style={{ width: "100%" }}>
      {label && (
        <div
          style={{
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: colors.textSoft,
            marginBottom: 6,
          }}
        >
          {label}
        </div>
      )}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          borderRadius: radius.md,
          border: `1px solid ${colors.border}`,
          background: colors.surface,
          padding: "0 14px",
          height: 52,
          transition: "border-color 150ms, background 150ms",
        }}
      >
        <input
          {...rest}
          style={{
            border: "none",
            outline: "none",
            background: "transparent",
            color: colors.textMain,
            fontSize: 15,
            width: rightSlot ? "calc(100% - 40px)" : "100%",
            ...style,
          }}
        />
        {rightSlot && (
          <div
            style={{
              position: "absolute",
              right: 10,
              width: 32,
              height: 32,
              borderRadius: radius.full,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            {rightSlot}
          </div>
        )}
      </div>
      {error && (
        <div
          style={{
            marginTop: 6,
            fontSize: 12,
            color: "#766153",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: radius.full,
              background: "#766153",
            }}
          />
          {error}
        </div>
      )}
    </div>
  );
};
