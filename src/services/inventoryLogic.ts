import { db } from "../db";
import type { InventoryItem } from "../types";

export async function deductRecipeItems(
  menuItemId: string,
  qty: number
): Promise<void> {
  const recipe = await db.recipes.where("menuItemId").equals(menuItemId).first();
  if (!recipe) {
    throw new Error(`Recipe not found for menu item ${menuItemId}`);
  }

  await db.transaction("rw", db.inventory, async () => {
    for (const ingredient of recipe.ingredients) {
      const item = await db.inventory.get(ingredient.itemId);
      if (!item) {
        continue;
      }

      // Backflushing logic: translate a sold menu item into raw ingredient usage.
      const requiredQty = ingredient.qty * qty;

      // Unit conversion logic: normalize ingredient units to the inventory base unit.
      const normalizedQty = normalizeQuantity(
        requiredQty,
        ingredient.unit,
        item.unit,
        item.conversionFactor
      );

      const updatedStock = Math.max(item.currentStock - normalizedQty, 0);
      await db.inventory.update(item.id, { currentStock: updatedStock });
    }
  });
}

export async function checkParLevels(): Promise<InventoryItem[]> {
  return db.inventory.filter((item) => item.currentStock < item.minThreshold).toArray();
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
