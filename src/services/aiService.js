import { enrichItems } from "./categorizer.js";

export async function analyzeReceiptText(rawText, apiKey, model) {
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY tanımlı değil.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Bir restoran stok asistanısın. Fiş/alışveriş metninden ürünleri çıkarıp sadece JSON dön. JSON formatı: {\"items\":[{\"urun\":\"...\",\"miktar\":number,\"fiyat\":number,\"kategori\":\"...\"}]}"
        },
        {
          role: "user",
          content: `Fiş metni:\n${rawText}`
        }
      ]
    })
  });

  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error?.message ?? "OpenAI yanıt hatası.");
  }

  const parsed = JSON.parse(json.choices[0].message.content);
  return enrichItems(parsed.items ?? []).map((item) => ({ ...item, source: "ai-receipt" }));
}
