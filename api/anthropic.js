// Vercel Serverless Function — proxy seguro para a API da Anthropic.
// A chave fica SÓ no servidor (variável de ambiente ANTHROPIC_API_KEY).
// O browser chama /api/anthropic; esta função reencaminha para a Anthropic.

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY não configurada no Vercel." });
    return;
  }

  try {
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };

    // Reencaminha qualquer header anthropic-beta enviado pelo cliente (ex.: web-fetch).
    const beta = req.headers["anthropic-beta"];
    if (beta) headers["anthropic-beta"] = beta;

    const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body);

    const upstream = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers,
      body,
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader("Content-Type", "application/json");
    res.send(text);
  } catch (err) {
    res.status(500).json({ error: "Proxy error", detail: String(err) });
  }
}
