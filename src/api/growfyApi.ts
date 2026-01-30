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

export async function createCaseDraft(opts?: { log?: (msg: string, extra?: any) => void }): Promise<string> {
  // По доке: POST /api/public/create-case, Auth optional, JSON.
  // Тело можно {}. :contentReference[oaicite:1]{index=1}
  const { payload } = await requestJson<{ id: string }>(
    `/create-case`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
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
  }
): Promise<void> {
  const chunkSize = opts?.chunkSizeBytes ?? 5 * 1024 * 1024;
  const totalChunks = Math.max(1, Math.ceil(file.size / chunkSize));

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    const start = chunkIndex * chunkSize;
    const end = Math.min(file.size, start + chunkSize);
    const blob = file.slice(start, end);

    const form = new FormData();
    form.append("fileName", file.name);
    form.append("chunkIndex", String(chunkIndex));
    form.append("totalChunks", String(totalChunks));
    form.append("chunk", blob, file.name);

    await requestJson(
      `/upload/${caseId}`,
      { method: "POST", body: form },
      { timeoutMs: 30000, log: opts?.log }
    );

    const sent = chunkIndex + 1;
    const percent = Math.round((sent / totalChunks) * 100);
    opts?.onProgress?.({ sentChunks: sent, totalChunks, percent });
  }
}

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
): Promise<boolean> {
  const { payload } = await requestJson(
    `/poll/${caseId}`,
    { method: "GET" },
    { timeoutMs: 20000, log: opts?.log }
  );

  const data = (payload as SuccessResponse<{ is_ready: boolean }>).data;
  return Boolean(data?.is_ready);
}

export function streamVideoUrl(base: string, caseId: string): string {
  return `${base}/stream-video/${caseId}`;
}

export function getApiBaseCandidates(): readonly string[] {
  return API_BASE_CANDIDATES;
}
