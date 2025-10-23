// /api/gemini.js
export default async function handler(req, res) {
  try {
    const body =
      typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const message = body?.message || "Hello from BartStart";
    const key = process.env.GEMINI_API_KEY;

    console.log("Gemini API route called");
    if (!key) {
      console.error("❌ No GEMINI_API_KEY found in environment");
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${key}`;
    console.log("➡️  Fetching from:", url);

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: message }] }],
      }),
    });

    console.log("✅ Fetch completed with status", response.status);

    const data = await response.json();
    if (!response.ok) {
      console.error("❌ Gemini API response error:", data);
      return res
        .status(500)
        .json({ error: "Gemini request failed", details: data });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "No response from Gemini.";
    res.status(200).json({ reply });
  } catch (err) {
    console.error("❌ Gemini API route threw an error:", err);
    res.status(500).json({ error: "Gemini request failed", details: String(err) });
  }
}
