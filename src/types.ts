export type Category = "Meat" | "Produce" | "Dairy" | "DryGoods" | "Frozen" | "Cleaning";

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: Category;
  currentStock: number;
  unit: string;
  minThreshold: number;
  supplier: string;
  lastPrice: number;
  conversionFactor: number;
}

export interface Recipe {
  id: string;
  menuItemId: string;
  ingredients: { itemId: string; qty: number; unit: string }[];
}

export interface TransactionItem {
  itemId: string;
  qty: number;
  unit: string;
  price: number;
}

export interface Transaction {
  id: string;
  type: "IN" | "OUT" | "WASTE";
  date: string;
  items: TransactionItem[];
  taxes: { gst: number; hst: number };
  haccp: { temp: number; batchNo: string };
  invoiceImageHash: string;
}

export interface ReceiptAnalysisResult {
  details: {
    supplier: string;
    date: string;
    invoiceNumber: string;
  };
  financials: {
    subtotal: number;
    gst: number;
    hst: number;
    total: number;
    currency: "CAD";
  };
  items: {
    raw_name: string;
    qty: number;
    unit: string;
    price: number;
    matchedItemId?: string;
  }[];
  alerts: {
    lotNumbers: string[];
    batchNumbers: string[];
  };
}
