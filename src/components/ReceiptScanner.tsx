import { useMemo, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Save, AlertTriangle } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../db";
import type { Category, ReceiptAnalysisResult } from "../types";
import { analyzeReceipt } from "../services/geminiService";

const categories: Category[] = [
  "Meat",
  "Produce",
  "Dairy",
  "DryGoods",
  "Frozen",
  "Cleaning",
];

const PRICE_VARIANCE_THRESHOLD = 0.2;

export default function ReceiptScanner() {
  const inventory = useLiveQuery(() => db.inventory.toArray(), []);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ReceiptAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newItemCategories, setNewItemCategories] = useState<Record<string, Category>>({});

  const inventoryIdList = useMemo(
    () => (inventory ?? []).map((item) => `${item.id}:${item.name}`),
    [inventory]
  );

  const onDrop = async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) {
      return;
    }

    setPreviewUrl(URL.createObjectURL(file));
    setIsAnalyzing(true);
    setError(null);

    try {
      const result = await analyzeReceipt(file, inventoryIdList);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to analyze receipt");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
  });

  const handleCategoryChange = (rawName: string, category: Category) => {
    setNewItemCategories((prev) => ({ ...prev, [rawName]: category }));
  };

  const handleSave = async () => {
    if (!analysis || !inventory) {
      return;
    }

    await db.transaction("rw", db.inventory, async () => {
      for (const item of analysis.items) {
        const matched = inventory.find((inv) => inv.id === item.matchedItemId);
        if (matched) {
          const normalizedQty = normalizeQuantity(item.qty, item.unit, matched.unit, matched.conversionFactor);
          await db.inventory.update(matched.id, {
            currentStock: matched.currentStock + normalizedQty,
            lastPrice: item.price,
            supplier: analysis.details.supplier || matched.supplier,
          });
        } else {
          const category = newItemCategories[item.raw_name] ?? "DryGoods";
          await db.inventory.add({
            id: `inv-${crypto.randomUUID()}`,
            name: item.raw_name,
            sku: `SKU-${Math.floor(Math.random() * 100000)}`,
            category,
            currentStock: item.qty,
            unit: item.unit,
            minThreshold: 5,
            supplier: analysis.details.supplier,
            lastPrice: item.price,
            conversionFactor: item.unit === "kg" ? 1000 : 1,
          });
        }
      }
    });
  };

  const dataRows = analysis?.items ?? [];

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div
          {...getRootProps()}
          className={`flex h-96 flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center transition ${
            isDragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-200"
          }`}
        >
          <input {...getInputProps()} />
          {previewUrl ? (
            <img src={previewUrl} alt="Receipt preview" className="h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-500">
              <FileText className="h-10 w-10" />
              <p className="text-sm">Drag & drop a receipt image or click to upload.</p>
            </div>
          )}
        </div>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </section>

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Receipt Details</h2>
            <p className="text-sm text-slate-500">
              {analysis ? analysis.details.supplier : "Awaiting receipt analysis"}
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!analysis}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            <Save className="h-4 w-4" />
            Save to Inventory
          </button>
        </div>

        {isAnalyzing && <p className="text-sm text-slate-500">Analyzing receipt with Gemini...</p>}

        {!isAnalyzing && dataRows.length === 0 && (
          <p className="text-sm text-slate-500">Upload a receipt to see extracted line items.</p>
        )}

        {dataRows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2">Item</th>
                  <th className="px-3 py-2">Qty</th>
                  <th className="px-3 py-2">Price</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Category</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dataRows.map((row) => {
                  const matchedInfo = row.matchedItemId
                    ? inventory?.find((item) => item.id === row.matchedItemId)
                    : undefined;
                  const priceVariance = matchedInfo
                    ? (row.price - matchedInfo.lastPrice) / Math.max(matchedInfo.lastPrice, 1)
                    : 0;
                  const isInflationAlert = priceVariance > PRICE_VARIANCE_THRESHOLD;

                  return (
                    <tr key={row.raw_name} className={isInflationAlert ? "bg-amber-50" : undefined}>
                      <td className="px-3 py-3 font-medium text-slate-900">{row.raw_name}</td>
                      <td className="px-3 py-3 text-slate-600">
                        {row.qty} {row.unit}
                      </td>
                      <td className="px-3 py-3 text-slate-600">${row.price.toFixed(2)}</td>
                      <td className="px-3 py-3 text-slate-600">
                        {isInflationAlert ? (
                          <span className="inline-flex items-center gap-1 text-amber-600">
                            <AlertTriangle className="h-4 w-4" /> Inflation Alert
                          </span>
                        ) : matchedInfo ? (
                          "Matched"
                        ) : (
                          "New Item"
                        )}
                      </td>
                      <td className="px-3 py-3 text-slate-600">
                        {matchedInfo ? (
                          matchedInfo.category
                        ) : (
                          <select
                            value={newItemCategories[row.raw_name] ?? "DryGoods"}
                            onChange={(event) =>
                              handleCategoryChange(row.raw_name, event.target.value as Category)
                            }
                            className="rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                          >
                            {categories.map((category) => (
                              <option key={category} value={category}>
                                {category}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function normalizeQuantity(
  qty: number,
  fromUnit: string,
  toUnit: string,
  conversionFactor: number
): number {
  if (fromUnit === toUnit) {
    return qty;
  }

  if (fromUnit === "g" && toUnit === "kg") {
    return qty / conversionFactor;
  }

  if (fromUnit === "kg" && toUnit === "g") {
    return qty * conversionFactor;
  }

  return qty;
}
