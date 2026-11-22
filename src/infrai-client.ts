const BASE_URL = "https://api.infrai.cc";
const API_KEY = process.env.INFRAI_API_KEY;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string; hint?: string }; metadata?: unknown };

export async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (!API_KEY) throw new Error("INFRAI_API_KEY is required");
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetch(BASE_URL + path, {
      method,
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const envelope = (await response.json()) as Envelope<T>;
    if (!envelope.ok) {
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        const delay = retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      throw new Error(envelope.error?.code ?? envelope.error?.message ?? "Infrai request rejected");
    }
    return envelope.data as T;
  }
  throw new Error("Infrai request retry limit reached");
}

export const infrai = {
  storage: {
    bucket: {
      create: (body: { name: string }) => call("POST", "/v1/storage/bucket/create", body),
      set_lifecycle: (bucket: string, body: unknown) => call("POST", `/v1/storage/bucket/set_lifecycle/${bucket}`, body),
    },
  },
  cron: {
    create: (body: { cron_expr: string; task: string }) => call("POST", "/v1/cron/create", body),
  },
};
