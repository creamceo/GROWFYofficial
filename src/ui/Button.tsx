// src/ui/Button.tsx
import React from "react";
import { colors, radius } from "../theme";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  fullWidth?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  fullWidth,
  style,
  ...rest
}) => {
  let bg = "transparent";
  let color = colors.textMain;
  let border = `1px solid transparent`;

  if (variant === "primary") {
    bg = colors.primary;
    color = "#000000";
  } else if (variant === "secondary") {
    bg = "transparent";
    color = colors.textMain;
    border = `1px solid ${colors.textSoft}`;
  } else if (variant === "ghost") {
    bg = "transparent";
    color = colors.textSoft;
  } else if (variant === "danger") {
    bg = colors.accentDark;
    color = "#ffffff";
  }

  return (
    <button
      {...rest}
      style={{
        border,
        background: bg,
        color,
        borderRadius: radius.full,
        height: 48,
        padding: "0 20px",
        fontSize: 15,
        lineHeight: 1,
        cursor: rest.disabled ? "default" : "pointer",
        opacity: rest.disabled ? 0.4 : 1,
        transition: "background 180ms ease, transform 150ms ease, opacity 150ms",
        width: fullWidth ? "100%" : undefined,
        ...style,
      }}
      onMouseDown={(e) => {
        rest.onMouseDown?.(e);
        if (!rest.disabled) (e.currentTarget.style.transform = "translateY(1px)");
      }}
      onMouseUp={(e) => {
        rest.onMouseUp?.(e);
        (e.currentTarget.style.transform = "translateY(0)");
      }}
    />
  );
};
