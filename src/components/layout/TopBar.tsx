// src/components/layout/TopBar.tsx
import React from "react";
import { Button } from "../../ui/Button";

type Props = {
  title: string;
  onCreateLesson?: () => void;
};

export const TopBar: React.FC<Props> = ({ title, onCreateLesson }) => {
  return (
    <header
      style={{
        height: 76,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 32px",
        borderBottom: "1px solid #D0D4C8",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 24,
          fontWeight: 600,
          letterSpacing: 0.02,
        }}
      >
        {title}
      </h2>
      {onCreateLesson && (
        <Button
          onClick={onCreateLesson}
          style={{ borderRadius: 20, height: 46 }}
        >
          Создать видеокурс
        </Button>
      )}
    </header>
  );
};
