export type JsonParseResult =
  | { ok: true; data: unknown }
  | { ok: false; error: string };

export function safeParseJson(raw: string): JsonParseResult {
  try {
    const data = JSON.parse(raw);
    return { ok: true, data };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown JSON parse error';
    return { ok: false, error: message };
  }
}
