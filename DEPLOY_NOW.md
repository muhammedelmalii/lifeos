# 🚀 Şimdi Deploy Et - Adım Adım

## ⚡ Hızlı Yol (Dashboard - Önerilen)

### 1. GitHub'a Push Et

```bash
git add .
git commit -m "Ready for Vercel deployment"
git push origin main
```

### 2. Vercel Dashboard'da Deploy

1. **https://vercel.com/new** adresine git
2. **GitHub** ile giriş yap (ücretsiz hesap)
3. **Import Git Repository** → Projeyi seç
4. **Deploy** butonuna tıkla

**Ayarlar otomatik gelecek:**
- Build Command: `npm run build:web`
- Output Directory: `dist`
- Framework: Other

### 3. Environment Variables Ekle

Deploy başladıktan sonra:
1. **Settings** → **Environment Variables**
2. Şunları ekle:

```
EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-supabase-key
EXPO_PUBLIC_OPENAI_API_KEY=your-openai-key
```

3. **Production**, **Preview**, **Development** hepsini seç
4. **Save**
5. **Redeploy** yap

## 🔧 CLI ile Deploy (Alternatif)

### 1. Login

```bash
vercel login
```

Browser açılacak, giriş yap.

### 2. Deploy

```bash
vercel --prod
```

## ✅ Deploy Sonrası

- URL: `https://lifeos-xxx.vercel.app`
- Her commit otomatik deploy olur
- Preview URL'leri her branch için oluşur

## 🎯 Hızlı Test

Local'de test et:
```bash
npm run build:web
npx serve dist
```

## 📝 Notlar

- İlk deploy 2-3 dakika sürer
- Environment variables eklenmeden çalışmaz
- Custom domain ekleyebilirsin (Settings > Domains)

