// src/components/mentor/LogoutConfirmModal.tsx
import React from "react";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export const LogoutConfirmModal: React.FC<Props> = ({
  open,
  onCancel,
  onConfirm,
}) => (
  <Modal open={open} onClose={onCancel} width={420}>
    <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
      Вы уверены, что хотите выйти?
    </div>
    <div style={{ fontSize: 14, marginBottom: 24 }}>
      Вы сможете снова войти в платформу Growfy в любой момент.
    </div>
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        gap: 12,
      }}
    >
      <Button variant="secondary" onClick={onCancel}>
        Отменить
      </Button>
      <Button variant="danger" onClick={onConfirm}>
        Выйти
      </Button>
    </div>
  </Modal>
);
