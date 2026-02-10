const CATEGORY_KEYWORDS = {
  "Et & Tavuk": ["köfte", "et", "dana", "tavuk", "but", "göğüs"],
  "Ekmek & Hamur": ["ekmek", "ekmegi", "lavaş", "tortilla", "bun", "pide"],
  "Sebze": ["domates", "soğan", "marul", "turşu", "biber", "patates"],
  "Sos & Baharat": ["sos", "ketçap", "mayonez", "hardal", "bbq", "baharat", "tuz"],
  "Süt Ürünleri": ["peynir", "kaşar", "yoğurt", "tereyağ", "süt"],
  "İçecek": ["kola", "ayran", "su", "ice tea", "fanta"],
  "Temizlik": ["deterjan", "dezenfektan", "çamaşır suyu", "eldiven", "peçete"],
  "Ambalaj": ["kutu", "kap", "poşet", "bardak", "pipet", "folyo"]
};

export function normalizeText(value = "") {
  return value
    .toString()
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function categorizeProduct(productName = "") {
  const normalized = normalizeText(productName);

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => normalized.includes(normalizeText(keyword)))) {
      return category;
    }
  }

  return "Genel";
}

export function enrichItems(items = []) {
  return items.map((item) => {
    const quantity = Number(item.quantity ?? item.miktar ?? 0);
    const unitPrice = Number(item.unitPrice ?? item.fiyat ?? 0);
    const productName = item.productName ?? item.urun ?? "Bilinmiyor";

    return {
      category: item.category ?? item.kategori ?? categorizeProduct(productName),
      productName,
      quantity,
      unitPrice,
      totalPrice: Number((quantity * unitPrice).toFixed(2)),
      source: item.source ?? "manual"
    };
  });
}
