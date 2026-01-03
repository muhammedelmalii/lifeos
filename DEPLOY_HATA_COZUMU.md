# 🔧 Vercel Deploy Hatası Çözümü

## Sorun
Vercel build hatası: `Command 'npx expo export:web' exited with 1`

## Çözüm

### 1. Vercel Settings'te Build Command'ı Manuel Ayarla

Vercel Dashboard'da:
1. Projenize gidin
2. **Settings** → **General** → **Build & Development Settings**
3. **Build Command** alanını bulun
4. Şu komutu yazın: `npm run build:web`
5. **Save** butonuna tıklayın

### 2. Node.js Versiyonunu Kontrol Et

**Settings** → **General** → **Node.js Version**
- `18.x` seçili olduğundan emin olun

### 3. Environment Variables Kontrol

**Settings** → **Environment Variables**
Şunların ekli olduğundan emin olun:
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_OPENAI_API_KEY` (opsiyonel)

### 4. Cache Temizle ve Yeniden Deploy

1. **Deployments** sayfasına gidin
2. En son deployment'ın yanındaki "..." menüsüne tıklayın
3. **Redeploy** → **Use existing Build Cache** seçeneğini KALDIR
4. **Redeploy** butonuna tıklayın

## Alternatif Çözüm

Eğer yukarıdaki çözümler işe yaramazsa:

1. Vercel CLI ile deploy edin:
```bash
npm i -g vercel
vercel --prod
```

2. Veya Vercel Dashboard'da:
   - **Settings** → **General**
   - **Framework Preset**: **Other** seçin
   - **Build Command**: `npm run build:web` yazın
   - **Output Directory**: `dist` yazın
   - **Install Command**: `npm install` yazın

## Doğru Komutlar

✅ **Doğru**: `npm run build:web` (package.json'daki script'i çalıştırır)
✅ **Doğru**: `npx expo export --platform web` (package.json içinde)

❌ **Yanlış**: `npx expo export:web` (Bu format geçersiz)

## Kontrol Listesi

- [ ] Vercel Settings'te Build Command manuel olarak `npm run build:web` olarak ayarlı
- [ ] Node.js Version `18.x` seçili
- [ ] Environment Variables ekli
- [ ] Cache temizlenmiş
- [ ] Yeniden deploy yapılmış

