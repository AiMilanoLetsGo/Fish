import Dexie, { Table } from "dexie";
import type { InventoryItem, Recipe, Transaction } from "./types";

export interface LogEntry {
  id: string;
  message: string;
  createdAt: string;
}

export class BodegaDB extends Dexie {
  inventory!: Table<InventoryItem, string>;
  recipes!: Table<Recipe, string>;
  transactions!: Table<Transaction, string>;
  logs!: Table<LogEntry, string>;

  constructor() {
    super("BodegaDB");
    this.version(1).stores({
      inventory: "id, name, sku, category",
      recipes: "id, menuItemId",
      transactions: "id, type, date",
      logs: "id, createdAt",
    });
  }
}

export const db = new BodegaDB();

const seedInventory: InventoryItem[] = [
  {
    id: "inv-1",
    name: "Ground Beef",
    sku: "BEEF-GB-001",
    category: "Meat",
    currentStock: 42,
    unit: "kg",
    minThreshold: 10,
    supplier: "Prairie Meats",
    lastPrice: 9.5,
    conversionFactor: 1000,
  },
  {
    id: "inv-2",
    name: "Burger Buns",
    sku: "BUN-001",
    category: "DryGoods",
    currentStock: 180,
    unit: "unit",
    minThreshold: 60,
    supplier: "Northern Bakery",
    lastPrice: 0.45,
    conversionFactor: 1,
  },
  {
    id: "inv-3",
    name: "Cheddar Cheese",
    sku: "CHEE-001",
    category: "Dairy",
    currentStock: 22,
    unit: "kg",
    minThreshold: 5,
    supplier: "Maple Dairy",
    lastPrice: 11.2,
    conversionFactor: 1000,
  },
];

const seedRecipes: Recipe[] = [
  {
    id: "rec-1",
    menuItemId: "menu-burger",
    ingredients: [
      { itemId: "inv-1", qty: 150, unit: "g" },
      { itemId: "inv-2", qty: 1, unit: "unit" },
      { itemId: "inv-3", qty: 20, unit: "g" },
    ],
  },
];

export async function seedDatabase(): Promise<void> {
  const existing = await db.inventory.count();
  if (existing > 0) {
    return;
  }

  await db.transaction("rw", db.inventory, db.recipes, db.logs, async () => {
    await db.inventory.bulkAdd(seedInventory);
    await db.recipes.bulkAdd(seedRecipes);
    await db.logs.add({
      id: "log-seed",
      message: "Seeded initial inventory and recipes.",
      createdAt: new Date().toISOString(),
    });
  });
}
