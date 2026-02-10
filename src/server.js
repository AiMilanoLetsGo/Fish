import "dotenv/config";
import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { enrichItems } from "./services/categorizer.js";
import { addItems, getDashboard, useItem } from "./services/stockStore.js";
import { analyzeReceiptText } from "./services/aiService.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static(path.resolve(__dirname, "../public")));

app.get("/api/dashboard", async (_req, res) => {
  const data = await getDashboard();
  res.json(data);
});

app.post("/api/stock/in", async (req, res) => {
  try {
    const payload = Array.isArray(req.body.items) ? req.body.items : [];
    const items = enrichItems(payload);
    const db = await addItems(items);
    res.status(201).json({ message: `${items.length} kalem stok girişi yapıldı.`, items: db.items });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/stock/out", async (req, res) => {
  try {
    const { productName, quantity } = req.body;
    const db = await useItem(productName, Number(quantity));
    res.json({ message: "Stok düşümü işlendi.", items: db.items });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/receipt/analyze", async (req, res) => {
  try {
    const { receiptText } = req.body;
    const items = await analyzeReceiptText(receiptText, process.env.OPENAI_API_KEY, process.env.OPENAI_MODEL || "gpt-4o-mini");
    const db = await addItems(items);
    res.status(201).json({ message: "Fiş başarıyla işlendi.", extractedItems: items, items: db.items });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/integrations/telegram", async (req, res) => {
  const update = req.body;
  if (!update.message?.text) {
    return res.status(200).json({ message: "ignored" });
  }

  const text = update.message.text.trim();

  if (text.startsWith("/ekle")) {
    const [, productName, quantityStr, unitPriceStr] = text.split("|").map((part) => part.trim());
    const items = enrichItems([
      {
        productName,
        quantity: Number(quantityStr),
        unitPrice: Number(unitPriceStr),
        source: "telegram"
      }
    ]);
    await addItems(items);
    return res.json({ message: "Telegram stok girişi işlendi." });
  }

  if (text.startsWith("/dus")) {
    const [, productName, quantityStr] = text.split("|").map((part) => part.trim());
    await useItem(productName, Number(quantityStr));
    return res.json({ message: "Telegram stok düşümü işlendi." });
  }

  return res.json({ message: "Komut tanınmadı. /ekle|urun|miktar|fiyat veya /dus|urun|miktar" });
});

app.get("*", (_req, res) => {
  res.sendFile(path.resolve(__dirname, "../public/index.html"));
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`Bodega Burger stok uygulaması çalışıyor: http://localhost:${port}`);
});
