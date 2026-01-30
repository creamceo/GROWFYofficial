// src/components/course/CourseCreationPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../ui/Button";
import { colors, radius } from "../../theme";
import { useNavigate } from "react-router-dom";
import { docxFileToText } from "../../utils/docxToText";
import {
  createCaseDraft,
  uploadFileChunked,
  generateVideo,
  pollCase,
} from "../../api/growfyApi";

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

type Avatar = {
  id: string; // UUID для сервера
  name: string;
  gender: "m" | "f";
  img: string;
};

type Voice = {
  id: string; // filename для сервера
  label: string;
  gender: "m" | "f";
  src: string;
};

type Format = {
  id: string;
  title: string;
  desc: string;
  img: string;
};

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

function parseSlides(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split("[next-slide]")
    .map((s) => s.replace(/\r/g, "").trim())
    .filter(Boolean);
}

function first3SlidesText(raw: string): string {
  const slides = parseSlides(raw);
  return slides.slice(0, 3).join("\n\n").trim();
}

export const CourseCreationPage: React.FC = () => {
  const [scriptFiles, setScriptFiles] = useState<File[]>([]);
  const [deckFiles, setDeckFiles] = useState<File[]>([]);
  const [scriptText, setScriptText] = useState<string>("");

  const [avatarId, setAvatarId] = useState<string | null>(null);
  const [voiceId, setVoiceId] = useState<string | null>(null);
  const [formatId, setFormatId] = useState<string | null>(null);

  // UI feedback
  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // audio playback
  const audioMapRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);

  const navigate = useNavigate();

  const selectedAvatar = useMemo(
    () => avatars.find((a) => a.id === avatarId) || null,
    [avatarId]
  );

  const voiceOptions = useMemo(() => {
    if (!selectedAvatar) return voices;
    return voices.filter((v) => v.gender === selectedAvatar.gender);
  }, [selectedAvatar]);

  const canContinue = Boolean(
    scriptFiles.length > 0 &&
      deckFiles.length > 0 &&
      scriptText && // ✅ нужен текст из docx
      avatarId &&
      voiceId &&
      formatId
  );

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
    if (playingVoiceId === voice.id) {
      const a = getAudio(voice);
      a.pause();
      setPlayingVoiceId(null);
      return;
    }
    audioMapRef.current.forEach((a) => a.pause());
    const a = getAudio(voice);
    a.currentTime = 0;
    a.play().then(() => setPlayingVoiceId(voice.id));
  };

  // при смене аватара — сброс голоса и проигрывания
  useEffect(() => {
    setVoiceId(null);
    stopAnyAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [avatarId]);

  useEffect(() => {
    return () => stopAnyAudio();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScriptUpload = async (files: FileList | null) => {
    if (!files) return;

    const list = Array.from(files);
    setScriptFiles(list);

    const docx = list.find((f) => f.name.toLowerCase().endsWith(".docx"));
    if (docx) {
      setError("");
      setStatus("Читаем .docx...");
      try {
        const text = await docxFileToText(docx);
        setScriptText(text);
        setStatus(text ? "Суфлёр загружен" : "Суфлёр пустой");
      } catch (e: any) {
        setScriptText("");
        setStatus("");
        setError(e?.message || "Не удалось прочитать docx");
      }
    } else {
      setScriptText("");
      setStatus("Загрузите .docx для суфлёра");
    }
  };

  const handleDeckUpload = (files: FileList | null) => {
    if (!files) return;
    setDeckFiles(Array.from(files));
  };

  const goNext = () => {
    if (!canContinue || isSubmitting) return;
  
    // ✅ сразу переходим на демо, всю генерацию делаем там
    navigate("/lesson/demo", {
      state: {
        scriptText,               // полный текст docx
        deckFile: deckFiles[0],   // для демо грузим первый файл
        avatarId,
        voiceId,
        formatId,
      },
    });
  };
  
  const boxStyle = (active: boolean) => ({
    borderRadius: 20,
    background: "rgba(247,248,245,0.92)",
    padding: 20,
    border: active
      ? `1.5px solid ${colors.primaryDark}`
      : "1px solid rgba(0,0,0,0.06)",
  });

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16 }}>
        <div>
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
          <div style={{ fontSize: 34, fontWeight: 600, marginBottom: 8 }}>
            Создание курса
          </div>
          <div style={{ fontSize: 14, color: colors.textSoft }}>
            Загрузите материалы и выберите AI-аватар.
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
            <Button onClick={() => navigate(-1)} style={{ borderRadius: 999, height: 44 }}>
              ← Назад
            </Button>
            <Button
              onClick={goNext}
              disabled={!canContinue || isSubmitting}
              style={{ borderRadius: 999, height: 44 }}
            >
              {isSubmitting ? "Отправка..." : "Далее"}
            </Button>
          </div>

          <div style={{ marginTop: 10, textAlign: "right", maxWidth: 520 }}>
            {status && <div style={{ fontSize: 13, color: colors.textSoft }}>{status}</div>}
            {error && (
              <div style={{ fontSize: 13, color: "#8B2E2E", marginTop: 6 }}>
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 5.5fr) minmax(0, 6.5fr)",
          gap: 32,
          marginTop: 28,
        }}
      >
        {/* LEFT — файлы */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Суфлер */}
          <section style={boxStyle(scriptFiles.length > 0)}>
            <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>Файл суфлёра</h3>
            <div style={{ fontSize: 13, color: colors.textSoft, marginBottom: 16 }}>
              Поддерживаемые форматы: PDF, DOCX, TXT. До 50 МБ.
            </div>

            <label
              style={{
                borderRadius: 18,
                border:
                  scriptFiles.length > 0
                    ? `1.5px solid ${colors.primaryDark}`
                    : "1px dashed rgba(90,102,80,0.7)",
                background: scriptFiles.length > 0 ? "#F1F4EC" : "transparent",
                padding: "18px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
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
                {scriptFiles.length > 0 ? (
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
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {scriptFiles.map((f) => (
                  <li
                    key={f.name}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.06)",
                      background: "rgba(255,255,255,0.6)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>
                      {f.name} · {(f.size / 1024).toFixed(0)} КБ
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setScriptFiles((p) => p.filter((x) => x.name !== f.name));
                        setScriptText("");
                      }}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 18,
                        color: "#766153",
                      }}
                      aria-label="Удалить файл"
                      title="Удалить"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {scriptText && (
              <div style={{ marginTop: 12, fontSize: 12, color: colors.textSoft }}>
                Текст суфлёра загружен: {parseSlides(scriptText).length} слайд(ов)
              </div>
            )}
          </section>

          {/* Презентация */}
          <section style={boxStyle(deckFiles.length > 0)}>
            <h3 style={{ margin: "0 0 8px", fontSize: 20 }}>Файл презентации</h3>
            <div style={{ fontSize: 13, color: colors.textSoft, marginBottom: 16 }}>
              Поддерживаемые форматы: PPTX, PDF. Можно загрузить несколько.
            </div>

            <label
              style={{
                borderRadius: 18,
                border:
                  deckFiles.length > 0
                    ? `1.5px solid ${colors.primaryDark}`
                    : "1px dashed rgba(90,102,80,0.7)",
                background: deckFiles.length > 0 ? "#F1F4EC" : "transparent",
                padding: "18px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 10,
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
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
                {deckFiles.length > 0 ? (
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
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {deckFiles.map((f) => (
                  <li
                    key={f.name}
                    style={{
                      padding: "10px 12px",
                      borderRadius: 14,
                      border: "1px solid rgba(0,0,0,0.06)",
                      background: "rgba(255,255,255,0.6)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <span style={{ fontSize: 14 }}>
                      {f.name} · {(f.size / 1024).toFixed(0)} КБ
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeckFiles((p) => p.filter((x) => x.name !== f.name))}
                      style={{
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 18,
                        color: "#766153",
                      }}
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

        {/* RIGHT — аватар / голос / формат */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Аватары */}
          <section style={boxStyle(Boolean(avatarId))}>
            <h3 style={{ margin: "0 0 12px", fontSize: 20 }}>AI-аватар</h3>

            <div style={{ display: "flex", gap: 12, overflowX: "auto", paddingBottom: 4 }}>
              {avatars.map((a) => {
                const active = a.id === avatarId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onPointerDown={() => setAvatarId(a.id)} // ✅ выбор с первого нажатия
                    style={{
                      minWidth: 150,
                      borderRadius: 18,
                      border: active
                        ? `2px solid ${colors.primaryDark}`
                        : "1px solid rgba(208,212,200,0.9)",
                      background: active ? "#F1F4EC" : "#F7F8F5",
                      padding: 10,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                    }}
                  >
                    <img
                      src={a.img}
                      alt={a.name}
                      style={{
                        width: "100%",
                        height: 110,
                        borderRadius: 14,
                        objectFit: "cover",
                        border: "1px solid rgba(0,0,0,0.08)",
                      }}
                    />
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{a.name}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Голоса */}
          <section style={boxStyle(Boolean(voiceId))}>
            <h3 style={{ margin: "0 0 12px", fontSize: 20 }}>Голос</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              {voiceOptions.map((v) => {
                const selected = v.id === voiceId;
                const playing = v.id === playingVoiceId;

                return (
                  <button
                    key={v.id}
                    type="button"
                    onPointerDown={() => setVoiceId(v.id)} // ✅ выбор с первого нажатия
                    style={{
                      borderRadius: 18,
                      border: selected
                        ? `2px solid ${colors.primaryDark}`
                        : "1px solid rgba(208,212,200,0.9)",
                      background: selected ? "#F1F4EC" : "#F7F8F5",
                      padding: 12,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{v.label}</div>
                      <div style={{ fontSize: 12, color: colors.textSoft, marginTop: 2 }}>
                        {v.id}
                      </div>
                    </div>

                    <button
                      type="button"
                      onPointerDown={(e) => {
                        e.stopPropagation();
                        setVoiceId(v.id); // ✅ play тоже выбирает
                        toggleVoicePlayback(v);
                      }}
                      title={playing ? "Пауза" : "Прослушать"}
                      aria-label={playing ? "Пауза" : "Прослушать"}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 999,
                        border: "1px solid #5A6650",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: 14,
                        flex: "0 0 auto",
                      }}
                    >
                      {playing ? "⏸" : "▶"}
                    </button>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Формат */}
          <section style={boxStyle(Boolean(formatId))}>
            <h3 style={{ margin: "0 0 12px", fontSize: 20 }}>Формат</h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 14,
              }}
            >
              {formats.map((f) => {
                const active = f.id === formatId;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onPointerDown={() => setFormatId(f.id)} // ✅ выбор с первого нажатия
                    style={{
                      borderRadius: 20,
                      border: active
                        ? `2px solid ${colors.primaryDark}`
                        : "1px solid rgba(208,212,200,0.9)",
                      background: active ? "#F1F4EC" : "#F7F8F5",
                      padding: 14,
                      cursor: "pointer",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      gap: 10,
                      minHeight: 300,
                    }}
                  >
                    <div
                      style={{
                        width: "100%",
                        borderRadius: 18,
                        overflow: "hidden",
                        border: "1px solid rgba(0,0,0,0.08)",
                        background: "rgba(255,255,255,0.7)",
                        aspectRatio: "16 / 9",
                        height: 210,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={f.img}
                        alt={f.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "contain",
                          display: "block",
                        }}
                      />
                    </div>

                    <div style={{ fontSize: 18, fontWeight: 800, lineHeight: 1.15 }}>
                      {f.title}
                    </div>
                    <div style={{ fontSize: 16, color: colors.textSoft, lineHeight: 1.25 }}>
                      {f.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
