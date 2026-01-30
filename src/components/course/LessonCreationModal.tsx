// src/components/course/LessonCreationModal.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import { colors, radius } from "../../theme";
import { useNavigate } from "react-router-dom";

// formats
import format1Img from "../../assets/formats/format_1.png";
import format2Img from "../../assets/formats/format_2.png";

// avatars (female)
import avaF1 from "../../assets/avatars/IMG_20260128_123336_559.jpg";
import avaF2 from "../../assets/avatars/IMG_20260128_123338_177.jpg";
import avaF3 from "../../assets/avatars/IMG_20260128_123338_714.jpg";
// avatars (male)
import avaM1 from "../../assets/avatars/IMG_20260128_123346_539.jpg";
import avaM2 from "../../assets/avatars/IMG_20260128_123343_741.jpg";
import avaM3 from "../../assets/avatars/IMG_20260128_123345_121.jpg";

// voices
import voiceM1Src from "../../assets/voices/1a74d9ca-142e-4b47-a41a-a0d011f5fb40.mp3";
import voiceM2Src from "../../assets/voices/fca6f005-1585-4e28-b497-24f7bda63b2e.mp3";
import voiceF1Src from "../../assets/voices/1cf22674-3ceb-4e83-83ea-875e7e116f68.mp3";
import voiceF2Src from "../../assets/voices/46a0ad32-8920-4f90-909f-95c911ffebdd.mp3";

type Props = { open: boolean; onClose: () => void };

type Avatar = {
  id: string; // UUID (для отправки на сервер)
  name: string;
  gender: "m" | "f";
  img: string;
};

type Voice = {
  id: string; // filename (для отправки на сервер)
  label: string; // Мужской 1 / Женский 2 ...
  gender: "m" | "f";
  src: string;
};

type Format = { id: string; title: string; desc: string; img: string };

const avatars: Avatar[] = [
  // женские
  {
    id: "498b0bdc-3354-4930-b077-bf0e04162e26",
    name: "Женский 1",
    gender: "f",
    img: avaF1,
  },
  {
    id: "053a5918-9a5d-453a-8cac-929528258b92",
    name: "Женский 2",
    gender: "f",
    img: avaF2,
  },
  {
    id: "a235578f-f70c-4fd3-8aec-249de4ccc7a0",
    name: "Женский 3",
    gender: "f",
    img: avaF3,
  },
  // мужские
  {
    id: "5d8ca5d0-c954-400f-ae25-cd8bd781226c",
    name: "Мужской 1",
    gender: "m",
    img: avaM1,
  },
  {
    id: "56f6133f-a9d0-4661-b612-0e751e860d73",
    name: "Мужской 2",
    gender: "m",
    img: avaM2,
  },
  {
    id: "3425992f-0a93-4da7-b23e-b04c8def9f5d",
    name: "Мужской 3",
    gender: "m",
    img: avaM3,
  },
];

const voices: Voice[] = [
  // мужские
  {
    id: "1a74d9ca-142e-4b47-a41a-a0d011f5fb40.mp3",
    label: "Мужской 1",
    gender: "m",
    src: voiceM1Src,
  },
  {
    id: "fca6f005-1585-4e28-b497-24f7bda63b2e.mp3",
    label: "Мужской 2",
    gender: "m",
    src: voiceM2Src,
  },
  // женские
  {
    id: "1cf22674-3ceb-4e83-83ea-875e7e116f68.mp3",
    label: "Женский 1",
    gender: "f",
    src: voiceF1Src,
  },
  {
    id: "46a0ad32-8920-4f90-909f-95c911ffebdd.mp3",
    label: "Женский 2",
    gender: "f",
    src: voiceF2Src,
  },
];

const formats: Format[] = [
  {
    id: "format_1",
    title: "Презентация и Аватар",
    desc: "презентация 16:9 и аватар справа",
    img: format1Img,
  },
  {
    id: "format_2",
    title: "Презентация и Аватар",
    desc: "презентация 16:9 и Аватар поверх презентации",
    img: format2Img,
  },
];

export const LessonCreationModal: React.FC<Props> = ({ open, onClose }) => {
  const [scriptFiles, setScriptFiles] = useState<File[]>([]);
  const [deckFiles, setDeckFiles] = useState<File[]>([]);
  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [formatId, setFormatId] = useState<string | null>(null);

  // playback
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const navigate = useNavigate();

  const selectedAvatar = useMemo(
    () => avatars.find((a) => a.id === avatarId) || null,
    [avatarId]
  );

  // оставил фильтрацию по полу аватара — удобно (если не нужно, скажешь, уберу)
  const voiceOptions = useMemo(() => {
    if (!selectedAvatar) return voices;
    return voices.filter((v) => v.gender === selectedAvatar.gender);
  }, [selectedAvatar]);

  const canContinue = Boolean(
    scriptFiles.length > 0 && avatarId && voiceId && formatId
  );

  const isScriptSelected = scriptFiles.length > 0;
  const isDeckSelected = deckFiles.length > 0;

  const handleScriptUpload = (files: FileList | null) => {
    if (!files) return;
    setScriptFiles(Array.from(files));
  };

  const handleDeckUpload = (files: FileList | null) => {
    if (!files) return;
    setDeckFiles(Array.from(files));
  };

  const stopAnyAudio = () => {
    audioMapRef.current.forEach((a) => {
      a.pause();
      a.currentTime = 0;
    });
    setPlayingVoiceId(null);
  };

  const getAudio = (voice: Voice) => {
    const existing = audioMapRef.current.get(voice.id);
    if (existing) return existing;

    const audio = new Audio(voice.src);
    audio.preload = "none";
    audio.addEventListener("ended", () => {
      setPlayingVoiceId((cur) => (cur === voice.id ? null : cur));
    });
    audioMapRef.current.set(voice.id, audio);
    return audio;
  };

  const toggleVoicePlayback = (voice: Voice) => {
    const currentPlaying = playingVoiceId;

    // если кликаем на уже играющий — ставим на паузу
    if (currentPlaying === voice.id) {
      const a = getAudio(voice);
      a.pause();
      setPlayingVoiceId(null);
      return;
    }

    // иначе остановить все и играть выбранный
    audioMapRef.current.forEach((a) => a.pause());
    const a = getAudio(voice);
    a.currentTime = 0;
    a.play().then(() => setPlayingVoiceId(voice.id));
  };

  const goNext = () => {
    if (!canContinue) return;
    stopAnyAudio();
    onClose();
    navigate("/lesson/demo");
  };

  // при закрытии модалки — остановить звук
  useEffect(() => {
    if (!open) stopAnyAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // при смене аватара — сброс голоса/проигрывания (чтобы не было “не того пола”)
  useEffect(() => {
    setVoiceId(null);
    stopAnyAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarId]);

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
          Загрузите материалы и выберите аватар / голос / формат.
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
          {/* Суфлёр */}
          <section
            style={{
              borderRadius: 20,
              background: "rgba(247,248,245,0.92)",
              padding: 20,
              border: isScriptSelected
                ? `1.5px solid ${colors.primaryDark}`
                : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Файл суфлёра</h3>
            <div style={{ fontSize: 13, color: colors.textSoft, marginBottom: 16 }}>
              Поддерживаемые форматы: PDF, DOCX, TXT. До 50 МБ.
            </div>

            <label
              style={{
                borderRadius: 18,
                border: isScriptSelected
                  ? `1.5px solid ${colors.primaryDark}`
                  : "1px dashed rgba(90,102,80,0.7)",
                background: isScriptSelected ? "#F1F4EC" : "transparent",
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

              <div style={{ fontSize: 14, textAlign: "center" }}>
                {isScriptSelected ? (
                  <>
                    <div style={{ fontWeight: 600 }}>
                      Выбрано файлов: {scriptFiles.length}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 4 }}>
                      Нажмите, чтобы заменить / добавить
                    </div>
                  </>
                ) : (
                  "Перетащите файл или выберите на компьютере"
                )}
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
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.06)",
                      background: "rgba(255,255,255,0.55)",
                    }}
                  >
                    <span>
                      {file.name} · {(file.size / 1024).toFixed(0)} КБ
                    </span>
                    <button
                      onClick={() =>
                        setScriptFiles((prev) => prev.filter((f) => f.name !== file.name))
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#766153",
                        fontSize: 16,
                      }}
                      type="button"
                      aria-label="Удалить файл"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Презентация */}
          <section
            style={{
              borderRadius: 20,
              background: "rgba(247,248,245,0.92)",
              padding: 20,
              border: isDeckSelected
                ? `1.5px solid ${colors.primaryDark}`
                : "1px solid rgba(0,0,0,0.06)",
            }}
          >
            <h3 style={{ margin: "0 0 8px", fontSize: 18 }}>Файл презентации</h3>
            <div style={{ fontSize: 13, color: colors.textSoft, marginBottom: 16 }}>
              Поддерживаемые форматы: PPTX, PDF. Можно загрузить несколько.
            </div>

            <label
              style={{
                borderRadius: 18,
                border: isDeckSelected
                  ? `1.5px solid ${colors.primaryDark}`
                  : "1px dashed rgba(90,102,80,0.7)",
                background: isDeckSelected ? "#F1F4EC" : "transparent",
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

              <div style={{ fontSize: 14, textAlign: "center" }}>
                {isDeckSelected ? (
                  <>
                    <div style={{ fontWeight: 600 }}>
                      Выбрано файлов: {deckFiles.length}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 4 }}>
                      Нажмите, чтобы заменить / добавить
                    </div>
                  </>
                ) : (
                  "Перетащите презентацию или выберите файл"
                )}
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
                      padding: "8px 10px",
                      borderRadius: 12,
                      border: "1px solid rgba(0,0,0,0.06)",
                      background: "rgba(255,255,255,0.55)",
                    }}
                  >
                    <span>
                      {file.name} · {(file.size / 1024).toFixed(0)} КБ
                    </span>
                    <button
                      onClick={() =>
                        setDeckFiles((prev) => prev.filter((f) => f.name !== file.name))
                      }
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        color: "#766153",
                        fontSize: 16,
                      }}
                      type="button"
                      aria-label="Удалить файл"
                      title="Удалить"
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
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Аватары: 1 ряд = фото + имя */}
          <section>
            <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>AI-аватар</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {avatars.map((a) => {
                const active = a.id === avatarId;
                return (
                  <button
                    key={a.id}
                    onClick={() => setAvatarId(a.id)}
                    style={{
                      width: "100%",
                      borderRadius: 16,
                      border: active
                        ? `1.5px solid ${colors.primaryDark}`
                        : "1px solid rgba(208,212,200,0.9)",
                      background: active ? "#F1F4EC" : "#F7F8F5",
                      cursor: "pointer",
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      textAlign: "left",
                    }}
                    type="button"
                  >
                    <img
                      src={a.img}
                      alt={a.name}
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 14,
                        objectFit: "cover",
                        border: "1px solid rgba(0,0,0,0.08)",
                        flex: "0 0 auto",
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                      <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>
                        {a.gender === "m" ? "Мужской" : "Женский"} · id: {a.id}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Голоса: выбор + play/pause */}
          <section>
            <h3 style={{ margin: "0 0 12px", fontSize: 18 }}>Голос</h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {voiceOptions.map((v) => {
                const selected = v.id === voiceId;
                const playing = v.id === playingVoiceId;

                return (
                  <div
                    key={v.id}
                    style={{
                      borderRadius: 16,
                      border: selected
                        ? `1.5px solid ${colors.primaryDark}`
                        : "1px solid rgba(208,212,200,0.9)",
                      padding: "10px 12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      background: selected ? "#F1F4EC" : "#F7F8F5",
                      gap: 12,
                    }}
                  >
                    <button
                      onClick={() => setVoiceId(v.id)}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        padding: 0,
                        textAlign: "left",
                        flex: 1,
                        minWidth: 0,
                      }}
                      type="button"
                      title="Выбрать голос"
                    >
                      <div style={{ fontSize: 14, fontWeight: 600 }}>
                        {v.label}
                      </div>
                      <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>
                        {v.id}
                      </div>
                    </button>

                    <button
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 999,
                        border: selected
                          ? `1.5px solid ${colors.primaryDark}`
                          : "1px solid #5A6650",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 14,
                        flex: "0 0 auto",
                      }}
                      type="button"
                      onClick={() => toggleVoicePlayback(v)}
                      title={playing ? "Пауза" : "Прослушать"}
                      aria-label={playing ? "Пауза" : "Прослушать"}
                    >
                      {playing ? "⏸" : "▶"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Формат: большие картинки */}
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
                    type="button"
                  >
                    <div
                      style={{
                        height: 150,              // ✅ побольше
                        borderRadius: 14,
                        marginBottom: 12,
                        overflow: "hidden",
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(255,255,255,0.45)",
                      }}
                    >
                      <img
                        src={f.img}
                        alt={f.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: 12, color: colors.textSoft }}>
                      {f.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Footer */}
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

        {/* ✅ “Далее” появляется только когда всё выбрано */}
        {canContinue && <Button onClick={goNext}>Далее</Button>}
      </div>
    </Modal>
  );
};
