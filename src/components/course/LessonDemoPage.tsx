// src/components/course/LessonDemoPage.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { colors } from "../../theme";
import {
  createCaseDraft,
  uploadFileChunked,
  generateVideo,
  pollCase,
  streamVideoUrl,
  getApiBaseCandidates,
} from "../../api/growfyApi";

type LocationState = {
  scriptText?: string;
  deckFile?: File;
  avatarId?: string;
  voiceId?: string;
  formatId?: string;
};

function parseSlides(raw: string): string[] {
  if (!raw) return [];
  return raw
    .split("[next-slide]")
    .map((s) => s.replace(/\r/g, "").trim())
    .filter(Boolean);
}

function first3SlidesText(raw: string): string {
  return parseSlides(raw).slice(0, 3).join("\n\n").trim();
}

export const LessonDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const scriptText = state.scriptText ?? "";
  const deckFile = state.deckFile;
  const avatarId = state.avatarId ?? "";
  const voiceId = state.voiceId ?? "";
  const formatId = state.formatId ?? "";

  const slides = useMemo(() => parseSlides(scriptText), [scriptText]);
  const teleprompterText = useMemo(() => slides.slice(0, 3).join("\n\n"), [slides]);

  const startedRef = useRef(false); // ✅ StrictMode guard
  const [apiBase, setApiBase] = useState<string>(""); // ✅ base, по которому реально отработало
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [caseId, setCaseId] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);

  const log = (msg: string, extra?: any) => {
    const line = extra ? `${msg} ${JSON.stringify(extra)}` : msg;
    // eslint-disable-next-line no-console
    console.log("[GROWFY]", line);
    setDebugLog((p) => [...p.slice(-60), line]);
  };

  const videoSrc = useMemo(() => {
    if (!caseId || !isReady || !apiBase) return "";
    return streamVideoUrl(apiBase, caseId);
  }, [apiBase, caseId, isReady]);

  useEffect(() => {
    if (startedRef.current) return; // ✅ не запускаем дважды
    startedRef.current = true;

    let cancelled = false;

    const run = async () => {
      setError("");
      setStatus("Старт...");
      setIsBusy(true);
      setIsReady(false);
      setDebugLog([]);
      setApiBase("");

      log("API_BASE candidates", { list: getApiBaseCandidates() });

      // базовая валидация
      if (!scriptText) {
        setError("Нет текста суфлёра. Вернитесь назад и загрузите .docx");
        setIsBusy(false);
        return;
      }
      if (!deckFile) {
        setError("Нет файла презентации. Вернитесь назад и загрузите презентацию.");
        setIsBusy(false);
        return;
      }
      if (!avatarId || !voiceId || !formatId) {
        setError("Не выбраны аватар/голос/формат. Вернитесь назад и заполните параметры.");
        setIsBusy(false);
        return;
      }

      try {
        setStatus("Создаём кейс...");
        log("create-case: start");

        // createCaseDraft внутри попробует все base-кандидаты
        const id = await createCaseDraft({ log });
        if (cancelled) return;

        setCaseId(id);
        log("create-case: ok", { caseId: id });

        // Определяем base для stream: делаем быстрый poll (он тоже логирует url)
        setStatus("Определяем рабочий API base...");
        await pollCase(id, { log });

        // Вытягиваем base из последней строки, где есть url
        // пример: HTTP: done {"url":"https://.../poll/<id>", ...}
        const lastWithUrl = [...debugLog].reverse().find((l) => l.includes(`"url":"`) && l.includes("/poll/"));
        if (lastWithUrl) {
          const m = lastWithUrl.match(/"url":"([^"]+)"/);
          const url = m?.[1] || "";
          const base = url.replace(/\/poll\/.*$/, "");
          if (base) {
            setApiBase(base);
            log("apiBase selected", { base });
          }
        }

        setStatus("Загружаем презентацию...");
        log("upload: start", { name: deckFile.name, size: deckFile.size });

        await uploadFileChunked(id, deckFile, {
          onProgress: ({ percent, sentChunks, totalChunks }) => {
            if (cancelled) return;
            setStatus(`Загрузка презентации: ${percent}% (${sentChunks}/${totalChunks})`);
          },
          log,
        });

        if (cancelled) return;
        log("upload: ok");

        const script3 = first3SlidesText(scriptText);

        setStatus("Запускаем генерацию...");
        log("generate-video: start", { scriptLen: script3.length, avatarId, voiceId });

        await generateVideo(
          id,
          {
            video_request: {
              input: [
                {
                  scriptText: script3,
                  avatar: avatarId,
                  avatarSettings: {
                    horizontalAlign: "center",
                    scale: 1,
                    style: "rectangular",
                    voice: voiceId,
                    seamless: false,
                  },
                  background: "white_cafe",
                  backgroundSettings: {
                    videoSettings: {
                      shortBackgroundContentMatchMode: "freeze",
                      longBackgroundContentMatchMode: "trim",
                    },
                  },
                },
              ],
              test: true,
              title: "Demo video",
              visibility: "private",
              aspectRatio: "4:5",
              description: "Demo generate from UI",
              soundtrack: "corporate",
            },
          },
          false,
          { log }
        );

        if (cancelled) return;
        log("generate-video: ok");

        setStatus("Ожидаем готовность...");
        const maxAttempts = 180;

        for (let i = 0; i < maxAttempts; i++) {
          const ready = await pollCase(id, { log });
          if (cancelled) return;

          if (ready) {
            setIsReady(true);
            setIsBusy(false);
            setStatus("Видео готово!");
            log("poll: ready");
            return;
          }

          setStatus(`Ожидание... (${i + 1}/${maxAttempts})`);
          await new Promise((r) => setTimeout(r, 2000));
        }

        throw new Error("Таймаут ожидания готовности видео");
      } catch (e: any) {
        if (cancelled) return;

        setError(e?.message || "Ошибка");
        setIsBusy(false);
        setStatus("");
        log("ERROR", { message: e?.message || String(e) });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ maxWidth: 1180, margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 18,
        }}
      >
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
            Демо видео
          </div>
          <div style={{ fontSize: 14, color: colors.textSoft }}>
            Генерация запускается автоматически. Логи — DevTools → Console / Network.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Button onClick={() => navigate(-1)} style={{ borderRadius: 999, height: 44 }}>
            ← Назад
          </Button>
          <Button
            onClick={() => navigate("/lesson/final")}
            style={{ borderRadius: 999, height: 44 }}
            disabled={!isReady}
            title={!isReady ? "Дождитесь генерации" : "Продолжить"}
          >
            Продолжить
          </Button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 7fr) minmax(0, 5fr)",
          gap: 22,
          alignItems: "start",
        }}
      >
        {/* Player */}
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Превью видео
          </div>

          {/* Плеер / загрузка внутри */}
          <div
            style={{
              position: "relative",
              width: "100%",
              borderRadius: 18,
              overflow: "hidden",
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(255,255,255,0.6)",
              aspectRatio: "16 / 9",
            }}
          >
            {videoSrc ? (
              <video
                controls
                preload="metadata"
                style={{ width: "100%", height: "100%", display: "block", background: "black" }}
                src={videoSrc}
                onError={() =>
                  setError("Не удалось загрузить видео-поток. Проверьте stream-video и готовность кейса.")
                }
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  color: colors.textSoft,
                  padding: 16,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 700 }}>
                  {isBusy ? "Генерация видео..." : "Видео не готово"}
                </div>
                <div style={{ fontSize: 13 }}>{status || "Ожидание..."}</div>
                {caseId && (
                  <div style={{ fontSize: 12 }}>
                    caseId: <code>{caseId}</code>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Ошибки под плеером */}
          {error && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#8B2E2E" }}>
              {error}
            </div>
          )}

          {/* Статусы под плеером */}
          {!error && status && (
            <div style={{ marginTop: 10, fontSize: 13, color: colors.textSoft }}>
              {status}
            </div>
          )}

          {/* Отладка (чтобы ты копировал) */}
          <div style={{ marginTop: 10, fontSize: 12, color: colors.textSoft }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Debug log (копируй и присылай):</div>
            <div
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: 10,
                background: "rgba(255,255,255,0.55)",
                maxHeight: 160,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                lineHeight: 1.35,
              }}
            >
              {debugLog.join("\n")}
            </div>
          </div>

          {/* Техническая инфа */}
          <div style={{ marginTop: 10, fontSize: 12, color: colors.textSoft }}>
            {apiBase ? (
              <>
                API base: <code>{apiBase}</code>
                {caseId && (
                  <>
                    {" "}
                    · stream: <code>{streamVideoUrl(apiBase, caseId)}</code>
                  </>
                )}
              </>
            ) : (
              <>
                API base пока не определён · кандидаты:{" "}
                <code>{getApiBaseCandidates().join(" | ")}</code>
              </>
            )}
          </div>
        </Card>

        {/* Teleprompter */}
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>
            Суфлёр
          </div>

          <div
            style={{
              borderRadius: 18,
              border: "1px solid rgba(0,0,0,0.08)",
              background: "rgba(255,255,255,0.65)",
              padding: 14,
              minHeight: 320,
              maxHeight: 520,
              overflow: "auto",
              whiteSpace: "pre-wrap",
              lineHeight: 1.45,
              fontSize: 14,
              color: colors.textMain,
            }}
          >
            {scriptText ? teleprompterText || "Слайды не найдены" : "Нет текста суфлёра"}
          </div>

          {!!scriptText && (
            <div style={{ marginTop: 10, fontSize: 12, color: colors.textSoft }}>
              Показаны первые {Math.min(3, slides.length)} слайда без маркера{" "}
              <code>[next-slide]</code>.
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
