import { GoogleGenerativeAI } from "@google/generative-ai";
import type { ReceiptAnalysisResult } from "../types";

const SYSTEM_PROMPT = `Extract data from this Canadian receipt.
1. Details: Supplier, Date, Invoice #.
2. Financials: Subtotal, GST, HST, Total (CAD).
3. Items: Extract 'raw_name', 'qty', 'unit', 'price'.
4. Mapping: Compare 'raw_name' with the provided 'currentInventoryList'. If fuzzy match > 85%, return the matched System ID.
5. Alerts: Check for 'Lot No' or 'Batch No' for HACCP.
Return a strict JSON object with keys: details, financials, items, alerts.`;

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Invalid file data"));
        return;
      }
      resolve(result.split(",")[1] ?? "");
    };
    reader.readAsDataURL(file);
  });
}

export async function analyzeReceipt(
  imageFile: File,
  currentInventoryList: string[]
): Promise<ReceiptAnalysisResult> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
    if (!apiKey) {
      throw new Error("Missing VITE_GEMINI_API_KEY");
    }

    const base64 = await fileToBase64(imageFile);
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `${SYSTEM_PROMPT}\n\nCurrent inventory list with IDs: ${currentInventoryList.join(
      ", "
    )}`;

    const result = await model.generateContent([
      {
        inlineData: {
          data: base64,
          mimeType: imageFile.type,
        },
      },
      { text: prompt },
    ]);

    const responseText = result.response.text();
    const jsonStart = responseText.indexOf("{");
    const jsonEnd = responseText.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("Gemini response did not contain JSON");
    }

    const jsonText = responseText.slice(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonText) as ReceiptAnalysisResult;
  } catch (error) {
    console.error("Receipt analysis failed", error);
    throw error;
  }
}
