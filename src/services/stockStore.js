import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, "../../data/stock.json");

const INITIAL_STATE = {
  items: [],
  movements: []
};

async function ensureDbFile() {
  try {
    await fs.access(DB_PATH);
  } catch {
    await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(INITIAL_STATE, null, 2), "utf-8");
  }
}

async function readDb() {
  await ensureDbFile();
  const raw = await fs.readFile(DB_PATH, "utf-8");
  return JSON.parse(raw);
}

async function writeDb(data) {
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export async function addItems(newItems) {
  const db = await readDb();

  for (const newItem of newItems) {
    const existing = db.items.find(
      (item) =>
        item.productName.toLocaleLowerCase("tr-TR") === newItem.productName.toLocaleLowerCase("tr-TR") &&
        item.category === newItem.category
    );

    if (existing) {
      existing.quantity += newItem.quantity;
      existing.lastUpdatedAt = new Date().toISOString();
    } else {
      db.items.push({
        ...newItem,
        createdAt: new Date().toISOString(),
        lastUpdatedAt: new Date().toISOString()
      });
    }

    db.movements.push({
      type: "IN",
      ...newItem,
      createdAt: new Date().toISOString()
    });
  }

  await writeDb(db);
  return db;
}

export async function useItem(productName, quantity) {
  const db = await readDb();
  const target = db.items.find(
    (item) => item.productName.toLocaleLowerCase("tr-TR") === productName.toLocaleLowerCase("tr-TR")
  );

  if (!target) {
    throw new Error("Ürün stokta bulunamadı.");
  }

  if (target.quantity < quantity) {
    throw new Error("Stok yetersiz.");
  }

  target.quantity -= quantity;
  target.lastUpdatedAt = new Date().toISOString();

  db.movements.push({
    type: "OUT",
    productName: target.productName,
    category: target.category,
    quantity,
    unitPrice: target.unitPrice,
    totalPrice: Number((quantity * target.unitPrice).toFixed(2)),
    source: "sale",
    createdAt: new Date().toISOString()
  });

  await writeDb(db);
  return db;
}

export async function getDashboard() {
  const db = await readDb();

  const byCategory = db.items.reduce((acc, item) => {
    const current = acc[item.category] ?? { category: item.category, totalItems: 0, stockValue: 0 };
    current.totalItems += item.quantity;
    current.stockValue += item.quantity * item.unitPrice;
    acc[item.category] = current;
    return acc;
  }, {});

  const lowStock = db.items.filter((item) => item.quantity <= 5);

  return {
    items: db.items.sort((a, b) => a.category.localeCompare(b.category, "tr")),
    movements: db.movements.slice(-30).reverse(),
    summary: {
      uniqueProducts: db.items.length,
      totalStockValue: Number(
        db.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0).toFixed(2)
      ),
      categories: Object.values(byCategory),
      lowStock
    }
  };
}
