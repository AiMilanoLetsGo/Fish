import test from "node:test";
import assert from "node:assert/strict";
import { categorizeProduct, enrichItems } from "../src/services/categorizer.js";

test("categorizeProduct classifies common products", () => {
  assert.equal(categorizeProduct("Dana Burger Köftesi"), "Et & Tavuk");
  assert.equal(categorizeProduct("Büyük Boy Burger Ekmeği"), "Ekmek & Hamur");
  assert.equal(categorizeProduct("Bilinmeyen Ürün"), "Genel");
});

test("enrichItems computes totals and defaults", () => {
  const [item] = enrichItems([{ urun: "Kaşar peyniri", miktar: 2, fiyat: 25 }]);
  assert.equal(item.category, "Süt Ürünleri");
  assert.equal(item.totalPrice, 50);
});
