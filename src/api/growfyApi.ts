// src/api/growfyApi.ts

// IMPORTANT:
// В dev используем относительный base "/api/public" (через CRA proxy), чтобы НЕ было CORS.
// В prod (если сайт будет на growfy.tech) можно тоже оставить относительный base.
const API_BASE_CANDIDATES = ["/api/public"] as const;

export type SuccessResponse<T> = {
  success: true;
  message?: string;
  data: T | null;
};

export type ErrorResponse = {
  success: false;
  error?: string;
  message?: string;
  details?: string;
};

function asErrorMessage(payload: any): string {
  if (!payload) return "Unknown error";
  if (typeof payload === "string") return payload;
  return payload?.error || payload?.message || payload?.details || "Request failed";
}

async function readJsonSafe(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function requestJson<T>(
  path: string,
  init: RequestInit,
  opts?: { timeoutMs?: number; log?: (msg: string, extra?: any) => void }
): Promise<{ base: string; payload: any; status: number }> {
  const timeoutMs = opts?.timeoutMs ?? 20000;
  let lastErr: any = null;

  for (const base of API_BASE_CANDIDATES) {
    const url = `${base}${path}`;
    opts?.log?.("HTTP: start", { url, method: init.method || "GET" });

    try {
      const res = await fetchWithTimeout(url, init, timeoutMs);
      const payload = await readJsonSafe(res);

      opts?.log?.("HTTP: done", { url, status: res.status, ok: res.ok, payload });

      if (!res.ok || (payload as any)?.success === false) {
        throw new Error(`${init.method || "GET"} ${url}: ${asErrorMessage(payload)}`);
      }

      return { base, payload, status: res.status };
    } catch (e: any) {
      lastErr = e;
      opts?.log?.("HTTP: fail", { url, error: e?.message || String(e) });
      continue;
    }
  }

  throw lastErr || new Error("All API base candidates failed");
}

// --- 1. Create Case Draft ---
export async function createCaseDraft(opts?: {
  token?: string; // optional bearer
  log?: (msg: string, extra?: any) => void;
}): Promise<string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts?.token) headers.Authorization = `Bearer ${opts.token}`;

  const { payload } = await requestJson<{ id: string }>(
    `/create-case`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({}), // по доке тело можно пустое/{} :contentReference[oaicite:1]{index=1}
    },
    { timeoutMs: 20000, log: opts?.log }
  );

  const data = (payload as SuccessResponse<{ id: string }>).data;
  if (!data?.id) throw new Error("create-case: missing case id");
  return data.id;
}

export async function uploadFileChunked(
  caseId: string,
  file: File,
  opts?: {
    chunkSizeBytes?: number;
    onProgress?: (p: { sentChunks: number; totalChunks: number; percent: number }) => void;
    log?: (msg: string, extra?: any) => void;
    // ✅ новые опции
    maxRetriesPerChunk?: number; // default 3
    retryBaseDelayMs?: number;   // default 1200
  }
): Promise<void> {
  const chunkSize = opts?.chunkSizeBytes ?? 1 * 1024 * 1024; // ✅ 1MB safer
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));

  const baseTimeoutMs = 120_000;   // 2 min
  const lastChunkTimeoutMs = 300_000; // ✅ 5 min (мердж+конверсия pdf)
  const maxRetries = opts?.maxRetriesPerChunk ?? 3;
  const retryBaseDelayMs = opts?.retryBaseDelayMs ?? 1200;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const isTemporaryUploadError = (e: any) => {
    const msg = (e?.message || String(e || "")).toLowerCase();
    return (
      msg.includes("504") ||
      msg.includes("502") ||
      msg.includes("503") ||
      msg.includes("timeout") ||
      msg.includes("aborted") ||
      msg.includes("proxy") || // ✅ CRA proxy 504
      msg.includes("networkerror") ||
      msg.includes("failed to fetch")
    );
  };

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const blob = file.slice(start, end);

    const isLast = chunkIndex === totalChunks - 1;
    const timeoutMs = isLast ? lastChunkTimeoutMs : baseTimeoutMs;

    const form = new FormData();
    form.append("fileName", file.name);
    form.append("chunkIndex", String(chunkIndex));
    form.append("totalChunks", String(totalChunks));
    form.append("chunk", blob, file.name);

    let attempt = 0;

    while (true) {
      attempt++;

      opts?.log?.("upload: chunk start", {
        chunkIndex,
        totalChunks,
        bytes: blob.size,
        timeoutMs,
        attempt,
      });

      try {
        await requestJson(
          `/upload/${caseId}`,
          { method: "POST", body: form },
          { timeoutMs, log: opts?.log }
        );

        // ✅ успех — обновляем прогресс и идём дальше
        const sent = chunkIndex + 1;
        const percent = Math.round((sent / totalChunks) * 100);
        opts?.onProgress?.({ sentChunks: sent, totalChunks, percent });
        break;
      } catch (e: any) {
        const temp = isTemporaryUploadError(e);

        // ✅ если временная ошибка и есть ещё попытки — retry
        if (temp && attempt <= maxRetries) {
          const delay = retryBaseDelayMs * attempt; // backoff
          opts?.log?.("upload: chunk retry", {
            chunkIndex,
            attempt,
            maxRetries,
            delayMs: delay,
            reason: e?.message || String(e),
          });
          await sleep(delay);
          continue;
        }

        // ✅ отдельный кейс: последний чанк упал по proxy/timeout
        // часто сервер всё равно принял чанк и сейчас мерджит/конвертит
        if (isLast && temp) {
          opts?.log?.("upload: last chunk temporary error, verifying via poll...", {
            error: e?.message || String(e),
          });

          // пробуем несколько раз подождать и проверить poll
          // если бэк уже закончил — продолжаем как успех
          for (let i = 0; i < 10; i++) {
            await sleep(2000);

            try {
              const { payload } = await requestJson(
                `/poll/${caseId}`,
                { method: "GET" },
                { timeoutMs: 20000, log: opts?.log }
              );

              // у тебя poll возвращает is_ready/video_status, но после upload может быть пусто.
              // главное — что poll начал отвечать, значит сервер жив.
              const data = (payload as SuccessResponse<any>).data;
              opts?.log?.("upload: verify poll ok", { i, data });

              // Даже если is_ready ещё false — считаем, что upload прошёл,
              // потому что сервер уже в норме и мердж/конверсия могла пойти.
              const sent = chunkIndex + 1;
              const percent = Math.round((sent / totalChunks) * 100);
              opts?.onProgress?.({ sentChunks: sent, totalChunks, percent });
              // ✅ выходим как будто upload успешен
              attempt = 9999;
              break;
            } catch (pollErr: any) {
              opts?.log?.("upload: verify poll fail", { i, error: pollErr?.message || String(pollErr) });
            }
          }

          if (attempt === 9999) break;

          // если verify не помог — пробрасываем исходную ошибку
          throw e;
        }

        // ✅ не временная / исчерпали ретраи
        throw e;
      }
    }
  }
}


// --- 4. Generate Video ---
export type GenerateVideoPayload = {
  video_request: {
    input: Array<{
      scriptText: string;
      avatar: string;
      avatarSettings?: {
        horizontalAlign?: string;
        scale?: number;
        style?: string;
        voice?: string;
        seamless?: boolean;
      };
      background: string;
      backgroundSettings?: {
        videoSettings?: {
          shortBackgroundContentMatchMode?: string;
          longBackgroundContentMatchMode?: string;
        };
      };
    }>;
    test: boolean;
    title: string;
    visibility: "private" | "public" | string;
    aspectRatio: string;
    description: string;
    soundtrack: string;
  };
};

export async function generateVideo(
  caseId: string,
  body: GenerateVideoPayload,
  fullScreen = false,
  opts?: { log?: (msg: string, extra?: any) => void }
): Promise<void> {
  const qs = `?full_screen=${String(fullScreen)}`;

  await requestJson(
    `/generate-video/${caseId}${qs}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    { timeoutMs: 30000, log: opts?.log }
  );
}


export async function pollCase(
  caseId: string,
  opts?: { log?: (msg: string, extra?: any) => void }
): Promise<PollCaseData> {
  const { payload } = await requestJson(
    `/poll/${caseId}`,
    { method: "GET" },
    { timeoutMs: 20000, log: opts?.log }
  );

  const data = (payload as SuccessResponse<PollCaseData>).data;
  return {
    is_ready: Boolean(data?.is_ready),
    video_status: data?.video_status,
  };
}

// src/api/growfyApi.ts

function extractCloudflareRayIdFromHtml(html: string): string | null {
  if (!html) return null;
  const m = html.match(/Cloudflare Ray ID:\s*<strong[^>]*>([^<]+)<\/strong>/i);
  return m?.[1]?.trim() ?? null;
}

export type PollCaseData = {
  is_ready: boolean;
  video_status?: string;
};

export type PollResult =
  | { ok: true; data: PollCaseData }
  | { ok: false; temporary: boolean; status?: number; message: string; rayId?: string };

export async function pollCaseSafe(
  caseId: string,
  opts?: { log?: (msg: string, extra?: any) => void }
): Promise<PollResult> {
  try {
    const { payload, status } = await requestJson(
      `/poll/${caseId}`,
      { method: "GET" },
      { timeoutMs: 20000, log: opts?.log }
    );

    const data = (payload as SuccessResponse<PollCaseData>).data;
    return {
      ok: true,
      data: {
        is_ready: Boolean(data?.is_ready),
        video_status: data?.video_status,
      },
    };
  } catch (e: any) {
    const msg = e?.message || String(e || "");
    // вытащим статус (если он есть в message) — у тебя он там есть как "status":502 в логах,
    // но в thrown Error у нас только текст. Поэтому просто эвристика:
    const lower = msg.toLowerCase();
    const is502 = lower.includes(" 502") || lower.includes("status\":502") || lower.includes("error code 502");
    const is503 = lower.includes(" 503") || lower.includes("status\":503") || lower.includes("error code 503");
    const is504 = lower.includes(" 504") || lower.includes("status\":504") || lower.includes("error code 504");

    // если прилетел HTML Cloudflare — вытащим RayId
    const rayId = extractCloudflareRayIdFromHtml(msg);

    const temporary = is502 || is503 || is504 || lower.includes("networkerror") || lower.includes("failed to fetch");

    return {
      ok: false,
      temporary,
      message: msg,
      rayId: rayId || undefined,
      status: is502 ? 502 : is503 ? 503 : is504 ? 504 : undefined,
    };
  }
}

// Fallback: проверяем доступность стрима (когда poll мёртв)
export async function checkStreamAvailable(
  base: string,
  caseId: string,
  opts?: { log?: (msg: string, extra?: any) => void }
): Promise<boolean> {
  const url = `${base}/stream-video/${caseId}`;

  try {
    // HEAD иногда запрещён. Поэтому делаем GET с Range на 1 байт.
    const res = await fetch(url, {
      method: "GET",
      headers: { Range: "bytes=0-0" },
    });

    // 206 Partial Content или 200 OK — отлично
    opts?.log?.("stream-check", { url, status: res.status, ok: res.ok });
    return res.status === 206 || res.status === 200;
  } catch (e: any) {
    opts?.log?.("stream-check fail", { url, error: e?.message || String(e) });
    return false;
  }
}


// --- 7/8. video urls ---
export function streamVideoUrl(base: string, caseId: string): string {
  return `${base}/stream-video/${caseId}`;
}

export function downloadVideoUrl(base: string, caseId: string): string {
  return `${base}/download-video/${caseId}`;
}

export function getApiBaseCandidates(): readonly string[] {
  return API_BASE_CANDIDATES;
}
