// src/components/course/LessonCreationModal.tsx
import React, { useState } from "react";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { colors, radius } from "../../theme";
import { useNavigate } from "react-router-dom";

type Props = { open: boolean; onClose: () => void };

type Avatar = { id: string; name: string; tag: string; gender: "m" | "f" };
type Voice = { id: string; name: string; desc: string; gender: "m" | "f" };
type Format = { id: string; title: string; desc: string };

const avatars: Avatar[] = [
  { id: "ava1", name: "Алексей", tag: "Строгий", gender: "m" },
  { id: "ava2", name: "Мария", tag: "Дружелюбный", gender: "f" },
  { id: "ava3", name: "Игорь", tag: "Спокойный", gender: "m" },
  { id: "ava4", name: "Ева", tag: "Уверенный", gender: "f" },
];

const voices: Voice[] = [
  { id: "v1", name: "Алексей — баритон", desc: "Низкий, спокойный", gender: "m" },
  { id: "v2", name: "Игорь — нейтральный", desc: "Сдержанный, чёткий", gender: "m" },
  { id: "v3", name: "Мария — мягкий", desc: "Тёплый, вовлекающий", gender: "f" },
  { id: "v4", name: "Ева — деловой", desc: "Сдержанный, уверенный", gender: "f" },
];

const formats: Format[] = [
  {
    id: "avatar+slides",
    title: "Аватар + презентация",
    desc: "AI‑аватар рядом с слайдами",
  },
  {
    id: "slides+voice",
    title: "Презентация с голосом",
    desc: "Только слайды и дубляж",
  },
];

export const LessonCreationModal: React.FC<Props> = ({
  open,
  onClose,
}) => {
  const [scriptFiles, setScriptFiles] = useState<File[]>([]);
  const [deckFiles, setDeckFiles] = useState<File[]>([]);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [formatId, setFormatId] = useState<string | null>(null);

  const navigate = useNavigate();

  const selectedAvatar = avatars.find((a) => a.id === avatarId);
  const voiceOptions = voices.filter(
    (v) => !selectedAvatar || v.gender === selectedAvatar.gender
  );
  const canContinue =
    scriptFiles.length > 0 &&
    avatarId &&
    voiceId &&
    formatId;

  const handleScriptUpload = (files: FileList | null) => {
    if (!files) return;
    setScriptFiles(Array.from(files));
  };

  const handleDeckUpload = (files: FileList | null) => {
    if (!files) return;
    setDeckFiles(Array.from(files));
  };

  const goNext = () => {
    if (!canContinue) return;
    onClose();
    navigate("/lesson/demo");
  };

  return (
    <Modal open={open} onClose={onClose} width={1180}>
      <div style={{ textAlign: "center", marginBottom: 20 }}>
        <div
          style={{
            fontSize: 13,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: colors.textSoft,
            marginBottom: 8,
          }}
        >
          COMPANY NAME
        </div>
        <div style={{ fontSize: 28, fontWeight: 600, marginBottom: 8 }}>
          Создание видеоурока
        </div>
        <div style={{ fontSize: 14, color: colors.textSoft }}>
          Загрузите материалы и выберите AI‑аватар.
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 5.5fr) minmax(0, 6.5fr)",
          gap: 32,
          marginTop: 24,
        }}
      >
        {/* Левая колонка — файлы */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <section
            style={{
              borderRadius: 20,
              background: "rgba(247,248,245,0.92)",
              padding: 20,
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Файл суфлёра</h3>
            <div
              style={{
                fontSize: 13,
                color: colors.textSoft,
                marginBottom: 16,
              }}
            >
              Поддерживаемые форматы: PDF, DOCX, TXT. До 50 МБ.
            </div>

            <label
              style={{
                borderRadius: 18,
                border: "1px dashed rgba(90,102,80,0.7)",
                padding: "18px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.full,
                  border: "1.4px solid #5A6650",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                ⬆
              </div>
              <div style={{ fontSize: 14 }}>
                Перетащите файл или выберите на компьютере
              </div>
              <input
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleScriptUpload(e.target.files)}
              />
            </label>

            {scriptFiles.length > 0 && (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginTop: 14,
                  fontSize: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {scriptFiles.map((file) => (
                  <li
                    key={file.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {file.name} · {(file.size / 1024).toFixed(0)} КБ
                    </span>
                    <button
                      onClick={() =>
                        setScriptFiles((prev) =>
                          prev.filter((f) => f.name !== file.name)
                        )
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#766153",
                        fontSize: 16,
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section
            style={{
              borderRadius: 20,
              background: "rgba(247,248,245,0.92)",
              padding: 20,
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Файл презентации</h3>
            <div
              style={{
                fontSize: 13,
                color: colors.textSoft,
                marginBottom: 16,
              }}
            >
              Поддерживаемые форматы: PPTX, PDF. Можно загрузить несколько.
            </div>

            <label
              style={{
                borderRadius: 18,
                border: "1px dashed rgba(90,102,80,0.7)",
                padding: "18px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 8,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: radius.full,
                  border: "1.4px solid #5A6650",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                }}
              >
                ⬆
              </div>
              <div style={{ fontSize: 14 }}>
                Перетащите презентацию или выберите файл
              </div>
              <input
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => handleDeckUpload(e.target.files)}
              />
            </label>

            {deckFiles.length > 0 && (
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  marginTop: 14,
                  fontSize: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                {deckFiles.map((file) => (
                  <li
                    key={file.name}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {file.name} · {(file.size / 1024).toFixed(0)} КБ
                    </span>
                    <button
                      onClick={() =>
                        setDeckFiles((prev) =>
                          prev.filter((f) => f.name !== file.name)
                        )
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#766153",
                        fontSize: 16,
                      }}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Правая колонка — аватар, голос, формат */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          <section>
            <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>AI‑аватар</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {avatars.map((a) => {
                const active = a.id === avatarId;
                return (
                  <button
                    key={a.id}
                    onClick={() => {
                      setAvatarId(a.id);
                      setVoiceId(null);
                    }}
                    style={{
                      borderRadius: 16,
                      padding: 10,
                      border: active
                        ? `1.5px solid ${colors.primaryDark}`
                        : "1px solid rgba(208,212,200,0.9)",
                      background: active ? "#F1F4EC" : "#F7F8F5",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        height: 80,
                        borderRadius: 12,
                        marginBottom: 8,
                        background:
                          "linear-gradient(135deg, #B0B8AA, #8D9585)",
                      }}
                    />
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                    >
                      {a.name}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: colors.textSoft,
                      }}
                    >
                      {a.tag}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>Голос</h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {voiceOptions.map((v) => {
                const active = v.id === voiceId;
                return (
                  <div
                    key={v.id}
                    style={{
                      borderRadius: 999,
                      border: active
                        ? `1.5px solid ${colors.primaryDark}`
                        : "1px solid rgba(208,212,200,0.9)",
                      padding: "8px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      cursor: "pointer",
                      background: active ? "#F1F4EC" : "#F7F8F5",
                    }}
                    onClick={() => setVoiceId(v.id)}
                  >
                    <div>
                      <div style={{ fontSize: 14 }}>{v.name}</div>
                      <div
                        style={{
                          fontSize: 12,
                          color: colors.textSoft,
                        }}
                      >
                        {v.desc}
                      </div>
                    </div>
                    <button
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 999,
                        border: "1px solid #5A6650",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 14,
                      }}
                      type="button"
                    >
                      ▶
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          <section>
            <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>Формат видео</h3>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {formats.map((f) => {
                const active = f.id === formatId;
                return (
                  <button
                    key={f.id}
                    onClick={() => setFormatId(f.id)}
                    style={{
                      borderRadius: 16,
                      padding: 12,
                      border: active
                        ? `1.5px solid ${colors.primaryDark}`
                        : "1px solid rgba(208,212,200,0.9)",
                      background: active ? "#F1F4EC" : "#F7F8F5",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        height: 70,
                        borderRadius: 12,
                        marginBottom: 10,
                        background:
                          "linear-gradient(135deg, #C4CDBC, #A5AF9D)",
                      }}
                    />
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: colors.textSoft,
                      }}
                    >
                      {f.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <div
        style={{
          marginTop: 26,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button variant="secondary" onClick={onClose}>
          Отменить
        </Button>
        <Button onClick={goNext} disabled={!canContinue}>
          Далее
        </Button>
      </div>
    </Modal>
  );
};
