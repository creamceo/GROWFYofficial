// src/ui/Card.tsx
import React from "react";
import { colors, radius, shadows } from "../theme";

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  style,
  ...rest
}) => (
  <div
    {...rest}
    style={{
      borderRadius: radius.md,
      background: colors.surface,
      boxShadow: shadows.soft,
      padding: 20,
      ...style,
    }}
  />
);
