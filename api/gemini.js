// /api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const message = body?.message || "Hello from BartStart";

    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("Missing GEMINI_API_KEY");

    // 👇 force the SDK to use the stable v1 endpoint
    const genAI = new GoogleGenerativeAI(key, {
      apiEndpoint: "https://generativelanguage.googleapis.com/v1",
    });

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
    const result = await model.generateContent(message);
    const reply = result.response.text();

    res.status(200).json({ reply });
  } catch (err) {
    console.error("Gemini API error (detailed):", err);
    res.status(500).json({ error: "Gemini request failed", details: String(err) });
  }
}
