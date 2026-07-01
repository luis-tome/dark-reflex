// Endpoint separado para web-fetch — timeout mais alto que o proxy principal.
// O Vercel Hobby limita a 60s mas o web-fetch da Anthropic pode demorar mais.
// Solução: streaming não é necessário aqui, só precisamos de mais tempo.

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-fetch-2025-09-10",
      },
      body,
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", "application/json");
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: "Webfetch proxy error", detail: String(err) });
  }
}
