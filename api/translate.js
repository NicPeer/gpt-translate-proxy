import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST supported" });

  const { prompt, temperature = 0.2 } = req.body;
  if (!prompt) return res.status(400).json({ error: "Missing prompt" });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature,
    });

    const translated = response.choices[0].message.content.trim();
    res.status(200).json({ translation: translated });
  } catch (err) {
    console.error("OpenAI error:", err.message);
    res.status(500).json({ error: "Translation failed" });
  }
}
