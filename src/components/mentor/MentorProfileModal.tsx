// src/components/mentor/MentorProfileModal.tsx
import React, { useState } from "react";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { colors } from "../../theme";
import { LogoutConfirmModal } from "./LogoutConfirmModal";
import { useNavigate } from "react-router-dom";

type Props = { open: boolean; onClose: () => void };

export const MentorProfileModal: React.FC<Props> = ({
  open,
  onClose,
}) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const navigate = useNavigate();

  const closeAll = () => {
    setConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <Modal open={open} onClose={onClose} width={520}>
        <div style={{ marginBottom: 24 }}>
          <div
            style={{
              fontSize: 24,
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Иван Иванов
          </div>
          <div
            style={{
              fontSize: 14,
              color: colors.textSoft,
              marginBottom: 20,
            }}
          >
            Профиль ментора
          </div>

          <div style={{ fontSize: 14, display: "grid", rowGap: 10 }}>
            <div>
              <div
                style={{
                  fontSize: 12,
                  color: colors.textSoft,
                  marginBottom: 2,
                }}
              >
                Дата присоединения
              </div>
              <div>15 февраля 2025</div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: colors.textSoft,
                  marginBottom: 2,
                }}
              >
                Создано курсов
              </div>
              <div>7</div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: colors.textSoft,
                  marginBottom: 2,
                }}
              >
                E‑mail
              </div>
              <div>mentor@growfy.ai</div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: colors.textSoft,
                  marginBottom: 2,
                }}
              >
                Номер телефона
              </div>
              <div>+1 (305) 555‑24‑24</div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 12,
                  color: colors.textSoft,
                  marginBottom: 2,
                }}
              >
                Компания
              </div>
              <div>Growfy / X5 Group</div>
            </div>
          </div>
        </div>

        <Button
          variant="danger"
          fullWidth
          onClick={() => setConfirmOpen(true)}
        >
          Выйти
        </Button>
      </Modal>

      <LogoutConfirmModal
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={() => {
          closeAll();
          navigate("/");
        }}
      />
    </>
  );
};
