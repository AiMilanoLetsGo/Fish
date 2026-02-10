# Bodega Burger Online Stok Takip

Bu proje, verdiğiniz Telegram + fiş analiz yaklaşımını güvenli ve ölçeklenebilir bir **fullstack stok uygulamasına** çevirir:

- Hard-coded anahtarlar kaldırıldı, `.env` ile yönetiliyor.
- Otomatik kategori atama (anahtar kelime tabanlı) eklendi.
- Web panelden stok girişleri, AI ile fişten toplu ekleme, kategori & düşük stok takibi sağlandı.
- Telegram komut entegrasyonu (`/ekle|urun|miktar|fiyat`, `/dus|urun|miktar`) API endpoint olarak sunuldu.

## Kurulum

```bash
npm install
cp .env.example .env
npm start
```

Tarayıcıdan: `http://localhost:3000`

## API Özeti

- `GET /api/dashboard` → ürünler, özet, hareketler
- `POST /api/stock/in` → stok girişi
- `POST /api/stock/out` → stok düşümü
- `POST /api/receipt/analyze` → OpenAI ile fiş metni analiz + stok girişi
- `POST /api/integrations/telegram` → telegram webhook komutları

## Güvenlik Notları

- API anahtarlarını kod içine yazmayın.
- Telegram webhook endpoint’ini reverse proxy ile token doğrulama veya IP allowlist ile koruyun.
