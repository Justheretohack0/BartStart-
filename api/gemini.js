// /api/gemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const message = body?.message || "Hello from BartStart";

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

    const result = await model.generateContent(message);
    const reply = result.response.text();

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("Gemini API error:", error);
    return res.status(500).json({ error: "Gemini request failed" });
  }
}
