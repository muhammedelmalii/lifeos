# 🚀 Vercel'de Deploy - Hızlı Başlangıç

## ✅ Hazır!

Proje Vercel için hazır. Build test edildi ve çalışıyor.

## 3 Adımda Deploy

### 1. GitHub'a Push Et

```bash
git add .
git commit -m "Vercel deployment ready"
git push
```

### 2. Vercel'e Bağla

1. [vercel.com/new](https://vercel.com/new) → GitHub repo'yu seç
2. **Import** tıkla
3. Ayarlar otomatik gelecek (vercel.json'dan)

### 3. Environment Variables Ekle

Vercel Dashboard > Settings > Environment Variables:

```
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
EXPO_PUBLIC_OPENAI_API_KEY=...
```

**Her değişken için:** Production ✅ Preview ✅ Development ✅

## Build Ayarları (Otomatik)

- **Build Command:** `npm run build:web`
- **Output Directory:** `dist`
- **Install Command:** `npm install`

## Deploy Sonrası

URL: `https://lifeos-xxx.vercel.app`

## Test

Local'de test et:
```bash
npm run build:web
npx serve dist
```

## Sorun Giderme

### Build hatası?
- Environment variables eklendi mi?
- `npm install` çalışıyor mu?

### Sayfa bulunamadı?
- `vercel.json` rewrites doğru mu?
- Output directory `dist` mi?

## Sonraki Adımlar

1. ✅ Deploy et
2. ✅ Custom domain bağla (opsiyonel)
3. ✅ Analytics ekle (opsiyonel)

