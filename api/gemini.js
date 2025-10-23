import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  try {
    const { message } = await req.json();
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(message);
    res.status(200).json({ reply: result.response.text() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Gemini request failed" });
  }
}
