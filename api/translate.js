// api/translate.js
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// --- Helpers ---
async function gptTranslateArray(items, target) {
  const sys =
    "You are a professional UI+content translator. Preserve meaning and tone. " +
    "Keep brand names, URLs, numbers, emojis, and code unchanged. " +
    "For UI text keep natural capitalization. Output ONLY the translation(s).";
  const prompt =
    `Translate the following JSON array of strings to ${target}.\n` +
    `Return ONLY a JSON array with same length and order.\n` +
    JSON.stringify(items);

  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "system", content: sys }, { role: "user", content: prompt }],
    temperature: 0.1
  });
  try {
    return JSON.parse(r.choices[0].message.content.trim());
  } catch {
    const lines = r.choices[0].message.content.split("\n").map(s => s.trim()).filter(Boolean);
    return items.map((t, i) => lines[i] || t);
  }
}

async function gptTranslateOne(text, target) {
  const [out] = await gptTranslateArray([text], target);
  return out;
}

async function gptDetect(text) {
  const prompt =
    "Detect the ISO 639-1 language code (2 letters) of the following text. " +
    "Return ONLY the code.\n\n" + text.slice(0, 1000);
  const r = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    temperature: 0
  });
  return r.choices[0].message.content.trim().slice(0, 5).toLowerCase();
}

async function gptRefine(source, current, target) {
  const prompt =
    `Improve the translation to ${target}. Keep meaning and style.\n` +
    `SOURCE:\n${source}\n\nCURRENT:\n${current}\n\nRETURN ONLY THE IMPROVED TRANSLATION.`;
  const r = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: prompt }],
    temperature: 0.1
  });
  return r.choices[0].message.content.trim();
}

// --- Handler ---
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST supported" });

  try {
    const { mode = "translate", target, text, items, source, current, prompt } = req.body;

    if (mode === "detect") {
      if (!text) return res.status(400).json({ error: "Missing text" });
      const lang = await gptDetect(text);
      return res.json({ lang });
    }

    if (mode === "refine") {
      if (!source || !current || !target) return res.status(400).json({ error: "Missing refine fields" });
      const improved = await gptRefine(source, current, target);
      return res.json({ translation: improved });
    }

    // translate
    const tgt = target || (prompt ? (prompt.match(/to (\w+)/i)?.[1] ?? "en") : null);
    if (!tgt) return res.status(400).json({ error: "Missing target language" });

    if (Array.isArray(items) && items.length) {
      const out = await gptTranslateArray(items, tgt);
      return res.json({ translations: out || items });
    }

    const input = text || prompt;
    if (!input) return res.status(400).json({ error: "Missing text/prompt" });

    const one = await gptTranslateOne(input, tgt);
    return res.json({ translation: one || input });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Translation failed" });
  }
}

