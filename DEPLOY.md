# 🚀 Deploy Rehberi

## Vercel Deploy (Web)

### 1. GitHub'a Push Edildi ✅

Kod GitHub'da: `https://github.com/muhammedelmalii/lifeos.git`

### 2. Vercel'de Deploy Et

1. **https://vercel.com/new** adresine git
2. **GitHub** ile giriş yap
3. **Import Git Repository** → `lifeos` repo'yu seç
4. **Deploy** butonuna tıkla

**Ayarlar otomatik gelecek (veya manuel ekle):**
- Build Command: `npm run build:web`
- Output Directory: `dist`
- Framework: Other

**ÖNEMLİ:** Node.js Version'ı Vercel Settings'ten ayarlayın:
- Vercel Dashboard → Settings → General → Node.js Version → `18.x` seçin
- Bu ayar `vercel.json`'da değil, Vercel Settings'te yapılmalı!

### 3. Environment Variables Ekle

Deploy başladıktan sonra:
1. **Settings** → **Environment Variables**
2. Şunları ekle:

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-api-key
```

3. **Production**, **Preview**, **Development** hepsini seç
4. **Save**
5. **Redeploy** yap

### 4. Test Et

Deploy tamamlandığında:
- URL: `https://lifeos-xxx.vercel.app`
- Web'de test et

## Mobil Test

Web deploy'dan sonra mobil test yap:

### Development Build

```bash
npm run build:android
```

Detaylar için `MOBIL_TEST_REHBERI.md` dosyasına bak.

## Sorun Giderme

### Build Hatası Alırsanız:

1. **Node.js Versiyonu**: Vercel Settings → General → Node.js Version → `18.x` seç
2. **Build Log Kontrolü**: Vercel dashboard'dan build loglarını kontrol et
3. **Environment Variables**: Tüm `EXPO_PUBLIC_*` değişkenlerin ekli olduğundan emin ol
4. **Cache Temizle**: Vercel'de "Clear Cache and Redeploy" yap

### Yaygın Hatalar:

- **`npx expo export:web` hatası**: Vercel eski komut kullanıyor olabilir. Vercel Settings → General → Build & Development Settings → Build Command'ı `npm run build:web` olarak ayarla
- `expo export` komutu bulunamadı → `npm install` çalıştır
- Environment variables undefined → Vercel Settings'te değişkenleri kontrol et
- Build timeout → Vercel Pro plan gerekebilir (büyük projeler için)
- **Cache sorunu**: Vercel'de "Clear Cache and Redeploy" yap

## Notlar

- Vercel web versiyonu için
- Mobil için EAS Build kullan
- Her ikisi de aynı kod tabanını kullanır

