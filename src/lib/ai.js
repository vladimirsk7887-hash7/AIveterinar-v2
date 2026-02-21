import { SYSTEM_PROMPT } from './constants';

export function parseMeta(text) {
  const metaMatch = text.match(/<meta>([\s\S]*?)<\/meta>/);
  let meta = { status: "consultation", card: {}, suggestions: [] };
  if (metaMatch) {
    try {
      meta = JSON.parse(metaMatch[1]);
    } catch {
      try {
        const cleaned = metaMatch[1].replace(/[\n\r]/g, " ").replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
        meta = JSON.parse(cleaned);
      } catch { /* ignore */ }
    }
  }
  return { meta, visibleText: text.replace(/<meta>[\s\S]*?<\/meta>/, "").trim() };
}

export async function checkServerKey() {
  try {
    const res = await fetch("/api/health");
    const data = await res.json();
    return data.hasKey === true;
  } catch {
    return false;
  }
}

export async function callAI(messages, systemOverride) {
  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages,
        system: systemOverride || SYSTEM_PROMPT,
        max_tokens: 1000,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      return `Ошибка API (${response.status}): ${data.error || 'Неизвестная ошибка'}`;
    }
    return data.text || "Произошла ошибка.";
  } catch {
    return "Ошибка соединения. Проверьте интернет.";
  }
}

export function mergeCard(old, newC) {
  if (!newC) return old;
  const merged = { ...old };
  for (const [k, v] of Object.entries(newC)) {
    if (v && (!Array.isArray(v) || v.length > 0)) {
      if (k === "symptoms" && Array.isArray(old?.symptoms)) {
        merged.symptoms = [...new Set([...(old.symptoms || []), ...v])];
      } else {
        merged[k] = v;
      }
    }
  }
  return merged;
}
