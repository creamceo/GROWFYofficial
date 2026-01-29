// src/ui/Modal.tsx
import React from "react";
import { colors, radius, shadows } from "../theme";

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  width?: number;
  children: React.ReactNode;
};

export const Modal: React.FC<ModalProps> = ({
  open,
  onClose,
  width = 560,
  children,
}) => {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backdropFilter: "blur(18px)",
        background: "rgba(10,14,6,0.24)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 40,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width,
          maxWidth: "90vw",
          borderRadius: 20,
          padding: "32px 32px 24px",
          background:
            "linear-gradient(135deg, rgba(248,248,243,0.82), rgba(228,232,223,0.82))",
          boxShadow: shadows.soft,
          border: "1px solid rgba(255,255,255,0.6)",
          backdropFilter: "blur(22px)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};
