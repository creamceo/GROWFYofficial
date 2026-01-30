// src/components/course/LessonDemoPage.tsx
// ✅ Реализация по обновлённой доке + фиксы:
// 1) порядок запросов: create-case -> upload -> generate-video -> poll (is_ready && video_status==="completed") -> показать видео
// 2) защита от двойного запуска useEffect (React 18 StrictMode dev)
// 3) если generate-video отвечает "video already in progress" — НЕ ошибка, продолжаем poll
// 4) если poll временно падает 502/503/504 — НЕ падаем, продолжаем ретраить + делаем финальную проверку через stream-video
// 5) loader внутри плеера, логи под ним, подпись у суфлёра снизу убрана

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import { colors } from "../../theme";
import {
  createCaseDraft,
  uploadFileChunked,
  generateVideo,
  streamVideoUrl,
  getApiBaseCandidates,
  // ✅ новые функции из growfyApi.ts (добавь их туда, как я писал)
  pollCaseSafe,
  checkStreamAvailable,
  type PollResult,
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

function extractCloudflareRayId(html: string): string | null {
  if (!html) return null;
  const m = html.match(/Cloudflare Ray ID:\s*<strong[^>]*>([^<]+)<\/strong>/i);
  return m?.[1]?.trim() ?? null;
}

function isAlreadyInProgressError(err: any): boolean {
  const msg = (err?.message || String(err || "")).toLowerCase();
  return msg.includes("already in progress") || msg.includes("video already in progress");
}

export const LessonDemoPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state || {}) as LocationState;

  const scriptText = state.scriptText ?? "";
  const deckFile = state.deckFile;
  const avatarId = state.avatarId ?? "";
  const VOICE_ID = "768a611f-14e8-406b-8c91-49c66653310d";
const voiceId = VOICE_ID;
  const formatId = state.formatId ?? "";

  const slides = useMemo(() => parseSlides(scriptText), [scriptText]);
  const teleprompterText = useMemo(() => slides.slice(0, 3).join("\n\n"), [slides]);

  const [runKey, setRunKey] = useState(0);




  const [apiBase, setApiBase] = useState<string>("");
  const [debugLog, setDebugLog] = useState<string[]>([]);

  const [status, setStatus] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [caseId, setCaseId] = useState<string>("");
  const [isBusy, setIsBusy] = useState<boolean>(true);
  const [isReady, setIsReady] = useState<boolean>(false);
  const [videoStatus, setVideoStatus] = useState<string>("");

  const log = (msg: string, extra?: any) => {
    const line = extra ? `${msg} ${JSON.stringify(extra)}` : msg;
    // eslint-disable-next-line no-console
    console.log("[GROWFY]", line);
    setDebugLog((p) => [...p.slice(-200), line]);
  };

  const videoSrc = useMemo(() => {
    if (!caseId || !isReady || !apiBase) return "";
    return streamVideoUrl(apiBase, caseId);
  }, [apiBase, caseId, isReady]);

  useEffect(() => {
  

    let cancelled = false;

    const run = async () => {
      setError("");
      setStatus("Старт...");
      setIsBusy(true);
      setIsReady(false);
      setVideoStatus("");
      setDebugLog([]);
      setApiBase("");
      setCaseId("");

      const baseCandidate = getApiBaseCandidates()[0] || "/api/public";
      setApiBase(baseCandidate);

      log("API_BASE candidates", { list: getApiBaseCandidates() });
      log("apiBase selected", { base: baseCandidate });

      // guards
      if (!scriptText) {
        setError("Нет текста суфлёра. Вернитесь назад и загрузите .docx");
        setIsBusy(false);
        setStatus("");
        return;
      }
      if (!deckFile) {
        setError("Нет файла презентации. Вернитесь назад и загрузите презентацию.");
        setIsBusy(false);
        setStatus("");
        return;
      }
      if (!avatarId || !voiceId || !formatId) {
        setError("Не выбраны аватар/голос/формат. Вернитесь назад и заполните параметры.");
        setIsBusy(false);
        setStatus("");
        return;
      }

      try {
        // 1) Create case
        setStatus("Создаём кейс...");
        log("create-case: start");
        const id = await createCaseDraft({ log });
        if (cancelled) return;

        setCaseId(id);
        log("create-case: ok", { caseId: id });

        // 2) Upload deck (chunked)
        setStatus("Загружаем презентацию...");
        log("upload: start", { name: deckFile.name, size: deckFile.size });

        await uploadFileChunked(id, deckFile, {
          chunkSizeBytes: 1 * 1024 * 1024, // 1MB (меньше риск 504)
          onProgress: ({ percent, sentChunks, totalChunks }) => {
            if (cancelled) return;
            setStatus(`Загрузка презентации: ${percent}% (${sentChunks}/${totalChunks})`);
          },
          log,
        });

        if (cancelled) return;
        log("upload: ok");

        // 3) Generate video (берём первые 3 слайда)
        const script3 = first3SlidesText(scriptText);

        setStatus("Запускаем генерацию...");
        log("generate-video: start", { scriptLen: script3.length, avatarId, voiceId, formatId });

        try {
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
        } catch (genErr: any) {
          // ✅ НЕ ошибка: уже запущено
          if (isAlreadyInProgressError(genErr)) {
            log("generate-video: already in progress (continue polling)");
          } else {
            throw genErr;
          }
        }

        // 4) Poll until is_ready && video_status === "completed"
        setStatus("Ожидаем готовность...");
        const maxAttempts = 300; // ~10 минут при 2s интервале

        for (let i = 0; i < maxAttempts; i++) {
          if (cancelled) return;

          const p: PollResult = await pollCaseSafe(id, { log });
          if (cancelled) return;

          if (p.ok) {
            const vs = (p.data.video_status || "").toLowerCase();
            setVideoStatus(p.data.video_status || "");

            const done = p.data.is_ready && vs === "completed";
            if (done) {
              setIsReady(true);
              setIsBusy(false);
              setStatus("Видео готово!");
              log("poll: ready", { video_status: p.data.video_status });
              return;
            }

            setStatus(
              `Ожидание... (${i + 1}/${maxAttempts})` +
                (p.data.video_status ? ` · статус: ${p.data.video_status}` : "")
            );
            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }

          // ✅ временная ошибка 502/503/504 — не падаем
          if (p.temporary) {
            const hint =
              p.status === 502
                ? "502 Bad Gateway"
                : p.status === 503
                  ? "503 Service Unavailable"
                  : p.status === 504
                    ? "504 Gateway Timeout"
                    : "временная ошибка сети/сервера";

            const rayHint = p.rayId ? ` · RayID: ${p.rayId}` : "";
            setStatus(
              `Сервер временно недоступен: ${hint}. Пробуем ещё... (${i + 1}/${maxAttempts})${rayHint}`
            );

            // ✅ финальная проверка: если stream уже отдаётся — считаем готовым
            const streamOk = await checkStreamAvailable(baseCandidate, id, { log });
            if (streamOk) {
              setIsReady(true);
              setIsBusy(false);
              setStatus("Видео готово! (проверено по stream-video)");
              log("ready by stream-check", { rayId: p.rayId || null });
              return;
            }

            await new Promise((r) => setTimeout(r, 2000));
            continue;
          }

          // не временная ошибка — фейлим
          throw new Error(p.message);
        }

        throw new Error("Таймаут ожидания готовности видео");
      } catch (e: any) {
        if (cancelled) return;

        const msg = e?.message || String(e);
        const ray = extractCloudflareRayId(msg);
        const hint = ray ? `\nCloudflare Ray ID: ${ray}` : "";

        setError(
          msg.includes("502")
            ? `API сейчас недоступен (502 Bad Gateway). Это ошибка на стороне growfy.tech.${hint}`
            : msg.includes("504")
              ? `API не успел ответить (504 Gateway Timeout). Перегруз/таймаут на стороне сервера.${hint}`
              : msg
        );

        setIsBusy(false);
        setStatus("");
        log("ERROR", { message: msg, rayId: ray });
      }
    };

    run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  const showLoader = !videoSrc; // loader пока видео не доступно

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
          <div style={{ fontSize: 34, fontWeight: 600, marginBottom: 8 }}>Демо видео</div>
          <div style={{ fontSize: 14, color: colors.textSoft }}>
            Генерация запускается автоматически. Ошибки и логи — под плеером.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Button onClick={() => navigate(-1)} style={{ borderRadius: 999, height: 44 }}>
            ← Назад
          </Button>

          <Button
            onClick={() => setRunKey((k) => k + 1)}
            style={{ borderRadius: 999, height: 44 }}
            disabled={isBusy}
            title={isBusy ? "Идёт процесс..." : "Повторить запросы"}
          >
            Повторить
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
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Превью видео</div>

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
                style={{
                  width: "100%",
                  height: "100%",
                  display: "block",
                  background: "black",
                }}
                src={videoSrc}
                onError={() =>
                  setError(
                    "Не удалось загрузить видео-поток. Проверьте stream-video и готовность кейса."
                  )
                }
              />
            ) : (
              <div style={{ width: "100%", height: "100%" }} />
            )}

            {/* loader overlay */}
            {showLoader && (
              <>
                <style>{`
                  @keyframes growfySpin { to { transform: rotate(360deg); } }
                  @keyframes growfyPulse { 0%, 100% { opacity: .55; } 50% { opacity: 1; } }
                `}</style>

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 18,
                    background:
                      "linear-gradient(180deg, rgba(247,248,245,0.55), rgba(247,248,245,0.85))",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 10,
                      textAlign: "center",
                      padding: 18,
                      borderRadius: 18,
                      border: "1px solid rgba(0,0,0,0.08)",
                      background: "rgba(255,255,255,0.7)",
                      backdropFilter: "blur(6px)",
                      minWidth: 260,
                      maxWidth: 460,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 999,
                        border: "4px solid rgba(90,102,80,0.25)",
                        borderTopColor: colors.primaryDark,
                        animation: "growfySpin 1s linear infinite",
                      }}
                    />
                    <div style={{ fontSize: 15, fontWeight: 800, color: colors.textMain }}>
                      {isBusy ? "Генерация видео..." : "Видео не готово"}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: colors.textSoft,
                        animation: "growfyPulse 1.4s ease-in-out infinite",
                        whiteSpace: "pre-wrap",
                      }}
                    >
                      {status || "Ожидание..."}
                    </div>

                    {videoStatus && (
                      <div style={{ fontSize: 12, color: colors.textSoft }}>
                        video_status: <code>{videoStatus}</code>
                      </div>
                    )}

                    {caseId && (
                      <div style={{ fontSize: 12, color: colors.textSoft }}>
                        caseId: <code>{caseId}</code>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Ошибки под плеером */}
          {error && (
            <div style={{ marginTop: 10, fontSize: 13, color: "#8B2E2E", whiteSpace: "pre-wrap" }}>
              {error}
            </div>
          )}

          {/* Debug log */}
          <div style={{ marginTop: 10, fontSize: 12, color: colors.textSoft }}>
            <div style={{ fontWeight: 700, marginBottom: 6 }}>Debug log (копируй и присылай):</div>
            <div
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 12,
                padding: 10,
                background: "rgba(255,255,255,0.55)",
                maxHeight: 220,
                overflow: "auto",
                whiteSpace: "pre-wrap",
                lineHeight: 1.35,
              }}
            >
              {debugLog.join("\n")}
            </div>
          </div>

          {/* техинфа */}
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
                API base пока не определён · кандидаты: <code>{getApiBaseCandidates().join(" | ")}</code>
              </>
            )}
          </div>
        </Card>

        {/* Teleprompter */}
        <Card style={{ padding: 18 }}>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>Суфлёр</div>

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

          {/* подпись снизу убрана */}
        </Card>
      </div>
    </div>
  );
};
